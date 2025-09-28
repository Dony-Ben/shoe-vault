const Product = require("../../models/product");
const Category = require("../../models/category");
const fs = require("fs");
const sharp = require("sharp");
const Brand = require("../../models/Brands");
const { notifyClient, notifyAllClients } = require("../../helpers/sse");
const { RENDER_PAGE_KEYS } = require("../../constants/renderPageKeys");
const { STATUS_CODES } = require("../../constants/httpStatusCodes");


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
        });
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
            const { STATUS_CODES } = require("../../constants/httpStatusCodes");
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
        const product = await Product.findById(id);
        const category = await Category.find({});
        const brand = await Brand.find({});
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

        const images = [];
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                images.push(req.files[i].filename);
            }
        } else {
            images.push(...product.productImage);
        }
        const uploadFields = {
            productName: data.productName,
            description: data.descriptionData,
            brands: brand._id,
            category: category.id,
            regularPrice: data.regularPrice,
            salePrice: data.salePrice,
            quantity: data.quantity,
            productImage: images
        };
        if (images.length > 0) {
            uploadFields.productImage = images;
        }

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
            console.log(`Image ${imageNameToserver} not found`);
        }
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