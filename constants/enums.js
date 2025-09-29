const PRODUCT_SIZES = ["6", "7", "8", "9", "10", "11"];

const PRODUCT_COLORS = ["red", "green", "blue", "white", "black", "orange", "yellow", "violet", "purple", "gray", "pink"];

const PRODUCT_STATUS = ["Available", "Out of Stock", "Discontinued"];

const ADDRESS_TYPE = ['Home', 'Work', 'Other'];

const COUPON_TYPE = ['percentage', 'flat'];

const OFFER_TYPE = ['category', 'product'];

const DISCOUNT_TYPE = ['percentage', 'fixed'];

const ORDER_STATUS = ['pending', 'processing', 'shipped', 'completed', 'cancelled', 'returned'];

const PAYMENT_STATUS = ['Pending', 'Success', 'Failed'];

const PAYMENT_METHOD = ['cod', "razorpay", 'Wallet']

module.exports = {
    PRODUCT_SIZES,
    PRODUCT_COLORS,
    PRODUCT_STATUS,
    ADDRESS_TYPE,
    COUPON_TYPE,
    OFFER_TYPE,
    DISCOUNT_TYPE,
    ORDER_STATUS,
    PAYMENT_STATUS,
    PAYMENT_METHOD,
}