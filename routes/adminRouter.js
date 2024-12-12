const express = require("express");
const adminRouter = express.Router();
const adminController = require("../controllers/adminController");
const customerController = require("../controllers/customerController");
const categoryController = require("../controllers/categoryController");
const productController = require("../controllers/productController");
const brandController = require("../controllers/brandController");
const multer = require("multer");
const storage = require("../helpers/multer");
const uploads = multer({storage:storage});
const {adminAuth} = require("../middleware/auth");

// adminRouter.get("/pageError",adminController.pageerror)
adminRouter.get("/", adminController.loadlogin);
// loginmanagement
adminRouter.post("/login", adminController.handleLogin);
adminRouter.get("/dashboard",adminAuth,adminController.loaddashboard);
adminRouter.get("/logout",adminAuth,adminController.adminlogout);
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
adminRouter.post("/editCategory/:id",adminAuth,categoryController.editCategory);
// BrandManagement
adminRouter.get("/brands",adminAuth,brandController.getBrandpage);
adminRouter.post("/addBrand",adminAuth,uploads.single("image"),brandController.addBrand);
adminRouter.get("/blockBrand",adminAuth,brandController.blockBrand);
adminRouter.get("/unBlockBrand",adminAuth,brandController.unBlockBrand);
adminRouter.get("/deleteBrand",adminAuth,brandController.deleteBrand);
// productmanagement
adminRouter.get("/addProducts",productController.getProductAddpage);
adminRouter.post("/addproducts",uploads.array('images'), productController.addProducts);
adminRouter.get("/products",adminAuth,productController.getAllProducts);
adminRouter.get("/blockProduct",adminAuth,productController.blockProduct);
adminRouter.get("/unblockProduct",adminAuth,productController.unblockProduct)
adminRouter.get("/editProduct",adminAuth,productController.getEditProduct);
adminRouter.post("/editProduct/:id",adminAuth,uploads.array("images",3),productController.editProduct);
adminRouter.post("/deleteImage",adminAuth,productController.deleteSingleImage);


module.exports = adminRouter