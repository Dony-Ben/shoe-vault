const Orders = require("../../models/order");
const Product = require('../../models/product')
const crypto = require("crypto");
const Offer = require('../../models/offers');
// const Wallet = require("../models/wallet.js");

// Utility: Get all active offers within date
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

// Utility: Get best offer for a product
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

// Update: calculateTotalPrice to accept offers and return detailed breakdown
const calculateTotalPrice = async (orderedItems, offers) => {
    let totalPrice = 0;
    let totalOfferDiscount = 0;
    for (const item of orderedItems) {
        const product = await Product.findById(item.productId);
        if (!product) {
            throw new Error(`Product not found: ${item.productId}`);
        }
        let price = product.salePrice;
        let offerDiscount = 0;
        if (offers && offers.length) {
            const best = getBestOfferForProduct(product, offers);
            if (best) {
                offerDiscount = best.discount;
            }
        }
        item.totalPrice = (price - offerDiscount) * item.quantity;
        item.offerDiscount = offerDiscount * item.quantity;
        totalPrice += item.totalPrice;
        totalOfferDiscount += item.offerDiscount;
    }
    return { totalPrice, totalOfferDiscount };
};

// Update: createOrder to apply offers
const createOrder = async ({ userId, products, totalPrice, address, paymentMethod, discount, couponApplied }) => {
    const orderedItems = products.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
    }));

    // Fetch active offers
    const offers = await getActiveOffers();
    // Calculate total price and offer discount
    const { totalPrice: calcTotal, totalOfferDiscount } = await calculateTotalPrice(orderedItems, offers);

    // Final amount: subtract offer discount and coupon discount
    const finalAmount = calcTotal - (discount || 0);

    const order = new Orders({
        userId,
        orderedItem: orderedItems,
        totalPrice: calcTotal,
        offerDiscount: totalOfferDiscount,
        discount: discount || 0,
        totalDiscount: (discount || 0) + totalOfferDiscount,
        couponApplied,
        finalAmount,
        orderDate: new Date(),
        deliveryAddress: {
            name: address.name,
            cityStatePincode: address.cityStatePincode,
            phone: address.phone,
        },
        deliveryCharge: 50,
        paymentMethod,
    });
    return order.save();
};

console.log("Attempting to verify payment with the following details:");
console.log("Order ID:", orderId);
console.log("Payment ID:", paymentId);
console.log("Signature:", signature);
const verifyRazorpayPayment = (orderId, paymentId, signature, secretKey) => {
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(orderId + "|" + paymentId);
    const generatedSignature = hmac.digest('hex');

    // Add logging for debugging
    console.log("Order ID:", orderId);
    console.log("Payment ID:", paymentId);
    console.log("Provided Signature:", signature);
    console.log("Generated Signature:", generatedSignature);

    return generatedSignature === signature;
};


module.exports = {
    calculateTotalPrice,
    createOrder,
    verifyRazorpayPayment,
};