const express = require("express");
const adminRouter = express.Router();
const { loadlogin, loaddashboard, adminlogout, handleLogin } = require("../controllers/adminController");
const { customerBlocked, customerInfo, customerUnblocked } = require("../controllers/customerController");
const { categoryInfo, addCategory, addCategoryOffer, removeCategoryOffer, getEdiCategory, getListCategory, getUnlistCategory, editCategory} = require("../controllers/categoryController");
const { getAllProducts, getEditProduct, getProductAddpage, addProducts, blockProduct, editProduct, unblockProduct, deleteSingleImage } = require("../controllers/productController");
const { getBrandpage, addBrand, blockBrand, unBlockBrand, deleteBrand } = require("../controllers/brandController");
const {adminAuth} = require("../middleware/auth");

const multer = require("multer");
const storage = require("../helpers/multer");
const uploads = multer({storage:storage});


// loginmanagement
adminRouter.get("/", loadlogin);
adminRouter.post("/login", handleLogin);
adminRouter.get("/dashboard", loaddashboard);
adminRouter.get("/logout",adminlogout);


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
adminRouter.post("/addproducts", uploads.array('images'),  addProducts);
adminRouter.get("/products", getAllProducts);
adminRouter.get("/blockProduct", blockProduct);
adminRouter.get("/unblockProduct", unblockProduct)
adminRouter.get("/editProduct", getEditProduct);
adminRouter.post("/editProduct/:id",uploads.array("images",3), editProduct);
adminRouter.post("/deleteImage", deleteSingleImage);


module.exports = adminRouter;