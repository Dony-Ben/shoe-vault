const express = require("express");
const adminRouter = express.Router();
const { loaddashboard,getSalesChartData } = require("../controllers/admin/dashboard.js");
const { loadlogin,adminlogout, handleLogin } = require("../controllers/admin/adminAuth.js");
const { customerBlocked, customerInfo, customerUnblocked } = require("../controllers/admin/UserController.js");
const { categoryInfo, addCategory, addCategoryOffer, removeCategoryOffer, getEdiCategory, getListCategory, getUnlistCategory, editCategory } = require("../controllers/admin/categoryController.js");
const { getAllProducts, getEditProduct, getProductAddpage, addProducts, blockProduct, editProduct, unblockProduct, deleteSingleImage } = require("../controllers/admin/adminproductController.js");
const { getBrandpage, addBrand, blockBrand, unBlockBrand, deleteBrand } = require("../controllers/admin/brandController");
const { getOrderpage,updateOrderStatus } = require("../controllers/admin/adminOrderController.js");
const { adminAuth } = require("../middleware/auth");
const multer = require("multer");
const storage = require("../helpers/multer");
const uploads = multer({ storage: storage });
const { loadcouponpage,createCoupon,deleteCoupon,editCoupon } = require("../controllers/admin/admincouponController.js");
const { addOffer, GetOfferpage } = require("../controllers/admin/offerController.js");
const {  Generatesales, getsalespage } = require("../controllers/admin/sales.js");

// dashboard.
// adminRouter.get("/dashboard",loaddashboard);
adminRouter.get('/dashboard',getSalesChartData);

// loginmanagement
adminRouter.get("/", loadlogin);
adminRouter.post("/login", handleLogin);
adminRouter.get("/logout", adminlogout);


// customer mnagement
adminRouter.get("/customers", customerInfo);
adminRouter.get("/blockCustomer", customerBlocked);
adminRouter.get("/UnblockCustomer", customerUnblocked);


// category management
adminRouter.get("/category", categoryInfo);
adminRouter.post("/addCategory", addCategory);
adminRouter.post("/addCategoryOffer", addCategoryOffer);
adminRouter.post("/removeCategoryOffer", removeCategoryOffer)
adminRouter.get("/listCategory", getListCategory);
adminRouter.get("/unlistCategory", getUnlistCategory);
adminRouter.get("/editCAtegory", getEdiCategory);
adminRouter.post("/editCategory/:id", editCategory);


// BrandManagement
adminRouter.get("/brands", getBrandpage);
adminRouter.post("/addBrand", uploads.single("image"), addBrand);
adminRouter.get("/blockBrand", blockBrand);
adminRouter.get("/unBlockBrand", unBlockBrand);
adminRouter.get("/deleteBrand", deleteBrand);


// productmanagement
adminRouter.get("/addProducts", getProductAddpage);
adminRouter.post("/addproducts", uploads.array('images'), addProducts);
adminRouter.get("/products", getAllProducts);
adminRouter.get("/blockProduct", blockProduct);
adminRouter.get("/unblockProduct", unblockProduct)
adminRouter.get("/editProduct", getEditProduct);
adminRouter.post("/editProduct/:id", uploads.array("images", 3), editProduct);
adminRouter.post("/deleteImage", deleteSingleImage);

// order management
adminRouter.get("/orders", getOrderpage);
adminRouter.post('/orders/update-status',updateOrderStatus);

// coupon management
adminRouter.get("/coupons",loadcouponpage);
adminRouter.post("/coupons/add",createCoupon);
adminRouter.post("/coupons/delete/:id",deleteCoupon);
adminRouter.post("/coupons/edit/:id",editCoupon);

//offer management
adminRouter.get("/offer",GetOfferpage)
adminRouter.post("/offers/create",addOffer);

// sales report 
adminRouter.get("/sales-report",getsalespage);
adminRouter.get('/sales-reports/report/:period', Generatesales);
module.exports = adminRouter;