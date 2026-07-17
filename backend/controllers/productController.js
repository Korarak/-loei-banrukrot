// controllers/productController.js
const mongoose = require('mongoose');
const { parse: parseCsv } = require('csv-parse/sync');
const { changeStock } = require('../utils/stockUtils');
const { applyDiscount } = require('../utils/pricing');
const { Product, ProductVariant, ProductImage, Category, OrderDetail } = require('../models');
const { csvProductRowSchema } = require('../models/validationSchemas');

const escapeCSV = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
// Trims each comma-separated brand token and dedupes, so however the admin
// types spacing/repeats ("SIP,PIAGGIO" / " SIP , sip ") it's stored consistently.
const normalizeBrand = (raw) => {
    if (!raw) return raw;
    return Array.from(new Set(String(raw).split(',').map(b => b.trim()).filter(Boolean))).join(', ');
};
const CSV_PRODUCT_EXPORT_LIMIT = 2000;
const CSV_PRODUCT_IMPORT_LIMIT = 2000;

// @desc    Get all products with variants and images
// @route   GET /api/products
// @access  Public
exports.getAllProducts = async (req, res, next) => {
    try {
        const { page = 1, limit, search, categoryId, isActive, sort, brand, minPrice, maxPrice, scope, channel } = req.query;
        const pageNum = parseInt(page);
        // Admin/POS screens list the whole catalog client-side (search/sort/filter all happen
        // in-browser), so they get a much higher default+cap than the public storefront, which
        // paginates for real and should never pull the entire catalog in one request.
        const isInternalScope = scope === 'admin' || scope === 'pos';
        const requestedLimit = parseInt(limit);
        const defaultLimit = isInternalScope ? 1000 : 20;
        const maxLimit = isInternalScope ? 2000 : 100;
        const limitNum = Math.min(requestedLimit || defaultLimit, maxLimit);
        const skip = (pageNum - 1) * limitNum;

        // 1. Base Match Stage (Common filters)
        const baseMatch = {};
        if (search) {
            baseMatch.productName = { $regex: search, $options: 'i' };
        }
        if (categoryId) {
            baseMatch.categoryId = parseInt(categoryId);
        }
        // Only filter by isActive if explicitly provided
        if (isActive !== undefined) {
            baseMatch.isActive = isActive === 'true';
        }

        // Brand Filter — brand is stored as a comma-separated list (e.g. "SIP, PIAGGIO"),
        // so match products whose list intersects with the requested brand(s), not an
        // exact-string match against the whole field.
        if (brand) {
            const requestedBrands = (Array.isArray(brand) ? brand : brand.split(','))
                .map(b => b.trim().toLowerCase())
                .filter(Boolean);
            if (requestedBrands.length > 0) {
                baseMatch.$expr = {
                    $gt: [
                        {
                            $size: {
                                $setIntersection: [
                                    {
                                        $map: {
                                            input: { $split: [{ $ifNull: ['$brand', ''] }, ','] },
                                            as: 'b',
                                            in: { $toLower: { $trim: { input: '$$b' } } }
                                        }
                                    },
                                    requestedBrands
                                ]
                            }
                        },
                        0
                    ]
                };
            }
        }

        // 2. Calculate Stats (Counts based on baseMatch ONLY)
        const [totalCount, posCount, onlineCount] = await Promise.all([
            Product.countDocuments(baseMatch),
            Product.countDocuments({ ...baseMatch, isPos: true }),
            Product.countDocuments({ ...baseMatch, isOnline: true })
        ]);

        // 3. Main Query Match Stage (Includes Scope/Channel)
        const matchStage = { ...baseMatch };

        // Filter Sales Channels logic
        if (channel === 'pos') {
            matchStage.isPos = true;
        } else if (channel === 'online') {
            matchStage.isOnline = true;
        }

        // Scope logic (if not admin scope, default to public online store)
        if (scope === 'pos') {
            // If specifically POS scope requested (e.g. from POS app), ensure isPos is true
            matchStage.isPos = true;
        } else if (scope !== 'admin' && !channel) {
            // Default (Public Store) - only if no specific channel requested
            matchStage.isOnline = true;
        }

        // 2. Sort Stage
        let sortStage = { dateCreated: -1 }; // Default: Newest
        if (sort === 'price_asc') sortStage = { minPrice: 1 };
        if (sort === 'price_desc') sortStage = { minPrice: -1 };
        if (sort === 'name_asc') sortStage = { productName: 1 };
        if (sort === 'name_desc') sortStage = { productName: -1 };

        const pipeline = [
            { $match: matchStage },
            // Lookup Variants to get Price
            {
                $lookup: {
                    from: 'productvariants',
                    localField: '_id',
                    foreignField: 'productId',
                    as: 'variants'
                }
            },
            // Add minPrice field for sorting and map stock
            {
                $addFields: {
                    minPrice: {
                        $cond: {
                            if: { $gt: [{ $size: "$variants" }, 0] },
                            then: { $min: "$variants.price" },
                            else: 0
                        }
                    },
                    variants: {
                        $map: {
                            input: '$variants',
                            as: 'v',
                            in: {
                                $mergeObjects: ['$$v', { stock: '$$v.stockAvailable' }]
                            }
                        }
                    }
                }
            },
            // Filter by price range if provided
            ...(minPrice || maxPrice ? [{
                $match: {
                    minPrice: {
                        ...(minPrice ? { $gte: parseFloat(minPrice) } : {}),
                        ...(maxPrice ? { $lte: parseFloat(maxPrice) } : {})
                    }
                }
            }] : []),
            // Sort (before pagination so we skip/limit from the right position)
            { $sort: sortStage },
            // Facet — images are fetched only for the current page
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [
                        { $skip: skip },
                        { $limit: limitNum },
                        {
                            $lookup: {
                                from: 'productimages',
                                localField: '_id',
                                foreignField: 'productId',
                                as: 'images'
                            }
                        }
                    ]
                }
            }
        ];

        const result = await Product.aggregate(pipeline);

        const data = result[0].data;
        const total = result[0].metadata[0] ? result[0].metadata[0].total : 0;

        // Post-process images sorting + attach discounted price per variant
        data.forEach(p => {
            if (p.images && Array.isArray(p.images)) {
                p.images.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
            }
            p.variants.forEach(v => {
                v.effectivePrice = applyDiscount(v.price, p.discountPercent);
            });
        });

        res.json({
            success: true,
            data: data,
            stats: {
                total: totalCount,
                pos: posCount,
                online: onlineCount
            },
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const variants = await ProductVariant.find({ productId: product._id });
        const images = await ProductImage.find({ productId: product._id }).sort({ sortOrder: 1 });

        // Map stockAvailable to stock for frontend consistency + attach discounted price
        const mappedVariants = variants.map(v => ({
            ...v.toObject(),
            stock: v.stockAvailable,
            effectivePrice: applyDiscount(v.price, product.discountPercent),
        }));

        res.json({
            success: true,
            data: {
                ...product.toObject(),
                variants: mappedVariants,
                images
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get popular products by order history (public, falls back to newest)
// @route   GET /api/products/popular
// @access  Public
exports.getPopularProducts = async (req, res, next) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 8, 20);
        const { OrderDetail, Order } = require('../models');

        // Only count sales from the last 90 days to keep rankings fresh
        const since = new Date();
        since.setDate(since.getDate() - 90);
        const recentOrderIds = await Order.distinct('_id', { orderDate: { $gte: since } });

        // Aggregate: variant sales → product sales
        const topProductIds = await OrderDetail.aggregate([
            { $match: { orderId: { $in: recentOrderIds } } },
            { $group: { _id: '$variantId', totalSold: { $sum: '$quantity' } } },
            {
                $lookup: {
                    from: 'productvariants',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'variant'
                }
            },
            { $unwind: '$variant' },
            { $group: { _id: '$variant.productId', totalSold: { $sum: '$totalSold' } } },
            { $sort: { totalSold: -1 } },
            { $limit: limit * 2 } // over-fetch to account for inactive/offline products
        ]);

        let products = [];

        if (topProductIds.length > 0) {
            const ids = topProductIds.map(p => p._id);
            const salesMap = Object.fromEntries(topProductIds.map(p => [p._id.toString(), p.totalSold]));

            const pipeline = [
                { $match: { _id: { $in: ids }, isActive: true, isOnline: true } },
                { $lookup: { from: 'productvariants', localField: '_id', foreignField: 'productId', as: 'variants' } },
                { $addFields: { variants: { $map: { input: '$variants', as: 'v', in: { $mergeObjects: ['$$v', { stock: '$$v.stockAvailable' }] } } } } },
                { $lookup: { from: 'productimages', localField: '_id', foreignField: 'productId', as: 'images' } },
                { $limit: limit }
            ];

            const raw = await Product.aggregate(pipeline);
            // Sort by sales rank and attach totalSold
            raw.sort((a, b) => (salesMap[b._id.toString()] || 0) - (salesMap[a._id.toString()] || 0));
            products = raw.map(p => ({ ...p, totalSold: salesMap[p._id.toString()] || 0 }));
        }

        // Fallback to newest if no order history
        if (products.length < limit) {
            const needed = limit - products.length;
            const existingIds = products.map(p => p._id);
            const pipeline = [
                { $match: { isActive: true, isOnline: true, _id: { $nin: existingIds } } },
                { $sort: { dateCreated: -1 } },
                { $limit: needed },
                { $lookup: { from: 'productvariants', localField: '_id', foreignField: 'productId', as: 'variants' } },
                { $addFields: { variants: { $map: { input: '$variants', as: 'v', in: { $mergeObjects: ['$$v', { stock: '$$v.stockAvailable' }] } } } } },
                { $lookup: { from: 'productimages', localField: '_id', foreignField: 'productId', as: 'images' } },
            ];
            const fallback = await Product.aggregate(pipeline);
            products = [...products, ...fallback];
        }

        // Sort images + attach discounted price per variant
        products.forEach(p => {
            if (p.images) p.images.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
            if (p.variants) {
                p.variants.forEach(v => {
                    v.effectivePrice = applyDiscount(v.price, p.discountPercent);
                });
            }
        });

        res.json({ success: true, data: products });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private (staff/owner)
exports.createProduct = async (req, res, next) => {
    try {
        const { productName, description, categoryId, brand, shippingSize, discountPercent, variants, images } = req.body;

        // สร้างสินค้า
        const product = await Product.create({
            productName,
            description,
            categoryId,
            brand: normalizeBrand(brand),
            shippingSize: shippingSize || 'small',
            discountPercent: discountPercent || 0,
            isOnline: req.body.isOnline !== undefined ? req.body.isOnline : true,
            isPos: req.body.isPos !== undefined ? req.body.isPos : true
        });

        // สร้าง variants ถ้ามี
        if (variants && variants.length > 0) {
            const variantDocs = variants.map(v => ({
                productId: product._id,
                sku: v.sku,
                price: v.price,
                stockAvailable: v.stock // map stock to stockAvailable
            }));
            await ProductVariant.insertMany(variantDocs);
        }

        // สร้าง images ถ้ามี
        if (images && images.length > 0) {
            const imageDocs = images.map((img, index) => ({
                productId: product._id,
                imagePath: img.imagePath,
                blurDataURL: img.blurDataURL,
                isPrimary: img.isPrimary || index === 0,
                sortOrder: img.sortOrder || index
            }));
            await ProductImage.insertMany(imageDocs);
        }

        // After creating variants, map stockAvailable to stock for frontend
        const createdVariants = await ProductVariant.find({ productId: product._id });
        const mappedCreatedVariants = createdVariants.map(v => ({
            ...v.toObject(),
            stock: v.stockAvailable,
            effectivePrice: applyDiscount(v.price, product.discountPercent),
        }));
        const createdImages = await ProductImage.find({ productId: product._id });

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: {
                ...product.toObject(),
                variants: mappedCreatedVariants,
                images: createdImages
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (staff/owner)
exports.updateProduct = async (req, res, next) => {
    try {
        const { productName, description, categoryId, brand, shippingSize, discountPercent, isActive, variants } = req.body;

        // Update product basic info
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            {
                productName, description, categoryId, brand: normalizeBrand(brand), shippingSize, discountPercent, isActive,
                isOnline: req.body.isOnline,
                isPos: req.body.isPos
            },
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Update variants if provided
        if (variants && variants.length > 0) {
            const existingVariants = await ProductVariant.find({ productId: req.params.id });
            const existingBySku = new Map(existingVariants.map(v => [v.sku, v]));
            const newSkus = new Set(variants.map(v => v.sku));

            // Delete variants no longer in the list
            const toDelete = existingVariants.filter(v => !newSkus.has(v.sku));
            if (toDelete.length > 0) {
                await ProductVariant.deleteMany({ _id: { $in: toDelete.map(v => v._id) } });
            }

            // Upsert each variant by SKU to preserve IDs and stock levels
            for (const v of variants) {
                const existing = existingBySku.get(v.sku);
                if (existing) {
                    await ProductVariant.findByIdAndUpdate(existing._id, { price: v.price });
                } else {
                    await ProductVariant.create({
                        productId: product._id,
                        sku: v.sku,
                        price: v.price,
                        stockAvailable: v.stock ?? 0,
                    });
                }
            }
        }

        // Fetch updated variants and images
        const updatedVariants = await ProductVariant.find({ productId: product._id });
        const mappedUpdatedVariants = updatedVariants.map(v => ({
            ...v.toObject(),
            effectivePrice: applyDiscount(v.price, product.discountPercent),
        }));
        const images = await ProductImage.find({ productId: product._id });

        res.json({
            success: true,
            message: 'Product updated successfully',
            data: {
                ...product.toObject(),
                variants: mappedUpdatedVariants,
                images
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (owner only)
exports.deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // ลบ variants และ images ที่เกี่ยวข้อง
        await ProductVariant.deleteMany({ productId: req.params.id });
        await ProductImage.deleteMany({ productId: req.params.id });

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// ==================== BULK ACTIONS ====================

// @desc    Bulk toggle sales channel (isPos/isOnline) for multiple products
// @route   PATCH /api/products/bulk-channel
// @access  Private (staff/owner)
exports.bulkUpdateChannel = async (req, res, next) => {
    try {
        const { productIds, isPos, isOnline } = req.body;

        const updateFields = {};
        if (isPos !== undefined) updateFields.isPos = isPos;
        if (isOnline !== undefined) updateFields.isOnline = isOnline;

        const result = await Product.updateMany(
            { _id: { $in: productIds } },
            { $set: updateFields }
        );

        res.json({
            success: true,
            message: 'Products updated successfully',
            data: { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Bulk change category for multiple products
// @route   PATCH /api/products/bulk-category
// @access  Private (staff/owner)
exports.bulkUpdateCategory = async (req, res, next) => {
    try {
        const { productIds, categoryId } = req.body;

        const category = await Category.findOne({ categoryId });
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        const result = await Product.updateMany(
            { _id: { $in: productIds } },
            { $set: { categoryId } }
        );

        res.json({
            success: true,
            message: 'Products updated successfully',
            data: { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Bulk delete multiple products (skips products with order history)
// @route   DELETE /api/products/bulk-delete
// @access  Private (owner only)
exports.bulkDeleteProducts = async (req, res, next) => {
    try {
        const { productIds } = req.body;

        const products = await Product.find({ _id: { $in: productIds } }, { productName: 1 });
        const foundIds = products.map(p => p._id.toString());

        const variants = await ProductVariant.find({ productId: { $in: foundIds } }, { _id: 1, productId: 1 });
        const variantIds = variants.map(v => v._id);

        const referencedVariantIds = await OrderDetail.distinct('variantId', { variantId: { $in: variantIds } });
        const referencedVariantIdSet = new Set(referencedVariantIds.map(id => id.toString()));

        const excludedProductIds = new Set(
            variants
                .filter(v => referencedVariantIdSet.has(v._id.toString()))
                .map(v => v.productId.toString())
        );

        const deletableIds = foundIds.filter(id => !excludedProductIds.has(id));
        const skipped = products
            .filter(p => excludedProductIds.has(p._id.toString()))
            .map(p => ({ productId: p._id, productName: p.productName, reason: 'มีประวัติการสั่งซื้อ' }));

        await Product.deleteMany({ _id: { $in: deletableIds } });
        await ProductVariant.deleteMany({ productId: { $in: deletableIds } });
        await ProductImage.deleteMany({ productId: { $in: deletableIds } });

        res.json({
            success: true,
            message: 'Products deleted successfully',
            data: { deletedCount: deletableIds.length, deletedIds: deletableIds, skipped }
        });
    } catch (error) {
        next(error);
    }
};

// ==================== CSV IMPORT/EXPORT ====================

// @desc    Export products to CSV (one row per variant)
// @route   GET /api/products/export/csv?ids=id1,id2
// @access  Private (staff/owner)
exports.exportProductsCSV = async (req, res, next) => {
    try {
        const { ids } = req.query;

        const productMatch = ids
            ? { _id: { $in: ids.split(',').map(s => s.trim()).filter(Boolean) } }
            : {};

        const products = await Product.find(productMatch)
            .sort({ dateCreated: -1 })
            .limit(CSV_PRODUCT_EXPORT_LIMIT);

        const productIds = products.map(p => p._id);
        const [variants, categories] = await Promise.all([
            ProductVariant.find({ productId: { $in: productIds } }),
            Category.find({})
        ]);

        const categoryMap = new Map(categories.map(c => [c.categoryId, c.name]));
        const productMap = new Map(products.map(p => [p._id.toString(), p]));

        let csvData = '﻿';
        csvData += 'VariantID,SKU,ProductName,Category,Brand,Option1,Option2,Price,Stock,ShippingSize,IsActive,IsPos,IsOnline\n';

        variants.forEach(v => {
            const product = productMap.get(v.productId.toString());
            if (!product) return;
            const categoryName = categoryMap.get(product.categoryId) || '';
            csvData += [
                escapeCSV(v._id.toString()),
                escapeCSV(v.sku),
                escapeCSV(product.productName),
                escapeCSV(categoryName),
                escapeCSV(product.brand),
                escapeCSV(v.option1Value),
                escapeCSV(v.option2Value),
                v.price,
                v.stockAvailable,
                escapeCSV(product.shippingSize),
                product.isActive,
                product.isPos,
                product.isOnline
            ].join(',') + '\n';
        });

        res.setHeader('Content-disposition', `attachment; filename=products_export_${Date.now()}.csv`);
        res.set('Content-Type', 'text/csv; charset=utf-8');
        res.status(200).send(csvData);
    } catch (error) {
        next(error);
    }
};

// @desc    Import products from CSV — updates existing products/variants matched by VariantID
//          (SKU is no longer unique, so it can't be used to identify a row's target variant).
//          Never creates new products. Blank cells mean "don't change this field."
// @route   POST /api/products/import/csv
// @access  Private (staff/owner)
exports.importProductsCSV = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'CSV file is required' });
        }

        let records;
        try {
            records = parseCsv(req.file.buffer.toString('utf-8'), {
                columns: true,
                skip_empty_lines: true,
                trim: true,
                bom: true
            });
        } catch (parseErr) {
            return res.status(400).json({ success: false, message: `Invalid CSV file: ${parseErr.message}` });
        }

        if (records.length === 0) {
            return res.status(400).json({ success: false, message: 'CSV file has no rows' });
        }
        if (records.length > CSV_PRODUCT_IMPORT_LIMIT) {
            return res.status(400).json({ success: false, message: `CSV file exceeds ${CSV_PRODUCT_IMPORT_LIMIT} row limit` });
        }

        const categories = await Category.find({});
        const categoryByName = new Map(categories.map(c => [c.name.trim().toLowerCase(), c.categoryId]));

        const variantIds = records.map(r => (r.VariantID || '').trim()).filter(Boolean);
        const variants = await ProductVariant.find({ _id: { $in: variantIds } });
        const variantById = new Map(variants.map(v => [v._id.toString(), v]));

        const parseBoolCell = (value) => {
            const v = value.trim().toLowerCase();
            if (v === 'true' || v === '1') return true;
            if (v === 'false' || v === '0') return false;
            return null; // invalid
        };

        const updated = [];
        const errors = [];

        // Sequential — no DB transactions exist anywhere in this codebase, and this keeps
        // StockMovement ordering sane. Each row is an independent, individually-committed
        // write, same as every other mutation in this app.
        for (let i = 0; i < records.length; i++) {
            const row = records[i];
            const rowNum = i + 2; // header is row 1

            const parseResult = csvProductRowSchema.safeParse(row);
            if (!parseResult.success) {
                errors.push({ row: rowNum, sku: row.SKU || '', reason: parseResult.error.issues[0]?.message || 'Invalid row' });
                continue;
            }

            const sku = parseResult.data.SKU.trim();
            const variantId = parseResult.data.VariantID.trim();
            const variant = variantById.get(variantId);
            if (!variant) {
                errors.push({ row: rowNum, sku, reason: 'VariantID not found' });
                continue;
            }

            try {
                // Resolve/validate every non-blank cell BEFORE writing anything —
                // whole-row atomicity: one bad cell skips the entire row rather than
                // partially applying some fields.
                let categoryId;
                if (row.Category && row.Category.trim() !== '') {
                    categoryId = categoryByName.get(row.Category.trim().toLowerCase());
                    if (categoryId === undefined) {
                        errors.push({ row: rowNum, sku, reason: `Category "${row.Category}" not found` });
                        continue;
                    }
                }

                let isActive, isPos, isOnline;
                if (row.IsActive && row.IsActive.trim() !== '') {
                    isActive = parseBoolCell(row.IsActive);
                    if (isActive === null) { errors.push({ row: rowNum, sku, reason: 'Invalid IsActive value' }); continue; }
                }
                if (row.IsPos && row.IsPos.trim() !== '') {
                    isPos = parseBoolCell(row.IsPos);
                    if (isPos === null) { errors.push({ row: rowNum, sku, reason: 'Invalid IsPos value' }); continue; }
                }
                if (row.IsOnline && row.IsOnline.trim() !== '') {
                    isOnline = parseBoolCell(row.IsOnline);
                    if (isOnline === null) { errors.push({ row: rowNum, sku, reason: 'Invalid IsOnline value' }); continue; }
                }

                let shippingSize;
                if (row.ShippingSize && row.ShippingSize.trim() !== '') {
                    const s = row.ShippingSize.trim().toLowerCase();
                    if (s !== 'small' && s !== 'large') {
                        errors.push({ row: rowNum, sku, reason: 'ShippingSize must be small or large' });
                        continue;
                    }
                    shippingSize = s;
                }

                let price;
                if (row.Price && row.Price.trim() !== '') {
                    price = parseFloat(row.Price);
                    if (isNaN(price) || price < 0) {
                        errors.push({ row: rowNum, sku, reason: 'Invalid Price value' });
                        continue;
                    }
                }

                let stock;
                if (row.Stock && row.Stock.trim() !== '') {
                    stock = parseInt(row.Stock, 10);
                    if (isNaN(stock) || stock < 0) {
                        errors.push({ row: rowNum, sku, reason: 'Invalid Stock value' });
                        continue;
                    }
                }

                const productFields = {};
                if (categoryId !== undefined) productFields.categoryId = categoryId;
                if (row.Brand && row.Brand.trim() !== '') productFields.brand = normalizeBrand(row.Brand);
                if (shippingSize !== undefined) productFields.shippingSize = shippingSize;
                if (isActive !== undefined) productFields.isActive = isActive;
                if (isPos !== undefined) productFields.isPos = isPos;
                if (isOnline !== undefined) productFields.isOnline = isOnline;

                if (Object.keys(productFields).length > 0) {
                    await Product.findByIdAndUpdate(variant.productId, { $set: productFields });
                }

                if (price !== undefined) {
                    await ProductVariant.findByIdAndUpdate(variant._id, { price });
                }

                if (stock !== undefined) {
                    const delta = stock - variant.stockAvailable;
                    if (delta !== 0) {
                        // Stock changes must always go through stockUtils so every change
                        // is logged in StockMovement — never a raw update here.
                        await changeStock(variant._id, delta, 'adjustment', null, null, req.user._id, 'CSV import');
                        variant.stockAvailable = stock; // keep map correct for duplicate-VariantID rows in this file
                    }
                }

                updated.push(sku);
            } catch (rowError) {
                errors.push({ row: rowNum, sku, reason: rowError.message || 'Unexpected error' });
            }
        }

        res.json({
            success: true,
            data: {
                totalRows: records.length,
                updatedCount: updated.length,
                skippedCount: errors.length,
                updated,
                skipped: errors
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update product variant stock
// @route   PATCH /api/products/variants/:id/stock
// @access  Private (staff/owner)
exports.updateVariantStock = async (req, res, next) => {
    try {
        // Accept both 'stock' (frontend) and 'stockAvailable' (legacy)
        const newStock = req.body.stock ?? req.body.stockAvailable;
        const note = req.body.note || 'ปรับสต็อกจากหน้าจัดการสินค้า';

        if (newStock === undefined || newStock === null || newStock < 0) {
            return res.status(400).json({ success: false, message: 'Stock value is required and must be >= 0' });
        }

        const current = await ProductVariant.findById(req.params.id);
        if (!current) {
            return res.status(404).json({ success: false, message: 'Variant not found' });
        }

        const delta = newStock - current.stockAvailable;
        if (delta === 0) {
            return res.json({ success: true, message: 'Stock unchanged', data: current });
        }

        const { variant } = await changeStock(
            req.params.id,
            delta,
            'adjustment',
            null,
            null,
            req.user._id,
            note
        );

        res.json({
            success: true,
            message: 'Stock updated successfully',
            data: variant
        });
    } catch (error) {
        next(error);
    }
};

// ==================== IMAGE MANAGEMENT ====================

// @desc    Add product image
// @route   POST /api/products/:id/images
// @access  Private (staff/owner)
exports.addProductImage = async (req, res, next) => {
    try {
        const { imagePath, isPrimary, blurDataURL } = req.body;
        const productId = req.params.id;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // If setting as primary, unset other primary images
        if (isPrimary) {
            await ProductImage.updateMany(
                { productId },
                { isPrimary: false }
            );
        }

        // Get current max sortOrder
        const maxSortOrder = await ProductImage.findOne({ productId })
            .sort({ sortOrder: -1 })
            .select('sortOrder');

        const newImage = await ProductImage.create({
            productId,
            imagePath,
            blurDataURL,
            isPrimary: isPrimary || false,
            sortOrder: maxSortOrder ? maxSortOrder.sortOrder + 1 : 0
        });

        res.status(201).json({
            success: true,
            message: 'Image added successfully',
            data: newImage
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update product image
// @route   PUT /api/products/:id/images/:imageId
// @access  Private (staff/owner)
exports.updateProductImage = async (req, res, next) => {
    try {
        const { isPrimary, sortOrder } = req.body;
        const { id: productId, imageId } = req.params;

        const image = await ProductImage.findOne({ _id: imageId, productId });
        if (!image) {
            return res.status(404).json({
                success: false,
                message: 'Image not found'
            });
        }

        // If setting as primary, unset other primary images
        if (isPrimary === true) {
            await ProductImage.updateMany(
                { productId, _id: { $ne: imageId } },
                { isPrimary: false }
            );
        }

        // Update image
        const updateData = {};
        if (isPrimary !== undefined) updateData.isPrimary = isPrimary;
        if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

        const updatedImage = await ProductImage.findByIdAndUpdate(
            imageId,
            updateData,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Image updated successfully',
            data: updatedImage
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete product image
// @route   DELETE /api/products/:id/images/:imageId
// @access  Private (staff/owner)
exports.deleteProductImage = async (req, res, next) => {
    try {
        const { id: productId, imageId } = req.params;

        const image = await ProductImage.findOneAndDelete({
            _id: new mongoose.Types.ObjectId(imageId), 
            productId: new mongoose.Types.ObjectId(productId) 
        });

        if (!image) {
            console.warn(`Attempted to delete non-existent image: ${imageId} for product: ${productId}`);
            return res.status(404).json({
                success: false,
                message: 'Image not found or already deleted'
            });
        }

        // If deleted image was primary, set first remaining image as primary
        if (image.isPrimary) {
            const firstImage = await ProductImage.findOne({ productId }).sort({ sortOrder: 1 });
            if (firstImage) {
                await ProductImage.findByIdAndUpdate(firstImage._id, { isPrimary: true });
            }
        }

        res.json({
            success: true,
            message: 'Image deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Reorder product images
// @route   PUT /api/products/:id/images/reorder
// @access  Private (staff/owner)
exports.reorderProductImages = async (req, res, next) => {
    try {
        const { images } = req.body; // Array of { id, sortOrder }
        const productId = req.params.id;

        if (!images || !Array.isArray(images)) {
            return res.status(400).json({
                success: false,
                message: 'Images array is required'
            });
        }

        // Update each image's sortOrder
        const updatePromises = images.map(img =>
            ProductImage.findOneAndUpdate(
                { _id: img.id, productId },
                { sortOrder: img.sortOrder },
                { new: true }
            )
        );

        await Promise.all(updatePromises);

        const updatedImages = await ProductImage.find({ productId }).sort({ sortOrder: 1 });

        res.json({
            success: true,
            message: 'Images reordered successfully',
            data: updatedImages
        });
    } catch (error) {
        next(error);
    }
};
