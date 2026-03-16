// controllers/categoryController.js
const Category = require('../models/Category');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getAllCategories = async (req, res, next) => {
    try {
        console.log('GET /api/categories request received', req.query);
        const { isActive } = req.query;

        const match = {};
        if (isActive !== undefined) {
            match.isActive = isActive === 'true';
        }

        const categories = await Category.aggregate([
            { $match: match },
            { $sort: { sortOrder: 1, name: 1 } },
            // Lookup one product for this category
            {
                $lookup: {
                    from: 'products',
                    let: { catId: '$categoryId' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$categoryId', '$$catId'] }, isActive: true, isOnline: true } },
                        { $limit: 1 },
                        // For this product, lookup its primary image
                        {
                            $lookup: {
                                from: 'productimages',
                                let: { prodId: '$_id' },
                                pipeline: [
                                    { $match: { $expr: { $eq: ['$productId', '$$prodId'] } } },
                                    { $sort: { isPrimary: -1, sortOrder: 1 } },
                                    { $limit: 1 }
                                ],
                                as: 'images'
                            }
                        }
                    ],
                    as: 'sampleProduct'
                }
            },
            {
                $addFields: {
                    sampleImage: {
                        $cond: {
                            if: { $gt: [{ $size: '$sampleProduct' }, 0] },
                            then: { $arrayElemAt: [{ $arrayElemAt: ['$sampleProduct.images.imagePath', 0] }, 0] },
                            else: null
                        }
                    }
                }
            },
            {
                $project: {
                    sampleProduct: 0
                }
            }
        ]);

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single category by ID
// @route   GET /api/categories/:id
// @access  Public
exports.getCategoryById = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Private (staff/owner)
exports.createCategory = async (req, res, next) => {
    try {
        const { name, description, sortOrder, imageUrl } = req.body;

        // Generate base slug from name
        let baseSlug = name.toLowerCase()
            .replace(/[^a-z0-9\u0E00-\u0E7F]+/g, '-')
            .replace(/^-|-$/g, '');

        if (!baseSlug) {
            baseSlug = `category`;
        }

        let slug = baseSlug;
        let slugExists = await Category.findOne({ slug });
        
        // Append random string if slug exists
        if (slugExists) {
            slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
        }

        // Get next categoryId
        const maxCategory = await Category.findOne().sort({ categoryId: -1 });
        const categoryId = maxCategory ? maxCategory.categoryId + 1 : 1;

        const category = await Category.create({
            categoryId,
            name,
            slug,
            description,
            sortOrder: sortOrder || 0,
            imageUrl
        });

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: category
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (staff/owner)
exports.updateCategory = async (req, res, next) => {
    try {
        const { name, description, isActive, sortOrder, imageUrl } = req.body;

        const updateData = {};
        if (name) {
            updateData.name = name;
            let baseSlug = name.toLowerCase()
                .replace(/[^a-z0-9\u0E00-\u0E7F]+/g, '-')
                .replace(/^-|-$/g, '');

            if (!baseSlug) {
                baseSlug = `category`;
            }

            let slug = baseSlug;
            // Check if slug exists and belongs to a DIFFERENT category
            let slugExists = await Category.findOne({ slug, _id: { $ne: req.params.id } });
            
            if (slugExists) {
                slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
            }
            updateData.slug = slug;
        }
        if (description !== undefined) updateData.description = description;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            message: 'Category updated successfully',
            data: category
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete category (soft delete)
// @route   DELETE /api/categories/:id
// @access  Private (owner only)
exports.deleteCategory = async (req, res, next) => {
    try {
        // Soft delete - just set isActive to false
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Reorder categories
// @route   PUT /api/categories/reorder
// @access  Private (staff/owner)
exports.reorderCategories = async (req, res, next) => {
    try {
        const { categories } = req.body; // Expects [{ id, sortOrder }]

        if (!Array.isArray(categories)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid data format. Expected an array of categories.'
            });
        }

        const bulkOps = categories.map(cat => ({
            updateOne: {
                filter: { _id: cat.id },
                update: { sortOrder: cat.sortOrder }
            }
        }));

        if (bulkOps.length > 0) {
            await Category.bulkWrite(bulkOps);
        }

        res.json({
            success: true,
            message: 'Categories reordered successfully'
        });
    } catch (error) {
        next(error);
    }
};
