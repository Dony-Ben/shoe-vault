const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    type: { type: String, enum: ['percentage', 'flat'], required: true },
    discount: { type: Number, required: true },
    maxDiscount: { type: Number, default: null },
    isActive: { type: Boolean, default: true },
    expiryDate: { type: Date, required: true },
});

module.exports = mongoose.model('Coupon', couponSchema);