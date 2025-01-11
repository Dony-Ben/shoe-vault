const Product = require("../models/product");
const Category = require("../models/category");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { query } = require("express");
const Brand = require("../models/Brands");
const { set } = require("mongoose");


const getProductAddpage = async (req, res) => {
    try {
        const categories = await Category.find({ isListed: true }).lean();
        const brands = await Brand.find({ isBlocked: false });
        console.log(brands);
        res.render("admin/product-add", { cat: categories, brands });
    } catch (error) {
        console.error("Error in getProductAddPage:", error.message);
        res.redirect("/admin/pageError");
    }
};

const addProducts = async (req, res) => {
    try {
        const productData = req.body;
        const productExists = await Product.findOne({ productName: productData.productName });
        if (productExists) {
            return res.status(400).json("Product already exists. Please use a different name.");
        }
        const images = [];
        if (req.files?.length > 0) {
            for (const file of req.files) {
                const originalImagePath = file.path;
                const resizedImagePath = path.join('public', 'uploads', 'product-images', file.filename);
                await sharp(originalImagePath).resize({ width: 440, height: 440 }).toFile(resizedImagePath);
                images.push(file.filename);

            }
        } else {
            return res.status(400).send("No images uploaded. Please try again.");
        }

        const category = await Category.findOne({ name: productData.category });
        if (!category) {
            return res.status(400).send("Invalid category name.");
        }
        const brand = await Brand.findOne({ brandName: productData.brand });
        if (!brand) {
            return res.status(400).send("Invalid brand name.");
        }
        const newProduct = new Product({
            productName: productData.productName,
            description: productData.description,
            category: category._id,
            regularPrice: productData.regularPrice,
            salePrice: productData.salePrice,
            quantity: productData.quantity,
            productImage: images,
            brands: brand._id,
        });
        console.log("newProduct", newProduct);
        await newProduct.save();
        res.redirect("/admin/addProducts");
    } catch (error) {
        console.error("Error saving product:", error.message);
        res.render("/admin/pageError");
    }
};

const getAllProducts = async (req, res) => {
    try {
        const search = req.query.search || "";
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 4;
        const searchQuery = {
            $or: [
                { productName: { $regex: new RegExp(search, "i") } },
                { brand: { $regex: new RegExp(search, "i") } },
            ],
        };
        const [productData, count, categories, brands] = await Promise.all([
            Product.find(searchQuery)
                .limit(limit)
                .skip((page - 1) * limit)
                .populate("category")
                .populate("brands")
                .lean(),

            Product.countDocuments(searchQuery),
            Category.find({ isListed: true }).lean(),
            Brand.find({ isblocked: false }).lean(),
        ]);

        if (!productData.length) {
            return res.status(404).render("admin/page-404");
        }

        console.log("this is product data", productData);

        res.render("admin/products", {
            data: productData,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            cat: categories,
            brand: brands,

        });
    } catch (error) {
        console.error("Error loading products:", error.message);
        res.status(500).render("admin/pageError", { error: error.message });
    }
};

const blockProduct = async (req, res) => {
    try {
        const id = req.query.id;
        const product = await Product.findByIdAndUpdate(id, { isblocked: true }, { new: true });

        if (!product) {
            return res.status(404).send("Product not found");
        }

        res.redirect("/admin/products");
    } catch (error) {
        console.error("Error blocking product:", error);
        res.status(500).render("admin/pageError", { error: error.message });
    }
};

const unblockProduct = async (req, res) => {
    try {
        let id = req.query.id;
        await Product.updateOne({ _id: id }, { $set: { isblocked: false } });

        res.redirect("/admin/products");
    } catch (error) {
        res.redirect("/pageError");
    }
};

const getEditProduct = async (req, res) => {
    try {
        const id = req.query.id;
        const product = await Product.findById(id);
        const category = await Category.find({});
        const brand = await Brand.find({});
        res.render("admin/editproduct", {
            product: product,
            cat: category,
            brand: brand,
        })
    } catch (error) {
        res.render("admin/page-404")
    }
};

const editProduct = async (req, res) => {
    try {
        const id = req.params.id;
        console.log("Product ID:", id);
        console.log("Form data:", req.body);

        const product = await Product.findOne({ _id: id });
        if (!product) {
            return res.status(404).send("Product not found.");
        }

        const data = req.body;
        const category = await Category.findOne({ name: data.category });
        if (!category) {
            return res.status(400).send("Invalid category name.");
        }

        const brand = await Brand.findOne({ brandName: new RegExp(`^${data.brand}$`, 'i') });
        if (!brand) {
            return res.status(400).send("Invalid brand name.");
        }

        const images = [];
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                images.push(req.files[i].filename);
            }
        }

        const uploadFields = {
            productName: data.productName,
            description: data.descriptionData,
             brand: brand._id,
            category: category,
            regularPrice: data.regularPrice,
            salePrice: data.salePrice,
            quantity: data.quantity,
        };
        console.log("Update fields:", uploadFields);

        if (images.length > 0) {
            uploadFields.productImage = images;
        }

        const updatedProduct = await Product.findByIdAndUpdate(id, uploadFields, { new: true });
        console.log("Updated product:", updatedProduct);

        res.redirect("/admin/products");
    } catch (error) {
        console.error("Error updating product:", error);
        res.redirect("/pageError");
    }
};

const deleteSingleImage = async (req, res) => {
    try {
        const { imageNameToserver, productIdTosever } = req.body;

        // Remove the image name from the product document
        const product = await Product.findByIdAndUpdate(
            productIdTosever,
            { $pull: { productImage: imageNameToserver } },
            { new: true } // Return the updated document
        );

        if (!product) {
            return res.status(404).send({ status: false, message: "Product not found" });
        }

        const imagePath = path.join("public", "uploads", "product-images", imageNameToserver);
        if (fs.existsSync(imagePath)) {
            await fs.promises.unlink(imagePath);
            console.log(`Image ${imageNameToserver} deleted successfully`);
        } else {
            console.log(`Image ${imageNameToserver} not found`);
        }

        // Send a success response
        res.send({ status: true });
    } catch (error) {
        console.error("Error deleting image:", error);
        res.redirect("/pageError");
    }
};

module.exports = {
    getProductAddpage,
    addProducts,
    getAllProducts,
    blockProduct,
    unblockProduct,
    getEditProduct,
    editProduct,
    deleteSingleImage,

}