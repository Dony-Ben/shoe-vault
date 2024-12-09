const express = require("express");
const adminRouter = express.Router();
const adminController = require("../controllers/adminController");
const customerController = require("../controllers/customerController")
const categoryController = require("../controllers/categoryController")
const productController = require("../controllers/productController")
const multer = require('multer');
const {adminAuth} = require("../middleware/auth")

// adminRouter.get("/pageError",adminController.pageerror)
adminRouter.get("/", adminController.loadlogin);
// loginmanagement
adminRouter.post("/login", adminController.handleLogin);
adminRouter.get("/dashboard",adminAuth,adminController.loaddashboard)
adminRouter.get("/logout",adminAuth,adminController.adminlogout)
// customer mnagement
adminRouter.get("/customers",adminAuth,customerController.customerInfo);
adminRouter.get("/blockCustomer",adminAuth,customerController.customerBlocked);
adminRouter.get("/UnblockCustomer",adminAuth,customerController.customerUnblocked);
// category management
adminRouter.get("/category",adminAuth,categoryController.categoryInfo);
adminRouter.post("/addCategory",adminAuth,categoryController.addCategory);
adminRouter.post("/addCategoryOffer",adminAuth,categoryController.addCategoryOffer);
adminRouter.post("/removeCategoryOffer",adminAuth,categoryController.removeCategoryOffer)
adminRouter.get("/listCategory",adminAuth,categoryController.getListCategory);
adminRouter.get("/unlistCategory",adminAuth,categoryController.getUnlistCategory);
adminRouter.get("/editCAtegory",adminAuth,categoryController.getEdiCategory);
adminRouter.post("/editCategory/:id",adminAuth,categoryController.editCategory)
// productmanagement
adminRouter.get("/addProducts",adminAuth,productController.getProductAddpage);

module.exports = adminRouter