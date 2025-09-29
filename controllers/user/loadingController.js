const { RENDER_PAGE_KEYS } = require("../../constants/renderPageKeys");
const { STATUS_CODES } = require("../../constants/httpStatusCodes")
const Category = require("../../models/category");
const Offer = require("../../models/offers");
const Product = require("../../models/product");
const Wishlist = require("../../models/wishlist");

const pageNotFound = async (req, res) => {
    try {
        res.status(STATUS_CODES.NotFound).render(RENDER_PAGE_KEYS.userPage404)
    } catch (error) {
        res.redirect("user/pageNotFound")
    }
};

const loadhome = async (req, res) => {
    try {

        let productData = await Product.find({ isblocked: false }).populate({ path: "brands", match: { isBlocked: false } });
        res.render(RENDER_PAGE_KEYS.userHome, { products: productData });
    } catch (error) {
        console.error(error);
        res.status(STATUS_CODES.InternalError).send('Server Error');
    }
};

const landingpage = async (req, res) => {
    try {
        let productData = await Product.find({ isblocked: false }).populate({ path: "brands", match: { isBlocked: false } });
        res.render(RENDER_PAGE_KEYS.userLanding, { products: productData });

    } catch (error) {
        console.error("Error loading home page:", error);
        res.status(STATUS_CODES.InternalServerError).render(RENDER_PAGE_KEYS.userPage404, { message: "Internal server error" });
    }
};


const loadlogin = async (req, res) => {
    try {
        res.render(RENDER_PAGE_KEYS.userLogin, { message: res.locals.error || null, successMessage: res.locals.success || null });
    } catch (error) {
        console.error("Error loading login page:", error);
        res.status(STATUS_CODES.InternalServerError).render(RENDER_PAGE_KEYS.userError, { message: "Internal Server Error" });
    }
};


const loadregister = async (req, res) => {
    try {
        res.render(RENDER_PAGE_KEYS.userSignup, { message: null });
    } catch (error) {
        console.log(error);
    }
}

const loadOTP = async (req, res) => {
    try {
        res.render(RENDER_PAGE_KEYS.userOtp);
    } catch (error) {
        console.log('error while loading otp page... ', error)
    }
};

const getPaginatedProducts = async (page, limit) => {
    return Product.find({ isblocked: false })
        .populate({ path: "category", match: { isListed: true } })
        .populate({ path: "brands", match: { isBlocked: false } })
        .sort({ stock: -1 })
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
        const currentPage = parseInt(req.query.page) || 1;
        const productsPerPage = 12;

        const [products, totalPages, categories, offers] = await Promise.all([
            getPaginatedProducts(currentPage, productsPerPage),
            getTotalPages(productsPerPage),
            Category.find({ isListed: true }),
            getActiveOffers(),
        ]);

        const updatedProducts = applyOffersToProducts(products, offers);
        res.render(RENDER_PAGE_KEYS.userShop, {
            products: updatedProducts,
            totalPages,
            currentPage,
            categories,
            offers,
        });
    } catch (error) {
        console.error("Error while rendering shop page:", error);
        res.status(STATUS_CODES.InternalError).send("An error occurred while loading the page.");
    }
};

const about = async (req, res) => {
    try {
        res.render(RENDER_PAGE_KEYS.userAbout)
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
    getWishlistProductIds,
    shop,
    about
}