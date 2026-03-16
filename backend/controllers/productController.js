// controllers/productController.js
const { Product, ProductVariant, ProductImage } = require('../models');

// @desc    Get all products with variants and images
// @route   GET /api/products
// @access  Public
exports.getAllProducts = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search, categoryId, isActive, sort, brand, minPrice, maxPrice } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
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

        // Brand Filter
        if (brand) {
            if (Array.isArray(brand)) {
                baseMatch.brand = { $in: brand };
            } else if (brand.includes(',')) {
                baseMatch.brand = { $in: brand.split(',') };
            } else {
                baseMatch.brand = brand;
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
        const { scope, channel } = req.query;

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
            // Lookup Images
            {
                $lookup: {
                    from: 'productimages',
                    localField: '_id',
                    foreignField: 'productId',
                    as: 'images'
                }
            },
            // Sort
            { $sort: sortStage },
            // Facet for Pagination and Count
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [{ $skip: skip }, { $limit: limitNum }]
                }
            }
        ];

        const result = await Product.aggregate(pipeline);

        const data = result[0].data;
        const total = result[0].metadata[0] ? result[0].metadata[0].total : 0;

        // Post-process images sorting
        data.forEach(p => {
            if (p.images && Array.isArray(p.images)) {
                p.images.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
            }
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

        // Map stockAvailable to stock for frontend consistency
        const mappedVariants = variants.map(v => ({
            ...v.toObject(),
            stock: v.stockAvailable,
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

// @desc    Create new product
// @route   POST /api/products
// @access  Private (staff/owner)
exports.createProduct = async (req, res, next) => {
    try {
        const { productName, description, categoryId, brand, shippingSize, variants, images } = req.body;

        // สร้างสินค้า
        const product = await Product.create({
            productName,
            description,
            categoryId,
            brand,
            brand,
            shippingSize: shippingSize || 'small',
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
        const { productName, description, categoryId, brand, shippingSize, isActive, variants } = req.body;

        // Update product basic info
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            {
                productName, description, categoryId, brand, shippingSize, isActive,
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
            // Delete existing variants
            await ProductVariant.deleteMany({ productId: req.params.id });

            // Create new variants
            const variantDocs = variants.map(v => ({
                productId: product._id,
                sku: v.sku,
                price: v.price,
                stockAvailable: v.stock // map stock to stockAvailable
            }));
            await ProductVariant.insertMany(variantDocs);
        }

        // Fetch updated variants and images
        const updatedVariants = await ProductVariant.find({ productId: product._id });
        const images = await ProductImage.find({ productId: product._id });

        res.json({
            success: true,
            message: 'Product updated successfully',
            data: {
                ...product.toObject(),
                variants: updatedVariants,
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

// @desc    Update product variant stock
// @route   PATCH /api/products/variants/:id/stock
// @access  Private (staff/owner)
exports.updateVariantStock = async (req, res, next) => {
    try {
        const { stockAvailable } = req.body;

        const variant = await ProductVariant.findByIdAndUpdate(
            req.params.id,
            { stockAvailable },
            { new: true, runValidators: true }
        );

        if (!variant) {
            return res.status(404).json({
                success: false,
                message: 'Variant not found'
            });
        }

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
        const { imagePath, isPrimary } = req.body;
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

        const mongoose = require('mongoose');
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
