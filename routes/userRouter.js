const express = require("express");
const userRouter = express.Router();
const {
  loadhomepage,
  loadhome,
  loadlogin,
  loadregister,
  pageNotFound,
  loadOTP,
  shop,
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
const {getcartpage,cartaddToCart,deleteProduct,quantityManage} = require("../controllers/cartController.js")
const passport = require("passport");
const {getForgotPassPage,forgotEmailValid,verifyOtp,resetPassword,loadProfile,geteditprofile,editprofile,loadAddresses,AddAddressForm,editAddress,getAddressById} =require("../controllers/profileController.js")
const {loadcheckout,OrderConfirmation,ordersuccess} = require("../controllers/orderController.js");
userRouter.get("/", loadhomepage);
userRouter.get("/login", ensureGuest, loadlogin);
userRouter.post("/login", userLogin);
userRouter.get("/signup", ensureGuest, loadregister);
userRouter.post("/signup", userSignup);

// profileController
userRouter.get("/forgotpassword",getForgotPassPage);
userRouter.post("/resetpassword",forgotEmailValid);
userRouter.post("/verify-otp",verifyOtp);
userRouter.post("/set-new-password",resetPassword);
// editin user profile
userRouter.get('/profile',loadProfile);
userRouter.get('/edit-profile',geteditprofile);
userRouter.post('/edit-profile',editprofile);
userRouter.get('/address', loadAddresses);
userRouter.post('/add-address', AddAddressForm);
userRouter.post('/edit-address/:id',editAddress);
userRouter.get('/edit-address/:id', getAddressById);

// Authenticated routes (Require login)
userRouter.get("/home", userAuth, loadhome);
userRouter.get("/logout", logout);
userRouter.get("/pageNotFound", userAuth, pageNotFound);
userRouter.get("/shop", userAuth, shop);
userRouter.get("/about",about)

// OTP Management
userRouter.get('/otp', ensureGuest, loadOTP);
userRouter.post('/otp', ensureGuest, verifyotp);
userRouter.post("/resend", ensureGuest, resentOtp);


// google authentication
userRouter.get("/auth/google", passport.authenticate('google', { scope: ['profile', 'email'] }));
userRouter.get("/google/callback", passport.authenticate("google", { failureRedirect: "/signup" }),
  (req, res) => { req.session.user = { id: req.user.id, email: req.user.email, }; res.redirect("/home"); });


// Product management
userRouter.get("/productDetails", userAuth, productDetails);


// cartmanagement
userRouter.get("/cart", getcartpage);
userRouter.get("/cart/add", cartaddToCart); 
userRouter.delete('/cart/delete/:productId', deleteProduct);
userRouter.post('/api/cart/update/:itemId',quantityManage);

// product order 
userRouter.get("/checkout",loadcheckout);
userRouter.post("/checkout", OrderConfirmation);
userRouter.get("/order-success/:orderId",ordersuccess)


module.exports = userRouter;
