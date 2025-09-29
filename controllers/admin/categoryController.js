const { memoryStorage } = require("multer");
const Category = require("../../models/category");
const product = require("../../models/product");
const { RENDER_PAGE_KEYS } = require("../../constants/renderPageKeys");
const { STATUS_CODES } = require("../httpStatusCodes");
const { RESPONSE_SUCCESS, RESPONSE_ERROR } = require("../../constants/responseMessages");

const categoryInfo = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;

        const categoryData = await Category.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalCategories = await Category.countDocuments();
        const totalPages = Math.ceil(totalCategories / limit);

        res.render(RENDER_PAGE_KEYS.adminCategory, {
            cat: categoryData, 
            currentPage: page,
            totalPages: totalPages,
            totalCategories: totalCategories
        });

    } catch (error) {
        console.error(error);
        res.redirect("/pageError");
    }
};

const addCategory = async (req, res) => {
    const { name, description } = req.body;
    try {
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            const categories = await category.find({});
            const totalCategories = await category.countDocuments();
            const totalPages = Math.ceil(totalCategories / 4);
            return res.render(RENDER_PAGE_KEYS.adminCategory, { cat: categories, message: RESPONSE_ERROR.categoryAlreadyExists, currentPage: 1, totalPages, totalCategories });
        }
        const newCategory = new Category({
            name,
            description,
        });
        await newCategory.save();
        const categories = await Category.find({});
        const totalCategories = await Category.countDocuments();
        const totalPages = Math.ceil(totalCategories / 4); // Assuming 4 is the limit per page
        return res.render(RENDER_PAGE_KEYS.adminCategory, { cat: categories, message: RESPONSE_SUCCESS.categoryAdded, currentPage: 1, totalPages, totalCategories });
    } catch (error) {
        return res.status(STATUS_CODES.InternalServerError).send(RESPONSE_ERROR.internalServerError);
    }
};

const addCategoryOffer = async (req, res) => {
    try {
        const percentage = parseInt(req.body.percentage);
        const categoryId = req.body.categoryId;
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(STATUS_CODES.NotFound).json({ status: false, message: RESPONSE_ERROR.categoryNotFound })
        }
        const products = await product.find({ category: category._id });
        const hasProductOffer = product.some((product) => product.productOffer > percentage);
        if (hasProductOffer) {
            return res.json({ status: false, message: RESPONSE_ERROR.categoryOfferExists })
        }
        await Category.updateOne({ _id: categoryId }, { $set: { catogoryOffer: percentage } });
        for (const product of products) {
            product.productOffer = 0;
            product.saleprice = product.regularprice;
            await product.save();
        }
        res.json({ status: true });
    } catch (error) {
        res.status(STATUS_CODES.InternalServerError).json({ status: false, message: RESPONSE_ERROR.internalServerError })
    }
};

const removeCategoryOffer = async (req, res) => {
    try {
        const categoryId = req.body.categoryId;
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(STATUS_CODES.BadRequest).json({ status: false, message: RESPONSE_ERROR.categoryNotFound })
        }
        const percentage = Category.catogoryOffer;
        const products = await product.find({ category: category.id });
        if (products.length > 0) {
            for (const product of products) {
                product.saleprice += Math.floor(product.regularprice * (percentage / 100))
                product.productOffer = 0;
                await product.save();
            }
        }
        category.catogoryOffer = 0;
        await Category.save();
        res.status(STATUS_CODES.InternalServerError).json({ status: false, message: RESPONSE_ERROR.internalServerError })
    } catch (error) {

    }
};

const getListCategory = async (req, res) => {
    try {
        let id = req.query.id;
        await Category.updateOne({ _id: id }, { $set: { isListed: false } });
        res.redirect("/admin/category");
    } catch (error) {
        res.redirect("/pageError")
    }
};

const getUnlistCategory = async (req, res) => {
    try {
        let id = req.query.id;
        await Category.updateOne({ _id: id }, { $set: { isListed: true } })
        res.redirect("/admin/category");

    } catch (error) {
        res.redirect("/pageError")
    }
};

const getEdiCategory = async (req, res) => {
    try {
        const id = req.query.id;

        const category = await Category.findById({ _id: id });

        if (!category) {
            return res.redirect('/pageError');
        }
        res.render(RENDER_PAGE_KEYS.adminEditCategory, { category });
    } catch (error) {
        console.error("Error in getEditCategory:", error.message);
        res.redirect('/pageError');
    }
};

const editCategory = async (req, res) => {
    try {
        const id = req.params.id;

        const { categoryName, description } = req.body;

        let isExist = await Category.findOne({ name: categoryName, description: description });
        if (isExist) {
            return res.json({ error: RESPONSE_ERROR.categoryAlreadyExists });
        }

        const existingCategory = await Category.findById(id);
        if (!existingCategory) {
            return res.status(STATUS_CODES.NotFound).json({ error: RESPONSE_ERROR.categoryNotFound })
        }

        let updateCategory = await Category.findByIdAndUpdate(id, {
            name: categoryName,
            description: description,
        }, { new: true });

        if (updateCategory) {
            res.redirect("/admin/category")
        } else {
            res.status(STATUS_CODES.NotFound).json({ error: "Category not found" })
        }
    } catch (error) {
        console.log(error);
        res.status(STATUS_CODES.InternalServerError).json({ error: RESPONSE_ERROR.internalServerError })
    }
};

module.exports = {
    categoryInfo,
    addCategory,
    addCategoryOffer,
    removeCategoryOffer,
    getListCategory,
    getUnlistCategory,
    getEdiCategory,
    editCategory,

}