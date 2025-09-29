const { RENDER_PAGE_KEYS } = require("../../constants/renderPageKeys");
const { STATUS_CODES } = require("../../constants/httpStatusCodes");
const Product = require("../../models/product");
const Category = require("../../models/category");
const Brand = require("../../models/Brands");
const { notifyAllClients } = require("../../helpers/sse");
const fs = require("fs");
const path = require("path");
const { PRODUCT_SIZES, PRODUCT_COLORS } = require("../../constants/enums");



const getProductAddpage = async (req, res) => {
    try {
        const categories = await Category.find({ isListed: true }).lean();
        const brands = await Brand.find({ isBlocked: false });
        console.log("PRODUCT_SIZES =>", PRODUCT_SIZES);
        console.log("PRODUCT_COLORS =>", PRODUCT_COLORS);

        if (!PRODUCT_SIZES || !PRODUCT_COLORS) {
            throw new Error('Product sizes or colors are not properly defined');
        }
        res.render(RENDER_PAGE_KEYS.adminProductAdd, {
            cat: categories,
            brands,
            sizes: PRODUCT_SIZES,
            colors: PRODUCT_COLORS,
        });
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
            return res.status(STATUS_CODES.BadRequest).json("Product already exists. Please use a different name.");
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
            return res.status(STATUS_CODES.BadRequest).send("No images uploaded. Please try again.");
        }

        const category = await Category.findOne({ name: productData.category });
        if (!category) {
            return res.status(STATUS_CODES.BadRequest).send("Invalid category name.");
        }
        const brand = await Brand.findOne({ brandName: productData.brand });
        if (!brand) {
            return res.status(STATUS_CODES.BadRequest).send("Invalid brand name.");
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
            sizes: productData.availableSizes || [],
            colors: productData.availableColors || [],
        });
        await newProduct.save();
        res.redirect("/admin/product-add");
    } catch (error) {
        console.error("Error saving product:", error.message);
        res.render(RENDER_PAGE_KEYS.adminPageError);
    }
};

const blockProduct = async (req, res) => {
    try {
        const id = req.query.id;
        const product = await Product.findByIdAndUpdate(id, { isblocked: true }, { new: true });

        if (!product) {
            return res.status(STATUS_CODES.NotFound).send("Product not found");
        }

        res.redirect("/admin/products");
    } catch (error) {
        console.error("Error blocking product:", error);
        res.status(STATUS_CODES.InternalServerError).render("admin/pageError", { error: error.message });
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
        const product = await Product.findById(id).populate("brands");
        const category = await Category.find({});
        const brand = await Brand.find({});
        const { RENDER_PAGE_KEYS } = require("../../constants/renderPageKeys");
        res.render(RENDER_PAGE_KEYS.adminEditProduct, {
            product: product,
            cat: category,
            brand: brand,
        })
    } catch (error) {
        res.render(RENDER_PAGE_KEYS.adminPage404)
    }
};

const editProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const productData = req.body;
        const product = await Product.findOne({ _id: id });
        if (!product) {
            return res.status(STATUS_CODES.NotFound).send("Product not found.");
        }

        const data = req.body;
        const category = await Category.findOne({ name: data.category });
        if (!category) {
            return res.status(STATUS_CODES.BadRequest).send("Invalid category name.");
        }

        const brand = await Brand.findOne({ brandName: new RegExp(`^${data.brand}$`, 'i') });
        if (!brand) {
            return res.status(STATUS_CODES.BadRequest).send("Invalid brand name.");
        }

        let images = [];
        if (req.files && req.files.length > 0) {
            images = [...product.productImage, ...req.files.map(file => file.path)];
        } else {
            images.push(...product.productImage);
        }

        let sizes = [];
        if (productData.availableSizes) {
            sizes = Array.isArray(productData.availableSizes)
                ? productData.availableSizes
                : [productData.availableSizes];
        }
        const uploadFields = {
            productName: data.productName || product.productName,
            description: data.descriptionData || product.description,
            brands: brand ? brand._id : product.brands,
            category: category ? category._id : product.category,
            regularPrice: data.regularPrice || product.regularPrice,
            salePrice: data.salePrice || product.salePrice,
            quantity: data.quantity || product.quantity,
            productImage: images.length ? images : product.productImage,
            sizes: sizes,
        };
        const updatedProduct = await Product.findByIdAndUpdate(id, uploadFields, { new: true });
        notifyAllClients('StockUpdated')
        res.redirect("/admin/products");
    } catch (error) {
        console.error("Error updating product:", error);
        res.redirect("/pageError");
    }
};

const deleteSingleImage = async (req, res) => {
    try {
        const { imageNameToserver, productIdTosever } = req.body;

        const product = await Product.findByIdAndUpdate(
            productIdTosever,
            { $pull: { productImage: imageNameToserver } },
            { new: true }
        );

        if (!product) {
            return res.status(STATUS_CODES.NotFound).send({ status: false, message: "Product not found" });
        }

        const imagePath = path.join("public", "uploads", "product-images", imageNameToserver);
        if (fs.existsSync(imagePath)) {
            await fs.promises.unlink(imagePath);
        } else {
            console.warn(`Image ${imageNameToserver} not found on disk`);
        }

        res.send({ status: true });
    } catch (error) {
        console.error("Error deleting image:", error);
        res.status(STATUS_CODES.InternalServerError).send({ status: false, message: "Server error" });
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
};