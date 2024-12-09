const express = require("express");
const userRouter = express.Router();
const { loadhomepage, loadhome, loadlogin, loadregister, pageNotFound, loadOTP, mens, womens } = require("../controllers/loadingController.js");
const { userLogin, userSignup, verifyotp, resentOtp,logout } = require('../controllers/userController.js');
const passport = require("../config/passport.js");
const {userAuth}= require("../middleware/auth.js")
userRouter.get("/pageNotFound", pageNotFound)
userRouter.get("/", loadhomepage)
userRouter.get("/home",loadhome)
userRouter.get("/login", loadlogin)
userRouter.post('/login', userLogin)
userRouter.get("/signup", loadregister)
userRouter.post('/signup', userSignup)
userRouter.get('/otp', loadOTP)
userRouter.post('/otp', verifyotp)
userRouter.post("/resend", resentOtp)
userRouter.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
userRouter.get('/google/callback',passport.authenticate('google', { failureRedirect: '/signup' }),
 (req, res) => {
        res.redirect('/home');
    }
);
userRouter.get("/logout",logout)
userRouter.get('/mens',mens)
userRouter.get('/women',womens)
module.exports = userRouter;
