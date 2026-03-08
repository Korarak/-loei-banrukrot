// controllers/cartController.js
const { Cart, CartItem, ProductVariant, ProductImage } = require('../models');

// @desc    Get customer's cart
// @route   GET /api/cart
// @access  Private (customer)
exports.getCart = async (req, res, next) => {
    try {
        let cart = await Cart.findOne({ customerId: req.customer._id });

        if (!cart) {
            // สร้าง cart ใหม่ถ้ายังไม่มี
            cart = await Cart.create({ customerId: req.customer._id });
        }

        // ดึง cart items พร้อม variant details
        const cartItems = await CartItem.find({ cartId: cart._id })
            .populate({
                path: 'variantId',
                populate: { path: 'productId' }
            });

        // ดึงรูปภาพสินค้า
        const productIds = [...new Set(cartItems
            .filter(item => item.variantId && item.variantId.productId)
            .map(item => item.variantId.productId._id))];

        const productImages = await ProductImage.find({
            productId: { $in: productIds }
        });

        // Create map of productId -> imagePath (prioritize isPrimary)
        const imageMap = productImages.reduce((acc, img) => {
            if (!acc[img.productId] || img.isPrimary) {
                acc[img.productId] = img.imagePath;
            }
            return acc;
        }, {});

        // คำนวณยอดรวม
        let totalAmount = 0;
        const items = cartItems.reduce((acc, item) => {
            const variant = item.variantId;
            // Skip if variant or product is missing (e.g. deleted)
            if (!variant || !variant.productId) {
                return acc;
            }

            const product = variant.productId;
            const subtotal = item.quantity * variant.price;
            totalAmount += subtotal;

            acc.push({
                _id: item._id,
                quantity: item.quantity,
                subtotal,
                variant: {
                    _id: variant._id,
                    sku: variant.sku,
                    price: variant.price
                },
                product: {
                    _id: product._id,
                    productName: product.productName,
                    shippingSize: product.shippingSize,
                    imageUrl: imageMap[product._id] || product.imageUrl
                }
            });
            return acc;
        }, []);

        res.json({
            success: true,
            data: {
                cart,
                items,
                totalAmount
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add item to cart
// @route   POST /api/cart/items
// @access  Private (customer)
exports.addToCart = async (req, res, next) => {
    try {
        const { variantId, quantity } = req.body;

        // ตรวจสอบว่า variant มีอยู่และมีสต็อกพอหรือไม่
        const variant = await ProductVariant.findById(variantId);
        if (!variant) {
            return res.status(404).json({
                success: false,
                message: 'Product variant not found'
            });
        }

        if (variant.stockAvailable < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock'
            });
        }

        // หา cart หรือสร้างใหม่
        let cart = await Cart.findOne({ customerId: req.customer._id });
        if (!cart) {
            cart = await Cart.create({ customerId: req.customer._id });
        }

        // เช็คว่ามี item นี้ใน cart แล้วหรือยัง
        let cartItem = await CartItem.findOne({ cartId: cart._id, variantId });

        if (cartItem) {
            // ถ้ามีแล้ว เพิ่มจำนวน
            cartItem.quantity += quantity;
            await cartItem.save();
        } else {
            // ถ้ายังไม่มี สร้างใหม่
            cartItem = await CartItem.create({
                cartId: cart._id,
                variantId,
                quantity
            });
        }

        // Update cart lastUpdated
        cart.lastUpdated = Date.now();
        await cart.save();

        res.status(201).json({
            success: true,
            message: 'Item added to cart',
            data: cartItem
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/items/:id
// @access  Private (customer)
exports.updateCartItem = async (req, res, next) => {
    try {
        const { quantity } = req.body;

        const cartItem = await CartItem.findById(req.params.id).populate('variantId');

        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found'
            });
        }

        // ตรวจสอบสต็อก
        if (cartItem.variantId.stockAvailable < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock'
            });
        }

        cartItem.quantity = quantity;
        await cartItem.save();

        // Update cart lastUpdated
        await Cart.findByIdAndUpdate(cartItem.cartId, { lastUpdated: Date.now() });

        res.json({
            success: true,
            message: 'Cart item updated',
            data: cartItem
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:id
// @access  Private (customer)
exports.removeFromCart = async (req, res, next) => {
    try {
        const cartItem = await CartItem.findByIdAndDelete(req.params.id);

        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found'
            });
        }

        // Update cart lastUpdated
        await Cart.findByIdAndUpdate(cartItem.cartId, { lastUpdated: Date.now() });

        res.json({
            success: true,
            message: 'Item removed from cart'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private (customer)
exports.clearCart = async (req, res, next) => {
    try {
        const cart = await Cart.findOne({ customerId: req.customer._id });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        await CartItem.deleteMany({ cartId: cart._id });

        res.json({
            success: true,
            message: 'Cart cleared'
        });
    } catch (error) {
        next(error);
    }
};
