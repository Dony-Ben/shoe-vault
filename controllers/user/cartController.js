const Cart = require("../../models/cart");
const Product = require("../../models/product");
const { STATUS_CODES } = require("../../constants/httpStatusCodes");
const { RENDER_PAGE_KEYS } = require("../../constants/renderPageKeys");

const getcartpage = async (req, res) => {
    try {
        const userId = req.session.user?.id;
        const cart = await Cart.findOne({ userId: userId }).populate('items.productId');

        if (!cart) {
            return res.render(RENDER_PAGE_KEYS.userCart, {
                cart: [],
                subtotal: 0,
                shipping: 0,
                total: 0,
            });
        }
        const subtotal = cart.items.reduce((total, item) => total + item.productId.salePrice * item.quantity, 0);
        const total = + subtotal;
        
        res.render(RENDER_PAGE_KEYS.userCart, {
            cart: cart.items,
            subtotal,
            total,
        });
    } catch (error) {
        console.error("Error in getcartpage:", error);
        res.render(RENDER_PAGE_KEYS.userPage404);
    }
};

const cartaddToCart = async (req, res) => {
    try {
        const userId = req.session.user?.id;
        const { productId,size } = req.body;

        if (!productId || !userId || !size) {
            return res.status(STATUS_CODES.BadRequest).json({ message: "Missing product ID, user ID, or size.", success: false });
        }
        const product = await Product.findById(productId);
        if (!product) {
            return res.render(RENDER_PAGE_KEYS.userShop, { message: "Product not found.", products: [] });
        }
        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }
        const existingItem = cart.items.find(item => item.productId.equals(productId));
        if (existingItem) {
            return res.json({ message: "Item already in cart.", success: false });
        } else {
            cart.items.push({
                productId,
                size,
                quantity: 1,
                price: product.salePrice,
                totalprice: product.salePrice,
            });
        }
        await cart.save();
        res.json({ message: 'Product added to cart successfully.' });
    } catch (error) {
        console.error("Error in cartaddToCart:", error);
        res.redirect("/shop?message=An error occurred while adding the product to the cart.");
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.session.user?.id;

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(STATUS_CODES.NotFound).json({ success: false, message: "Cart not found" });
        }
        const productIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (productIndex === -1) {
            return res.status(STATUS_CODES.NotFound).json({ success: false, message: "Product not found in the cart" });
        }
        cart.items.splice(productIndex, 1);
        await cart.save();
        const newTotal = cart.items.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );
        return res.json({
            success: true,
            newTotal,
            newSubtotal: newTotal,
            items: cart.items,
        });
    } catch (error) {
        console.error("Error in deleteProduct:", error);
        return res.status(STATUS_CODES.InternalServerError).json({
            success: false,
            message: "An error occurred while removing the product from the cart",
        });
    }
};

const quantityManage = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { change } = req.body;

        const cart = await Cart.findOne({ 'items.productId': itemId });

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === itemId);

        if (itemIndex === -1) {
            return res.status(STATUS_CODES.NotFound).json({ success: false, message: 'Item not found in cart' });
        }

        const currentQuantity = cart.items[itemIndex].quantity;
        const newQuantity = currentQuantity + change;

        if (newQuantity < 1) {
            return res.status(STATUS_CODES.BadRequest).json({ success: false, message: 'Quantity cannot be less than 1' });
        }

        if (newQuantity > 5) {
            return res.status(STATUS_CODES.BadRequest).json({ success: false, message: 'Quantity cannot exceed 5' });
        }

        if (newQuantity === 0) {
            cart.items.splice(itemIndex, 1);

        } else {
            cart.items[itemIndex].quantity = newQuantity;
            cart.items[itemIndex].totalprice = cart.items[itemIndex].price * newQuantity;
        }
    
        await cart.save();

        res.json({
            success: true,
            message: 'Quantity updated successfully',
            quantity: newQuantity,
            totalprice: newQuantity === 0 ? 0 : cart.items[itemIndex].totalprice
        });
    } catch (error) {
        console.error(error);
        res.status(STATUS_CODES.InternalServerError).json({ success: false, message: 'Server error' });
    }
};


module.exports = {
    getcartpage,
    cartaddToCart,
    deleteProduct,
    quantityManage
};
