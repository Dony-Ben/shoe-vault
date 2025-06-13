const Category = require("../models/category");
const Offer = require("../models/offers");
const Product = require("../models/product");
const Wishlist = require("../models/wishlist");
const pageNotFound = async (req, res) => {
    try {
        res.status(404).render("user/page-404")
    } catch (error) {
        res.redirect("user/pageNotFound")
    }
};

const loadhome = async (req, res) => {
    try {
        let productData = await Product.find({ isblocked: false })
        res.render('user/home', { products: productData });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

const loadhomepage = async (req, res) => {
    try {
        if (req.session.user && req.session.user.id && req.session.user.email) {
            return res.redirect("/home");
        }
        let productData = await Product.find({ isblocked: false });
        res.render("user/landing", { products: productData });

    } catch (error) {
        console.error("Error loading home page:", error);
        res.status(500).render("user/page-404", { message: "Internal server error" });
    }
};


const loadlogin = async (req, res) => {
    try {
        res.render('user/login', { message: null });
    } catch (error) {
        console.error("Error loading login page:", error);
        res.status(500).render('error', { message: "Internal Server Error" });
    }
};


const loadregister = async (req, res) => {
    try {
        res.render('user/signup', { errorMessage: null });
    } catch (error) {
        console.log(error);

    }
}

const loadOTP = async (req, res) => {
    try {
        res.render('user/otp')
    } catch (error) {
        console.log('error while loading otp page... ', error)
    }
};

const shop = async (req, res) => {
    try {
        const userId = req.session.user?.id;
        const currentPage = parseInt(req.query.page) || 1;
        const productsPerPage = 12;
        const productData = await Product.find({ isblocked: false }).populate("category")
            .skip((currentPage - 1) * productsPerPage)
            .limit(productsPerPage)
            .populate('brands');
        const totalProducts = await Product.countDocuments({ isblocked: false });
        const totalPages = Math.ceil(totalProducts / productsPerPage);

        const categories = await Category.find({isListed:true});
        const offers = await Offer.find({ isActive: true }).populate("categories").populate("products");
        productData.forEach((product) => {
            const productCategoryIds = Array.isArray(product.categories)
                ? product.categories.map(c => c.toString())
                : [product.categories?.toString()];

            const matchingOffer = offers.find(offer => {
                if (offer.offerType === 'product') {
                    return offer.products.some(p => p._id.toString() === product._id.toString());
                } else if (offer.offerType === 'category') {
                    return offer.categories.some(c => productCategoryIds.includes(c._id.toString()));
                }
                return false;
            });

            if (matchingOffer) {
                const discountSymbol = matchingOffer.discountType === 'percentage' ? '%' : '₹';
                product.offer = `${matchingOffer.discountValue}${discountSymbol} OFF`;
            }
        });

           let wishlistProductIds = [];
        if (userId) {
            const wishlist = await Wishlist.findOne({ userId });
            if (wishlist) {
                wishlistProductIds = wishlist.product.map(item => item.productId.toString());
            }
        }
        res.render("user/shop", { products: productData, totalPages, currentPage, categories, offers, wishlistProductIds });
    } catch (error) {
        console.error("Error while rendering shop page:", error);
        res.status(500).send("An error occurred while loading the page.");
    }
};

const about = async (req, res) => {
    try {
        res.render("user/about")
    } catch (error) {
        console.error(error);

    }
};

module.exports = {
    loadhomepage,
    loadhome,
    pageNotFound,
    loadlogin,
    loadregister,
    loadOTP,
    shop,
    about
}