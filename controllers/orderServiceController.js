const Orders = require("../models/order");
const Product = require('../models/product')
const crypto = require("crypto");
// const Wallet = require("../models/wallet.js");

const calculateTotalPrice = async (orderedItems) => {
    let totalPrice = 0;
    for (const item of orderedItems) {
        const product = await Product.findById(item.productId);
        if (!product) {
            throw new Error(`Product not found: ${item.productId}`);
        }
        item.totalPrice = product.salePrice * item.quantity;
        totalPrice += item.totalPrice;
    }
    return totalPrice;
};

const createOrder = async ({ userId, products, totalPrice, address, paymentMethod,discount ,couponApplied}) => {
    const orderedItems = products.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
    }));

    const order = new Orders({
        userId,
        orderedItem: orderedItems,
        totalPrice: 0,
        discount,
        couponApplied,
        finalAmount: totalPrice,
        orderDate: new Date(),
        deliveryAddress: {
            name: address.name,
            cityStatePincode: address.cityStatePincode,
            phone: address.phone,
        },
        deliveryCharge: 50,
        paymentMethod,
    });
    console.log("order", order);

    order.totalPrice = await calculateTotalPrice(order.orderedItem);
    return order.save();
};

const verifyRazorpayPayment = (orderId, paymentId, signature, secretKey) => {
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(orderId + "|" + paymentId);
    const generatedSignature = hmac.digest('hex');
    return generatedSignature === signature;
};


module.exports = {
    calculateTotalPrice,
    createOrder,
    verifyRazorpayPayment,
};