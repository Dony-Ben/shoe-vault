const express = require("express");
const userRouter = express.Router();
const passport = require("passport");
const {
  loadhomepage,
  loadhome,
  loadlogin,
  loadregister,
  pageNotFound,
  loadOTP,
  shop,
  // category,  
  about
} = require("../controllers/loadingController.js");

const {
  userLogin,
  userSignup,
  verifyotp,
  resentOtp,
  logout,
} = require('../controllers/userController.js');
const { productDetails } = require("../controllers/userproductController.js");
const { userAuth, ensureGuest } = require("../middleware/auth.js");
const { getcartpage, cartaddToCart, deleteProduct, quantityManage } = require("../controllers/cartController.js");
const { getForgotPassPage, forgotEmailValid, verifyOtp, resetPassword, loadProfile, geteditprofile, editprofile, loadAddresses, AddAddressForm, editAddress, getAddressById, deleteAddress } = require("../controllers/profileController.js");
const { loadcheckout, OrderConfirmation, ordersuccess, getOrders, OrderCancel, razorpayment, verifypayment, razorpaySuccessPage, payWithWallet } = require("../controllers/orderController.js");
const { wishlist, wishlistadd, ProductRemove } = require("../controllers/wishlistController.js");
const { loadWallet, addFunds } = require("../controllers/walletController.js");
const { couponValidation } = require("../controllers/userCouponController.js");
userRouter.get("/", loadhomepage);
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
userRouter.get('/profile', loadProfile);
userRouter.get('/edit-profile', geteditprofile);
userRouter.post('/edit-profile', editprofile);
userRouter.get('/address', loadAddresses);
userRouter.post('/add-address', AddAddressForm);
userRouter.post('/edit-address/:id', editAddress);
userRouter.get('/edit-address/:id', getAddressById);
userRouter.post('/user/delete-address/:id', deleteAddress);


// Authenticated routes (Require login)
userRouter.get("/home", userAuth, loadhome);
userRouter.get("/logout", logout);
userRouter.get("/pageNotFound", userAuth, pageNotFound);
userRouter.get("/shop", userAuth, shop);
// userRouter.get("/shop", category);
userRouter.get("/about", about)

// OTP Management
userRouter.get('/otp', ensureGuest, loadOTP);
userRouter.post('/otp', ensureGuest, verifyotp);
userRouter.post("/resend", ensureGuest, resentOtp);


// google authentication
userRouter.get("/auth/google", passport.authenticate('google', { scope: ['profile', 'email'] }));
userRouter.get("/google/callback", passport.authenticate("google", { failureRedirect: "/signup" }),
  (req, res) => { req.session.user = { id: req.user.id, email: req.user.email, }; res.redirect("/home"); });


// Product management
userRouter.get("/productDetails", productDetails);


// cartmanagement
userRouter.get("/cart", userAuth, getcartpage);
userRouter.post("/cart/add", userAuth, cartaddToCart);
userRouter.delete('/cart/delete/:productId', deleteProduct);
userRouter.post('/api/cart/update/:itemId', quantityManage);


// product order 
userRouter.get("/checkout", loadcheckout);
userRouter.post("/checkout", OrderConfirmation);
userRouter.get("/order-success/:orderId", ordersuccess);
userRouter.get("/orders", getOrders);
userRouter.post("/create-order", razorpayment);
userRouter.post("/place-order", verifypayment);
userRouter.get("/razorpay-successpage/:orderId", razorpaySuccessPage);
userRouter.post("/orders/:orderId/cancel", OrderCancel);
userRouter.post("/paywallet", payWithWallet)
userRouter.post("/validate-coupon", couponValidation);

//wishlist management
userRouter.get("/wishlist", wishlist);
userRouter.post("/wishlist-add", wishlistadd);
userRouter.delete("/wishlist/remove/:productId", ProductRemove);

//wallet management
userRouter.get("/wallet", loadWallet);
userRouter.post("/addfunds", addFunds);

module.exports = userRouter;  
