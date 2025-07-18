const Address = require("../../models/address.js");
const Cart = require("../../models/cart.js");
const Orders = require("../../models/order.js");
const Coupon = require("../../models/coupon.js");
const Wallet = require("../../models/wallet.js");
const razorpay = require("../../config/razorpay.js");
const { createOrder, verifyRazorpayPayment } = require('../user/orderServiceController.js');
const Offer = require('../../models/offers');

const getActiveOffers = async () => {
    const now = new Date();
    return Offer.find({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now }
    })
        .populate('categories')
        .populate('products')
        .lean();
};

function getBestOfferForProduct(product, offers) {
    let bestOffer = null;
    let maxDiscount = 0;
    const productId = product._id?.toString() || product.id?.toString();
    const categoryId = product.category?._id?.toString() || product.category?.toString();
    offers.forEach(offer => {
        let applies = false;
        if (offer.offerType === 'product') {
            applies = offer.products.some(p => p._id.toString() === productId);
        } else if (offer.offerType === 'category') {
            applies = offer.categories.some(c => c._id.toString() === categoryId);
        }
        if (applies) {
            let discount = 0;
            if (offer.discountType === 'percentage') {
                discount = (product.salePrice * offer.discountValue) / 100;
            } else if (offer.discountType === 'fixed') {
                discount = offer.discountValue;
            }
            if (discount > maxDiscount) {
                maxDiscount = discount;
                bestOffer = offer;
            }
        }
    });
    return bestOffer ? { offer: bestOffer, discount: maxDiscount } : null;
}

const loadcheckout = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        const userId = req.session.user.id;
        const coupons = await Coupon.find({ isActive: true, expiryDate: { $gte: new Date() } });
        const cartData = await Cart.findOne({ userId }).populate({
            path: 'items.productId',
            select: 'productName salePrice regularPrice productImage quantity category'
        })
        const cart = cartData ? cartData.items : [];
        const subtotal = cart.reduce((acc, item) => {
            return acc + (item.productId.salePrice * item.quantity);
        }, 0);

        // Offer discount calculation
        const offers = await getActiveOffers();
        let offerDiscount = 0;
        const cartWithOffers = cart.map(item => {
            const best = getBestOfferForProduct(item.productId, offers);
            let offerInfo = null;
            if (best) {
                offerDiscount += best.discount * item.quantity;
                offerInfo = {
                    offerName: best.offer.offerName,
                    discountType: best.offer.discountType,
                    discountValue: best.offer.discountValue,
                    discount: best.discount
                };
            }
            return { ...item.toObject(), offerInfo };
        });
        const offerTotal = subtotal - offerDiscount;

        const shipping = subtotal > 5000 ? 0 : 200.00;
        const addresses = await Address.find({ userId });
        res.render("user/checkout", {
            cart: cartWithOffers,
            addresses,
            subtotal,
            shipping,
            coupons,
            offerDiscount,
            offerTotal,
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

const getOrders = async (req, res, next) => {
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
        const message = req.query.message || null;
        res.render("user/userorders", { orders: safeOrders, currentPage: page, totalPages, message });
        console.log("orders", orders)
    } catch (err) {
        next(err)
    }
};

const OrderCancel = async (req, res, next) => {
    try {
        const { orderId, productId } = req.params;
        const userId = req.session.user.id;
        console.log("Cancelling item:", orderId, productId);
        const order = await Orders.findById(orderId);
        if (!order) {
            return res.redirect('/orders?message=Order not found');

        }

        const item = order.orderedItem.find(
            item => item.productId.toString() === productId
        );

        if (!item) {
            return res.redirect('/orders?message=Product not found in order');
        }

        if (item.cancelled) {
            return res.redirect('/orders?message=Item already cancelled');
        }

        item.cancelled = true;

        const refundAmount = item.productId.salePrice * item.quantity;

        // Find or create wallet
        let wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            wallet = new Wallet({ userId, balance: 0, transactions: [] });
        }
        wallet.balance += refundAmount;
        wallet.transactions.push({
            type: "credit",
            amount: refundAmount,
            description: `Refund for cancelled item in order #${orderId}`,
            date: new Date(),
        });
        await wallet.save();

        const allCancelled = order.orderedItem.every(i => i.cancelled);
        if (allCancelled) {
            order.orderStatus = 'cancelled';
        }
        await order.save();
        res.redirect('/orders?message=Item cancelled successfully');
    } catch (err) {
        next(err)
    }
};

const OrderReturn = async (req, res, next) => {
    try {
        const { orderId, productId } = req.params;
        const userId = req.session.user.id;
        const order = await Orders.findById(orderId);
        if (!order) {
            return res.redirect('/orders?message=Order not found');
        }
        const item = order.orderedItem.find(
            item => item.productId.toString() === productId
        );
        if (!item) {
            return res.redirect('/orders?message=Product not found in order');
        }
        if (item.cancelled) {
            return res.redirect('/orders?message=Item already cancelled');
        }
        if (item.returned) {
            return res.redirect('/orders?message=Item already returned');
        }
        // Only allow return if order is delivered/completed
        if (!['completed'].includes(order.orderStatus)) {
            return res.redirect('/orders?message=Return allowed only after delivery');
        }
        item.returned = true;
        // Refund logic (skip for COD)
        if (order.paymentMethod !== 'cod') {
            const refundAmount = item.productId.salePrice * item.quantity;
            let wallet = await Wallet.findOne({ userId });
            if (!wallet) {
                wallet = new Wallet({ userId, balance: 0, transactions: [] });
            }
            wallet.balance += refundAmount;
            wallet.transactions.push({
                type: 'credit',
                amount: refundAmount,
                description: `Refund for returned item in order #${orderId}`,
                date: new Date(),
            });
            await wallet.save();
        }
        await order.save();
        res.redirect('/orders?message=Item returned successfully');
    } catch (err) {
        next(err);
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
    OrderReturn,
    razorpayment,
    verifypayment,
    razorpaySuccessPage,
    payWithWallet,

}