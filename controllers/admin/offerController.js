const Category = require("../../models/category.js");
const Offer = require("../../models/offers.js");
const Product = require("../../models/product.js");
const { RENDER_PAGE_KEYS } = require("../../constants/renderPageKeys");
const { STATUS_CODES } = require("../httpStatusCodes.js");

const GetOfferpage = async (req, res) => {
    console.log("enter into get offer page")
    try {
        const offers = await Offer.find({}).populate("categories");
        const categories = await Category.find({});
        const products = await Product.find({})
        res.render(RENDER_PAGE_KEYS.adminOffer, { offers, categories, products });
    } catch (error) {
        console.error("Error fetching offers:", error);
        res.status(STATUS_CODES.InternalServerError).render("admin/pageError", { error: "Failed to fetch offers." });
    }
}

const addOffer = async (req, res) => {
    console.log("enter into add offer page")
    try {
        const {
            offerName,
            offerType,
            categoryId,
            productIds,
            discountType,
            discountValue,
            startDate,
            endDate,
            isActive
        } = req.body;

        const offerData = {
            offerName,
            offerType,
            categories: offerType === 'category' ? [categoryId] : [],
            products: offerType === 'product' ? (Array.isArray(productIds) ? productIds : [productIds]) : [],
            discountType,
            discountValue,
            startDate,
            endDate,
            isActive: isActive === 'on' ? true : false
        };
        console.log("New offer data:", offerData);
        await Offer.create(offerData);
        res.redirect('/admin/offer?successMessage=Offer created successfully');
    } catch (error) {
        console.error("Error adding offer:", error);
        res.status(STATUS_CODES.InternalServerError).render("admin/pageError", { error: "Failed to add offer." });
    }
}

module.exports = {
    GetOfferpage,
    addOffer,

}