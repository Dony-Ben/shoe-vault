const Address = require("../models/address.js");
const Cart = require("../models/cart");
const Orders = require("../models/order");
const Product = require('../models/product')
const razorpay = require("../config/razorpay")


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
            { id: 'netbanking', name: 'Net Banking' },  
             {id:'razorpay',name:'Razorpay'}
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
        console.log(userId);

        const { products, totalPrice, address, paymentMethod } = req.body;

        console.log('Received order data:', req.body);

        if (!products || !products.length || !totalPrice) {
            return res.status(400).json({ error: 'Invalid order data' });
        }

        const user = req.user;
        const customerName = user ? user.firstname : 'Guest';

        const order = new Orders({
            userId: userId,
            orderedItem: products.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
            })),
            totalPrice: 0,
            finalAmount: totalPrice,
            orderDate: new Date(),
            deliveryAddress: {
                name: address.name,
                cityStatePincode: address.cityStatePincode,
                phone: address.phone,
            },
            deliveryCharge: 50,
            paymentMethod: paymentMethod,
        });

        console.log("Ordered Items:", JSON.stringify(order.orderedItem, null, 2));
        let calculatedTotalPrice = 0;
        for (const item of order.orderedItem) {
            const product = await Product.findById(item.productId);
            if (product) {
                item.totalPrice = product.price * item.quantity;
                calculatedTotalPrice += item.totalPrice;
            } else {
                return res.status(404).json({ error: `Product not found: ${item.productId}` });
            }
        }

        order.totalPrice = calculatedTotalPrice;

        const savedOrder = await order.save();

        const populatedOrder = await Orders.findById(savedOrder._id).populate('orderedItem.productId');

        const subtotal = populatedOrder.orderedItem.reduce((acc, item) => acc + item.totalPrice, 0);

        res.json({ orderDetails: populatedOrder })
    } catch (error) {
        console.error('Error processing order:', error);
        res.status(500).send('Internal Server Error');
    }
};

const ordersuccess = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const orderDetails = await Orders.find({ _id: orderId })

        res.render('user/OrderConfirmation', { orderDetails: orderDetails })

    } catch (error) {
        console.log("error while getting order", error);

    }
};

const getOrders = async (req, res) => {
    try {
        const userId = req.session.user.id;
        // console.log("Session Data:", userId);

        const orders = await Orders.find({ userId })
            .populate({
                path: 'orderedItem.productId',
                select: 'productName salePrice productImage'
            })
            .lean();

        console.log("Orders with populated products:", JSON.stringify(orders, null, 2));

        const safeOrders = orders.map(order => ({
            ...order,
            items: (order.orderedItem || []).map(item => ({
                productName: item.productId?.productName || null,
                price: item.productId?.salePrice || 0,
                productImage: item.productId?.productImage?.[0] || '/placeholder.jpg',
                quantity: item.quantity || 1
            }))
        }));
        console.log("Safe Orders:", JSON.stringify(safeOrders, null, 2));

        res.render("user/userorders", { orders: safeOrders, message: null });
    } catch (error) {
        console.error("An error occurred while fetching user orders:", error);
        res.status(500).send("Error fetching user orders");
    }
};
const OrderCancel = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        console.log("orderid", orderId);

        const order = await Orders.findById(orderId);

        if (!order) {
            return res.render("user/userorders", { message: "order not found" });
        }

        if (order.orderStatus === 'Cancelled') {
            return res.render("user/userorders", { message: "Order already cancelled" });
        }

        order.orderStatus = 'Cancelled';
        await order.save();
        console.log('order cancelled');


        for (const item of order.orderedItem) {
            const product = await Product.findById(item.productId);
            if (product) {
                product.stock += item.quantity;
                await product.save();
            }
        }
        res.redirect('/orders');
    } catch (error) {
        console.error("Error cancelling order:", error);
        res.status(500).send("Error cancelling order");
    }
};

//razorpay
const razorpayment = async (req, res) => {
    try {
        console.log('req body : ', req.body);
        const options = {
            amount: req.body.salePrice * 100,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        res.json({ success: true, order });
    } catch (error) {

    }
}
module.exports = {
    loadcheckout,
    OrderConfirmation,
    ordersuccess,
    getOrders,
    OrderCancel,
    razorpayment
}