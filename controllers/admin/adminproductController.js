const { RENDER_PAGE_KEYS } = require("../../constants/renderPageKeys");
const { STATUS_CODES } = require("../../constants/httpStatusCodes");
const Product = require("../../models/product");
const Category = require("../../models/category");
const Brand = require("../../models/Brands");
const { notifyAllClients } = require("../../helpers/sse");
const fs = require("fs");
const path = require("path");



async function renderAddProductWithError(res, errorMessage) {
    const categories = await Category.find({ isListed: true }).lean();
    const brands = await Brand.find({ isBlocked: false });
    res.render(RENDER_PAGE_KEYS.adminProductAdd, {
        cat: categories,
        brands,
        errorMessage
    });
}

const getProductAddpage = async (req, res) => {
    try {
        const categories = await Category.find({ isListed: true }).lean();
        const brands = await Brand.find({ isBlocked: false });
        res.render(RENDER_PAGE_KEYS.adminProductAdd, { cat: categories, brands });
    } catch (error) {
        console.error("Error in getProductAddPage:", error.message);
        res.redirect("/admin/pageError");
    }
};

const addProducts = async (req, res) => {
    try {
        const productData = req.body;

        const category = await Category.findOne({ name: productData.category });
        const brand = await Brand.findOne({ brandName: new RegExp(`^${productData.brand}$`, 'i') });
        const productExists = await Product.findOne({ productName: productData.productName });
        if (productExists) {
            return renderAddProductWithError(res, "Product already exists. Please use a different name.");
        }

        if (!req.files || req.files.length === 0) {
            return renderAddProductWithError(res, "No images uploaded. Please try again.");
        }

        if (!category) {
            return renderAddProductWithError(res, "Invalid category name.");
        }

        if (!brand) {
            return renderAddProductWithError(res, "Invalid brand name.");
        }

        const images = req.files.map(file => file.path);
        let sizes = [];
        if (productData.availableSizes) {
            sizes = Array.isArray(productData.availableSizes)
                ? productData.availableSizes
                : [productData.availableSizes];
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
            sizes: sizes,
        });

        await newProduct.save();
        res.redirect("/admin/addProducts");
    } catch (error) {
        console.error("Error saving product:", error.message);
        res.render(RENDER_PAGE_KEYS.adminPageError);
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
            return res.status(STATUS_CODES.NotFound).render("admin/page-404");
        }

        res.render(RENDER_PAGE_KEYS.adminProducts, {
            data: productData,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            cat: categories,
            brand: brands,

        });
    } catch (error) {
        console.error("Error loading products:", error.message);
        res.status(STATUS_CODES.InternalServerError).render("admin/pageError", { error: error.message });
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