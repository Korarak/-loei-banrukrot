// controllers/categoryController.js
const Category = require('../models/Category');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getAllCategories = async (req, res, next) => {
    try {
        console.log('GET /api/categories request received', req.query);
        const { isActive } = req.query;

        const query = {};
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const categories = await Category.find(query).sort({ sortOrder: 1, name: 1 });

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
        const { name, description, sortOrder } = req.body;

        // Generate slug from name
        let slug = name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        if (!slug) {
            slug = `category-${Date.now()}`;
        }

        // Get next categoryId
        const maxCategory = await Category.findOne().sort({ categoryId: -1 });
        const categoryId = maxCategory ? maxCategory.categoryId + 1 : 1;

        const category = await Category.create({
            categoryId,
            name,
            slug,
            description,
            sortOrder: sortOrder || 0
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
        const { name, description, isActive, sortOrder } = req.body;

        const updateData = {};
        if (name) {
            updateData.name = name;
            let slug = name.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');

            if (!slug) {
                slug = `category-${Date.now()}`;
            }
            updateData.slug = slug;
        }
        if (description !== undefined) updateData.description = description;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

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
