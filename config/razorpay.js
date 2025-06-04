const Razorpay = require("razorpay");
const env = require("dotenv").config();
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_ID_KEY,
    key_secret: process.env.RAZORPAY_SECRET_KEY
    
})
module.exports = razorpay;