const Order = require("../../models/order.js");
const Coupon = require("../../models/coupon.js");
const { STATUS_CODES } = require("../httpStatusCodes.js");

const couponValidation = async (req, res) => {
    try {
        const { couponcode, subtotal, userId } = req.body;

        const coupon = await Coupon.findOne({ code: couponcode.trim(), isActive: true });
        if (!coupon) {
            return res.status(STATUS_CODES.BadRequest).json({ success: false, message: "Invalid or expired coupon." });
        }

        const currentDate = new Date();
        if (coupon.expiryDate < currentDate) {
            return res.status(STATUS_CODES.BadRequest).json({ success: false, message: "Coupon has expired." });
        }

        if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
            return res.status(STATUS_CODES.BadRequest).json({ success: false, message: `Minimum order should be ₹${coupon.minOrderAmount}.` });
        }

        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return res.status(STATUS_CODES.BadRequest).json({ success: false, message: "Coupon usage limit reached." });
        }

        if (coupon.usedBy && coupon.usedBy.includes(userId)) {
            return res.status(STATUS_CODES.BadRequest).json({ success: false, message: "You have already used this coupon." });
        }

        let discount = 0;
        if (coupon.type === "percentage") {
            discount = (subtotal * coupon.discount) / 100;
            if (coupon.maxDiscount) {
                discount = Math.min(discount, coupon.maxDiscount);
            }
        } else if (coupon.type === "flat") {
            discount = coupon.discount;
        }
        const newTotal = subtotal - discount;
        return res.status(STATUS_CODES.OK).json({
            success: true,
            discount,
            newTotal,
            message: "Coupon applied successfull."
        }); 

    } catch (error) {
        console.error(error);
        return res.status(STATUS_CODES.InternalServerError).json({ success: false, message: "Server error." });
    }
}

module.exports = {
    couponValidation,

}