const Cart = require("../models/cart");
const Product = require("../models/product");


const getcartpage = async (req, res) => {
    try {
        const userId = req.session.user?.id;
        const cart = await Cart.findOne({ userId: userId }).populate('items.productId');

        if (!cart) {
            return res.render("user/cart", {
                cart: [],
                subtotal: 0,
                shipping: 0,
                total: 0,
            });
        }
        const subtotal = cart.items.reduce((total, item) => total + item.productId.salePrice * item.quantity, 0);
        const total = +subtotal;
        console.log(total);


        res.render("user/cart", {
            cart: cart.items,
            subtotal,
            total,
        });
    } catch (error) {
        console.error("Error in getcartpage:", error);
        res.render("user/page-404");
    }
};

const cartaddToCart = async (req, res) => {
    try {
        const userId = req.session.user?.id;
        const productId = req.query.productId;

        if (!productId || !userId) {
            return res.render("user/shop", { message: "Missing product or user ID.", products: [] });
        }
       const product = await Product.findById(productId);
        if (!product) {
            return res.render("user/shop", { message: "Product not found.", products: [] });
        }
        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }
        const existingItem = cart.items.find(item => item.productId.equals(productId));
        if (existingItem) {
            existingItem.quantity += 1;
            existingItem.totalprice = existingItem.quantity * product.salePrice;
        } else {
            cart.items.push({
                productId,
                quantity: 1,
                price: product.salePrice,
                totalprice: product.salePrice,
            });
        }
        await cart.save();
        const productList = await Product.find({}); 
        res.render("user/shop", { products: productList });
    } catch (error) {
        console.error("Error in cartaddToCart:", error);
        res.render("user/shop", { message: "Something went wrong. Please try again later.", products: [] });
    }
};



const deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.session.user?.id;

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }
        const productIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (productIndex === -1) {
            return res.status(404).json({ success: false, message: "Product not found in the cart" });
        }
        cart.items.splice(productIndex, 1);
        await cart.save();
        const newTotal = cart.items.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );
        return res.json({
            success: true,
            message: "Product removed from cart",
            newTotal,
            items: cart.items,
        });
    } catch (error) {
        console.error("Error in deleteProduct:", error);
        return res.status(500).json({
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

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === itemId);

        if (itemIndex === -1) {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }

        const newQuantity = cart.items[itemIndex].quantity + change;

        if (newQuantity < 0) {
            return res.status(400).json({ success: false, message: 'Quantity cannot be less than 0' });
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
        res.status(500).json({ success: false, message: 'Server error' });
    }
}


module.exports = {
    getcartpage,
    cartaddToCart,
    deleteProduct,
    quantityManage
};
