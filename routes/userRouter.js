const express = require("express");
const userRouter = express.Router();
const { loadhomepage, loadhome, loadlogin, loadregister, pageNotFound, loadOTP, mens, womens, shop } = require("../controllers/loadingController.js");
const { userLogin, userSignup, verifyotp, resentOtp,logout } = require('../controllers/userController.js');
const userproductController =require("../controllers/userproductController.js")
const passport = require("../config/passport.js");
const {userAuth}= require("../middleware/auth.js")


userRouter.get("/pageNotFound",userAuth, pageNotFound)
userRouter.get("/", loadhomepage);
userRouter.get("/home",loadhome)
userRouter.get("/login",loadlogin)
userRouter.post('/login', userLogin)
userRouter.get("/signup", userAuth,loadregister);
userRouter.post('/signup', userAuth,userSignup);
userRouter.get('/otp',userAuth, loadOTP);
userRouter.post('/otp', userAuth,verifyotp);
userRouter.post("/resend", userAuth,resentOtp);
userRouter.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
userRouter.get('/google/callback',passport.authenticate('google', { failureRedirect: '/signup' }),
 (req, res) => {
        res.redirect('/home');
    }  
);
// product management
userRouter.get("/productDetails",userproductController.productDetails);

userRouter.get("/logout",logout);
userRouter.get('/shop',userAuth,shop);
module.exports = userRouter;
