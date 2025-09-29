const mongoose = require('mongoose');
const { COUPON_TYPE } = require('../constants/enums');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        enum: COUPON_TYPE,
        required: true
    },
    discount: {
        type: Number,
        required: true
    },
    maxDiscount: {
        type: Number,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    expiryDate: {
        type: Date,
        required: true
    },
});

module.exports = mongoose.model('Coupon', couponSchema);