const express = require("express");
const adminRouter = express.Router();
const { getSalesChartData } = require("../controllers/admin/dashboard.js");
const { loadlogin,adminlogout, handleLogin } = require("../controllers/admin/adminAuth.js");
const { customerBlocked, customerInfo, customerUnblocked } = require("../controllers/admin/UserController.js");
const { categoryInfo, addCategory, addCategoryOffer, removeCategoryOffer, getEdiCategory, getListCategory, getUnlistCategory, editCategory } = require("../controllers/admin/categoryController.js");
const { getAllProducts, getEditProduct, getProductAddpage, addProducts, blockProduct, editProduct, unblockProduct, deleteSingleImage } = require("../controllers/admin/adminproductController.js");
const { getBrandpage, addBrand, blockBrand, unBlockBrand } = require("../controllers/admin/brandController");
const { getOrderpage,updateOrderStatus, approveReturn, rejectReturn } = require("../controllers/admin/adminOrderController.js");
const { adminAuth } = require("../middleware/adminAuth");
const multer = require("multer");
const storage = require("../helpers/multer");
const uploads = multer({ storage: storage });
const { loadcouponpage,createCoupon,deleteCoupon,editCoupon } = require("../controllers/admin/couponmanagement.js");
const { addOffer, GetOfferpage } = require("../controllers/admin/offerController.js");
const {  Generatesales, getsalespage,exportReport } = require("../controllers/admin/sales.js");


// loginmanagement
adminRouter.get("/", loadlogin);
adminRouter.post("/login", handleLogin);

adminRouter.get("/logout",adminAuth,adminlogout);

adminRouter.get('/dashboard',adminAuth,getSalesChartData);

// customer mnagement
adminRouter.get("/customers",adminAuth, customerInfo);
adminRouter.get("/blockCustomer",adminAuth, customerBlocked);
adminRouter.get("/UnblockCustomer",adminAuth, customerUnblocked);


// category management
adminRouter.get("/category",adminAuth, categoryInfo);
adminRouter.post("/addCategory",adminAuth, addCategory);
adminRouter.post("/addCategoryOffer",adminAuth, addCategoryOffer);
adminRouter.post("/removeCategoryOffer",adminAuth, removeCategoryOffer)
adminRouter.get("/listCategory",adminAuth, getListCategory);
adminRouter.get("/unlistCategory",adminAuth, getUnlistCategory);
adminRouter.get("/editCAtegory",adminAuth, getEdiCategory);
adminRouter.post("/editCategory/:id",adminAuth, editCategory);


// BrandManagement
adminRouter.get("/brands",adminAuth, getBrandpage);
adminRouter.post("/addBrand",adminAuth, uploads.single("image"), addBrand);
adminRouter.post("/blockBrand/:id",adminAuth, blockBrand);
adminRouter.get("/unBlockBrand",adminAuth, unBlockBrand);


// productmanagement
adminRouter.get("/addProducts",adminAuth, getProductAddpage);
adminRouter.post("/addproducts",adminAuth, uploads.array('images',3), addProducts);
adminRouter.get("/products",adminAuth, getAllProducts);
adminRouter.get("/blockProduct",adminAuth, blockProduct);
adminRouter.get("/unblockProduct", adminAuth,unblockProduct)
adminRouter.get("/editProduct",adminAuth, getEditProduct);
adminRouter.post("/editProduct/:id",adminAuth, uploads.array("images", 3), editProduct);
adminRouter.post("/deleteImage",adminAuth, deleteSingleImage);

// order management
adminRouter.get("/orders",adminAuth, getOrderpage);
adminRouter.post('/orders/update-status',adminAuth,updateOrderStatus);
adminRouter.post('/orders/:orderId/approve-return/:productId', adminAuth, approveReturn);
adminRouter.post('/orders/:orderId/reject-return/:productId', adminAuth, rejectReturn);

// coupon management
adminRouter.get("/coupons",adminAuth,loadcouponpage);
adminRouter.post("/coupons/add",adminAuth,createCoupon);
adminRouter.post("/coupons/delete/:id",adminAuth,deleteCoupon);
adminRouter.post("/coupons/edit/:id",adminAuth,editCoupon);

//offer management
adminRouter.get("/offer",adminAuth,GetOfferpage)
adminRouter.post("/offers/create",adminAuth,addOffer);

// sales report 
adminRouter.get("/sales-report",adminAuth,getsalespage);
adminRouter.get('/sales-reports/report/:period',adminAuth, Generatesales);
adminRouter.get('/sales-reports/export/:type',adminAuth,exportReport)
module.exports = adminRouter;