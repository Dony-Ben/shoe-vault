const mongoose = require("mongoose");
const ordersSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    razorpayOrderId: {
        type: String,
    },
    orderedItem: [{

        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            default: 1
        },
         cancelled: {
        type: Boolean,
        default: false
    }
    }],
    deliveryAddress: {
        name: { type: String, required: true },
        cityStatePincode: { type: String, required: true },
        phone: {
            type: String,
            required: true,
        }
    },
    orderStatus: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    paymentStatus: {
        type: String,
        required: true,
        enum: ['Pending', 'Success', 'Failed'],
        default: 'Pending'
    },
    paymentMethod: {
        type: String,
        enum: ['cod', "razorpay", 'Wallet'],
        required: true
    },
    offerDiscount: {
        type: Number,
        default: 0
    },
    discount: { type: Number, default: 0 },
    totalDiscount: {
        type: Number,
        default: 0
    },
    deliveryCharge: {
        type: Number,
        default: 0
    },
    finalAmount: {
        type: Number,
    },
    cancelled: { type: Boolean, default: false },
    returned: { type: Boolean, default: false },
    invoiceDate: { type: Date, default: Date.now },
    couponCode: { type: String },
    couponApplied: { type: Boolean, required: true, default: false },
    orderDate: { type: Date, default: Date.now }
});

ordersSchema.index({ userId: 1, orderDate: -1 });
ordersSchema.index({ orderStatus: 1 });

const Orders = mongoose.model('Orders', ordersSchema);
module.exports = Orders