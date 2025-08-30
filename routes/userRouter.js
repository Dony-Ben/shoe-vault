const express = require("express");
const userRouter = express.Router();
const passport = require("passport");
const {
  landingpage,
  loadhome,
  loadlogin,
  loadregister,
  pageNotFound,
  loadOTP,
  shop,
  about,
} = require("../controllers/user/loadingController.js");

const {
  userLogin,
  userSignup,
  verifyotp,
  resentOtp,
  logout,
} = require('../controllers/user/userController.js');
const { productDetails } = require("../controllers/user/userproductController.js");
const { userAuth, ensureGuest } = require("../middleware/auth.js");
const { getcartpage, cartaddToCart, deleteProduct, quantityManage } = require("../controllers/user/cartController.js");
const { getForgotPassPage, forgotEmailValid, verifyOtp, resetPassword, loadProfile, geteditprofile, editprofile, loadAddresses, AddAddressForm, editAddress, getAddressById, deleteAddress } = require("../controllers/user/profileController.js");
const { loadcheckout, OrderConfirmation, ordersuccess, getOrders, OrderCancel, razorpayment, verifypayment, razorpaySuccessPage,payWithWallet } = require("../controllers/user/orderController.js");
const { wishlist, wishlistadd, ProductRemove } = require("../controllers/user/wishlistController.js");
const { loadWallet, addFunds } = require("../controllers/user/walletController.js");
const { couponValidation } = require("../controllers/user/couponController.js");
const { downloadInvoice } = require("../controllers/user/invoice.js");
userRouter.get("/", landingpage);
userRouter.get("/login", ensureGuest, loadlogin);
userRouter.post("/login", userLogin);
userRouter.get("/signup", ensureGuest, loadregister);
userRouter.post("/signup", userSignup);

// profileController
userRouter.get("/forgotpassword", getForgotPassPage);
userRouter.post("/resetpassword", forgotEmailValid);
userRouter.post("/verify-otp", verifyOtp);
userRouter.post("/set-new-password", resetPassword);

// editin user profile
userRouter.get('/profile', userAuth, loadProfile);
userRouter.get('/edit-profile', userAuth, geteditprofile);
userRouter.post('/edit-profile', userAuth, editprofile);
userRouter.get('/address', userAuth, loadAddresses);
userRouter.post('/add-address', userAuth, AddAddressForm);
userRouter.post('/edit-address/:id', userAuth, editAddress);
userRouter.get('/edit-address/:id', userAuth, getAddressById);
userRouter.post('/user/delete-address/:id', userAuth, deleteAddress);


// Authenticated routes (Require login)
userRouter.get("/home", userAuth, loadhome);
userRouter.get("/logout", logout);
userRouter.get("/pageNotFound", userAuth, pageNotFound);
userRouter.get("/shop",shop);
userRouter.get("/about", userAuth, about)

// OTP Management
userRouter.get('/otp', ensureGuest, loadOTP);
userRouter.post('/otp', ensureGuest, verifyotp);
userRouter.post("/resend", ensureGuest, resentOtp);


// google authentication
userRouter.get("/auth/google", passport.authenticate('google', { scope: ['profile', 'email'] }));
userRouter.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/signup" }),
  (req, res) => {  req.session.user = { id: req.user.id, email: req.user.email, }; res.redirect("/home"); });


// Product management
userRouter.get("/productDetails", productDetails);


// cartmanagement
userRouter.get("/cart", userAuth, getcartpage);
userRouter.post("/cart/add", userAuth, cartaddToCart);
userRouter.delete('/cart/delete/:productId', userAuth, deleteProduct);
userRouter.post('/api/cart/update/:itemId', userAuth, quantityManage);


// product order 
userRouter.get("/checkout", userAuth, loadcheckout);
userRouter.post("/checkout", userAuth, OrderConfirmation);
userRouter.get("/order-success/:orderId", userAuth, ordersuccess);
userRouter.get("/orders", userAuth, getOrders);
userRouter.post("/create-order", userAuth, razorpayment);
userRouter.post("/place-order", userAuth, verifypayment);
userRouter.get("/razorpay-successpage/:orderId", userAuth, razorpaySuccessPage);
userRouter.post("/paywallet", userAuth, payWithWallet);
userRouter.post("/orders/:orderId/cancel-item/:productId", userAuth, OrderCancel);
userRouter.post("/validate-coupon", userAuth, couponValidation);
userRouter.post("/orders/:orderId/return-item/:productId", userAuth, require("../controllers/user/orderController.js").OrderReturn);

//wishlist management
userRouter.get("/wishlist", userAuth, wishlist);
userRouter.post("/wishlist-add", userAuth, wishlistadd);
userRouter.delete("/wishlist/remove/:productId", userAuth, ProductRemove);

//wallet management
userRouter.get("/wallet", userAuth, loadWallet);
userRouter.post("/addfunds", userAuth, addFunds);

userRouter.get("/download-invoice/:orderId", userAuth, downloadInvoice);
module.exports = userRouter;  
