const { memoryStorage } = require("multer");
const Category = require("../../models/category");
const product = require("../../models/product");

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

        res.render("admin/category", {
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
            return res.render("admin/category", { cat: categories, message: "Category already exists", currentPage: 1, totalPages, totalCategories });
        }
        const newCategory = new Category({
            name,
            description,
        });
        await newCategory.save();
        const categories = await Category.find({});
        const totalCategories = await Category.countDocuments();
        const totalPages = Math.ceil(totalCategories / 4); // Assuming 4 is the limit per page
        return res.render("admin/category", { cat: categories, message: "Category added successfully", currentPage: 1, totalPages, totalCategories });
    } catch (error) {
        return res.status(500).send(`Internal Server Error: ${error.message}`);
    }
};

const addCategoryOffer = async (req, res) => {
    try {
        const percentage = parseInt(req.body.percentage);
        const categoryId = req.body.categoryId;
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ status: false, message: "Category not found " })
        }
        const products = await product.find({ category: category._id });
        const hasProductOffer = product.some((product) => product.productOffer > percentage);
        if (hasProductOffer) {
            return res.json({ status: false, message: "products with this category already have product offers" })
        }
        await Category.updateOne({ _id: categoryId }, { $set: { catogoryOffer: percentage } });
        for (const product of products) {
            product.productOffer = 0;
            product.saleprice = product.regularprice;
            await product.save();
        }
        res.json({ status: true });
    } catch (error) {
        res.status(500).json({ status: false, message: "internal sever Error" })
    }
};

const removeCategoryOffer = async (req, res) => {
    try {
        const categoryId = req.body.categoryId;
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(400).json({ status: false, message: "Category not found" })
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
        res.status(500).json({ status: false, message: "internal server Error" })
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
        res.render('admin/edit-category', { category });
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
            return res.json({ error: "Category with this name and description already exists" });
        }

        const existingCategory = await Category.findById(id);
        if (!existingCategory) {
            return res.status(404).json({ error: "Category not found" })
        }

        let updateCategory = await Category.findByIdAndUpdate(id, {
            name: categoryName,
            description: description,
        }, { new: true });

        if (updateCategory) {
            res.redirect("/admin/category")
        } else {
            res.status(404).json({ error: "Category not found" })
        }
    } catch (error) {
        console.log(error);

        res.status(500).json({ error: "Internal server error" })
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