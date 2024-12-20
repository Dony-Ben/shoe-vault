const Address = require("../models/address");
const Cart = require("../models/cart");
const Orders = require("../models/order");
const Product = require('../models/product')


const loadcheckout = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login'); 
        }
        const userId = req.session.user.id;
        const cartData = await Cart.findOne({ userId }).populate({
            path: 'items.productId',
            select: 'productName salePrice'
        });

        const cart = cartData ? cartData.items : [];

        const subtotal = cart.reduce((acc, item) => {
            return acc + (item.productId.salePrice * item.quantity);
        }, 0);

        const shipping = subtotal > 5000 ? 0 : 200.00;

        const addresses = await Address.find({ userId });

        const paymentMethods = [
            { id: 'cod', name: 'Cash on Delivery' },
            { id: 'card', name: 'Credit/Debit Card' },
            { id: 'upi', name: 'UPI' },
            { id: 'netbanking', name: 'Net Banking' }
        ];

        res.render("user/checkout", {
            cart,
            addresses,
            subtotal,
            shipping,
            paymentMethods
        });
    } catch (error) {
        console.error("Error while loading checkout page:", error.message);
        res.status(500).send("Failed to load checkout page. Please try again later.");
    }
};

const OrderConfirmation = async (req, res) => {
    try {
        const userId = req.session.user.id
        const { products, totalPrice, address, paymentMethod } = req.body;

        // Log incoming data for debugging
        console.log('Received order data:', req.body);

        if (!products || !products.length || !totalPrice) {
            return res.status(400).json({ error: 'Invalid order data' });
        }

        const user = req.user; 
        const customerName = user ? user.name : 'Guest';

        // Create the order
        const order = new Orders({
            userId:userId,
            orderedItem: products.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
            })),
            totalPrice: 0, 
            finalAmount: totalPrice,
            orderDate: new Date(),
            deliveryAddress: {
                name: address.name, 
                cityStatePincode:address.cityStatePincode,
                phone: address.phone,
            },
            deliveryCharge: 50, // Example shipping cost (you can modify this based on address or region)
            paymentMethod:paymentMethod,
        });

        // Calculate the total price for each item
        let calculatedTotalPrice = 0;
        for (const item of order.orderedItem) {
            const product = await Product.findById(item.productId); // Fetch product details
            if (product) {
                item.totalPrice = product.price * item.quantity;
                calculatedTotalPrice += item.totalPrice; // Add each item's total price
            } else {
                return res.status(404).json({ error: `Product not found: ${item.productId}` });
            }
        }

        // Set total price (sum of item prices and delivery charge)
        order.totalPrice = calculatedTotalPrice;

        // Save the order
        const savedOrder = await order.save();

        // Populate the order for rendering (for details such as product names)
        const populatedOrder = await Orders.findById(savedOrder._id).populate('orderedItem.productId');

        // Calculate the subtotal (sum of all item prices)
        const subtotal = populatedOrder.orderedItem.reduce((acc, item) => acc + item.totalPrice, 0);

        // Render the confirmation page
        res.json({orderDetails:populatedOrder})
    } catch (error) {
        console.error('Error processing order:', error);
        res.status(500).send('Internal Server Error');
    }
};

const ordersuccess = async(req,res)=>{
    try {
        const orderId = req.params.orderId; 
        const orderDetails = await Orders.find({_id:orderId})

        res.render('user/OrderConfirmation',{orderDetails:orderDetails})
        
    } catch (error) {
        console.log("error while getting order",error);
        
    }
}


module.exports ={
    loadcheckout,
    OrderConfirmation,
    ordersuccess,


}