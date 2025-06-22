const Address = require("../../models/address.js");
const Cart = require("../../models/cart.js");
const Orders = require("../../models/order.js");
const Coupon = require("../../models/coupon.js");
const Wallet = require("../../models/wallet.js");
const razorpay = require("../../config/razorpay.js");
const { createOrder, verifyRazorpayPayment } = require('../user/orderServiceController.js');

const loadcheckout = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        const userId = req.session.user.id;
        const coupons = await Coupon.find({ isActive: true, expiryDate: { $gte: new Date() } });
        const cartData = await Cart.findOne({ userId }).populate({
            path: 'items.productId',
            select: 'productName salePrice productImage',
        });
        const cart = cartData ? cartData.items : [];
        const subtotal = cart.reduce((acc, item) => {
            return acc + (item.productId.salePrice * item.quantity);
        }, 0);

        const shipping = subtotal > 5000 ? 0 : 200.00;
        const addresses = await Address.find({ userId });
        res.render("user/checkout", {
            cart,
            addresses,
            subtotal,
            shipping,
            coupons,
        });
    } catch (error) {
        console.error("Error while loading checkout page:", error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const OrderConfirmation = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { products, totalPrice, discount, address, paymentMethod } = req.body;
        if (!products || !products.length || !totalPrice) {
            return res.status(400).json({ error: 'Invalid order data' });
        }
        const couponApplied = discount > 0;
        const savedOrder = await createOrder({ userId, products, totalPrice, discount, couponApplied, address, paymentMethod });
        const populatedOrder = await Orders.findById(savedOrder._id).populate('orderedItem.productId');
        res.json({ orderDetails: populatedOrder });
    } catch (error) {
        console.error('Error processing order:', error);
        res.status(500).send('Internal Server Error');
    }
};

const ordersuccess = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const orderDetails = await Orders.find({ _id: orderId })
        res.render('user/OrderConfirmation', { orderDetails: orderDetails, discount: orderDetails.discount });

    } catch (error) {
        console.log("error while getting order", error);

    }
};

const getOrders = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = 3;
        const skip = (page - 1) * limit;
        const totalOrders = await Orders.countDocuments({ userId });
        const totalPages = Math.ceil(totalOrders / limit);

        const orders = await Orders.find({ userId })
            .populate({
                path: 'orderedItem.productId',
                select: 'productName salePrice productImage'
            })
            .skip(skip)
            .limit(limit)
            .lean();
        const safeOrders = orders.map(order => ({
            ...order,
            items: (order.orderedItem || []).map(item => ({
              itemId: item._id, // Important for individual cancellation
                productId: item.productId?._id,
                productName: item.productId?.productName || 'N/A',
                price: item.productId?.salePrice || 0,
                productImage: item.productId?.productImage?.[0] || '/placeholder.jpg',
                quantity: item.quantity || 1,
                cancelled: item.cancelled || false
            }))
        }));

        res.render("user/userorders", { orders: safeOrders, currentPage: page, totalPages, message: null });
    } catch (error) {
        console.error("An error occurred while fetching user orders:", error);
        res.status(500).send("Error fetching user orders");
    }
};

const OrderCancel = async (req, res) => {
    console.log("Cancelling item in order");
    try {
        const { orderId, productId } = req.params;
    console.log("Cancelling item:", orderId, productId);
        const order = await Orders.findById(orderId);
        if (!order) {
          return res.render("user/userorders", { message: "Order not found" });
        }

        // Find the specific item in the order
        const item = order.orderedItem.find(
            item => item.productId.toString() === productId
        );

        if (!item) {
            return res.render("user/userorders", { message: "Product not found in order" });
        }

        // Add 'cancelled' field to schema or handle logically here
        if (item.cancelled) {
            return res.render("user/userorders", { message: "Item already cancelled" });
        }

        item.cancelled = true; // You must make sure `cancelled: Boolean` is added in the schema under orderedItem

        // If all items cancelled, update full order status
        const allCancelled = order.orderedItem.every(i => i.cancelled);
        if (allCancelled) {
            order.orderStatus = 'Cancelled';
        }

        await order.save();
        res.redirect('/orders');
    } catch (error) {
        console.error("Error cancelling item:", error);
        res.status(500).send("Error cancelling item");
    }
};

const razorpayment = async (req, res) => {
    try {
        const options = {
            amount: req.body.totalPrice * 100,
            currency: "INR",
            receipt: `ShoeVault_${Date.now()}`,
        };
        const order = await razorpay.orders.create(options);
        res.json({ success: true, order });
    } catch (error) {
        console.error("Error creating order: ", error);
        res.status(400).json({ success: false, message: "Order creation failed" });
    }
};

const verifypayment = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { payment_id, order_id, signature, products, totalPrice, discount, address, paymentMethod } = req.body;

        const isPaymentVerified = verifyRazorpayPayment(order_id, payment_id, signature, process.env.RAZORPAY_SECRET_KEY);
        if (!isPaymentVerified) {
            return res.status(400).json({ success: false, message: "Payment Verification Failed" });
        }

        const savedOrder = await createOrder({ userId, products, totalPrice, discount, address, paymentMethod });
        res.status(201).json({
            success: true,
            message: "Order Placed Successfully!",
            orderId: savedOrder._id,
        });
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const razorpaySuccessPage = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const orderDetails = await Orders.findById(orderId).populate('orderedItem.productId');
        if (!orderDetails) {
            return res.status(404).send("Order not found");
        }
        const finalAmount = orderDetails.orderedItem.reduce((sum, item) => {
            return sum + (item.productId.salePrice * item.quantity);
        }, 0);

        res.render("user/razorpay-successpage", { orderDetails, finalAmount });
    } catch (error) {
        console.error("Error loading Razorpay success page:", error);
        res.status(500).send("Internal Server Error");
    }
};

const payWithWallet = async (req, res) => {
    try {
        const userId = req.session.user?.id;
        const { totalPrice, products, address, paymentMethod } = req.body;
        const wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            return res.status(400).json({ message: "Wallet not found. Please add funds to your wallet." });
        }

        if (wallet.balance < totalPrice) {
            return res.status(400).json({ message: "Insufficient wallet balance." });
        }

        wallet.balance -= totalPrice;
        wallet.transactions.push({
            type: "debit",
            amount: totalPrice,
            description: "Purchase using wallet",
            date: new Date(),
        });
        await wallet.save();

        const savedOrder = await createOrder({ userId, products, totalPrice, address, paymentMethod });
        res.status(201).json({
            success: true,
            message: "Order Placed Successfully!",
            orderId: savedOrder._id,
        });
        await savedOrder.save();
    } catch (error) {
        console.error("Error processing wallet payment:", error);
        res.status(500).json({ message: "Server error", error });
    }
};

module.exports = {
    loadcheckout,
    OrderConfirmation,
    ordersuccess,
    getOrders,
    OrderCancel,
    razorpayment,
    verifypayment,
    razorpaySuccessPage,
    payWithWallet,

}