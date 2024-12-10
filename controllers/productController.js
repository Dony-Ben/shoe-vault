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
        const Categories = await Category.find({ isListed: true });
        res.render("admin/product-add", {
            cat: Categories,

        })
    } catch (error) {
        console.error("Error in getProductAddPage:", error);
        res.redirect("/pageError")
    }
};

const addProducts = async (req, res) => {
    try {
        const Products = req.body;
        console.log(req.body);

        const ProductExists = await Product.findOne({
            productName: Products.productName,

        });
        if (ProductExists) {
            return console.log("product already exist");
        }

        const images = [];
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                const originalImagePath = req.files[i].path;
                const resizedImagePath = path.join('public', 'uploads', 'product-images', req.files[i].filename);
                await sharp(originalImagePath).resize({ width: 440, height: 440 }).toFile(resizedImagePath);
                images.push(req.files[i].filename);
            }
            console.log(images);
            console.log(req.body);
            
            const categoryid = await Category.findOne({ name: Products.category });
            if (!categoryid) {
                return res.status(400).send("Invalid category name");
            }
            const newProduct = new Product({
                productName: Products.productName,
                description: Products.description,
                category: categoryid._id,
                regularPrice: Products.regularPrice,
                salePrice: Products.salePrice,
                quantity: Products.quantity,
                // size:Products.size,
                productImage: images,
            })
            await newProduct.save();
            return res.redirect("/admin/addProducts")
        } else {
            return res.status(400).json("product already exist,plaese try with another name");
        }
    } catch (error) {
        console.log("Error saving product", error);
        return res.redirect("/admin/pageError")

    }
}
const getAllProducts = async (req, res) => {
    try {
        const search = req.query.search || "";
        const page = parseInt(req.query.page) || 1;
        const limit = 4;

        // Fetch product data with pagination and filtering
        const productData = await Product.find({
            $or: [
                { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
                { brand: { $regex: new RegExp(".*" + search + ".*", "i") } },
            ],
        })
            .limit(limit)
            .skip((page - 1) * limit)
            .populate("category")
            .exec();

        // Count total documents for pagination
        const count = await Product.find({
            $or: [
                { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
                { brand: { $regex: new RegExp(".*" + search + ".*", "i") } },
            ],
        }).countDocuments();

        // Fetch categories and brands
        const category = await Category.find({ isListed: true });
        const brand = await Brand.find({ isblocked: false });

        // Render the product page
        if (category && brand) {
            res.render("admin/products", {
                data: productData,
                currentPage: page,
                totalPages: Math.ceil(count / limit),
                cat: category,
                brand: brand,
            });
        } else {
            res.render("page-404");
        }
    } catch (error) {
        console.error("Error loading products:", error);
        res.redirect("/pageError");
    }
};
const blockProduct = async (req,res) => {
    try {
        let id = req.query.id;
        await Product.updateOne({_id:id},{$set:{isblocked:true}});
        res.redirect("/admin/products");

    } catch (error) {
        res.redirect("/pageError")
    }
}
const unblockProduct = async (req, res) => {
    try {
        let id = req.query.id;
        await Product.updateOne({ _id: id }, { $set: { isblocked: false } });

        res.redirect("/admin/products"); 
    } catch (error) {
        res.redirect("/pageError");
    }
};

module.exports = {
    getProductAddpage,
    addProducts,
    getAllProducts,
    blockProduct,
    unblockProduct,

}