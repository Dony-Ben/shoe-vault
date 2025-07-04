const Category = require("../../models/category");
const Offer = require("../../models/offers");
const Product = require("../../models/product");
const Wishlist = require("../../models/wishlist");
const User = require("../../models/User");

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

const landingpage = async (req, res) => {
    try {
        let productData = await Product.find({ isblocked: false });
        res.render("user/landing", { products: productData, });

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
const getPaginatedProducts = async (page, limit) => {
    return Product.find({ isblocked: false })
        .populate({ path: "category", match: { isListed: true } }).populate({ path: "brands", match: { isBlocked: false } })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
};

const getTotalPages = async (limit) => {
    const totalProducts = await Product.countDocuments({ isblocked: false });
    return Math.ceil(totalProducts / limit);
};

const getActiveOffers = async () => {
    return Offer.find({ isActive: true })
        .populate("categories")
        .populate("products")
        .lean();
};

const applyOffersToProducts = (products, offers) => {
    return products.map(product => {
        const productCategoryIds = Array.isArray(product.categories)
            ? product.categories.map(c => c._id?.toString())
            : [product.category?._id?.toString()];

        const offer = offers.find(offer => {
            if (offer.offerType === 'product') {
                return offer.products.some(p => p._id.toString() === product._id.toString());
            }
            if (offer.offerType === 'category') {
                return offer.categories.some(c => productCategoryIds.includes(c._id.toString()));
            }
            return false;
        });

        if (offer) {
            const symbol = offer.discountType === 'percentage' ? '%' : '₹';
            product.offer = `${offer.discountValue}${symbol} OFF`;
        }

        return product;
    });
};

const getWishlistProductIds = async (userId) => {
    const wishlist = await Wishlist.findOne({ userId });
    return wishlist ? wishlist.product.map(p => p.productId.toString()) : [];
};

const shop = async (req, res) => {
    try {
        const userId = req.session.user?.id;
        const currentPage = parseInt(req.query.page) || 1;
        const productsPerPage = 12;

        const [products, totalPages, categories, offers, wishlistProductIds] = await Promise.all([
            getPaginatedProducts(currentPage, productsPerPage),
            getTotalPages(productsPerPage),
            Category.find({ isListed: true }),
            getActiveOffers(),
            userId ? getWishlistProductIds(userId) : [],
        ]);

        const updatedProducts = applyOffersToProducts(products, offers);

        res.render("user/shop", {
            products: updatedProducts,
            totalPages,
            currentPage,
            categories,
            offers,
            wishlistProductIds,
        });
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
    landingpage,
    loadhome,
    pageNotFound,
    loadlogin,
    loadregister,
    loadOTP,
    shop,
    about
}