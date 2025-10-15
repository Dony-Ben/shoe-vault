const { RENDER_PAGE_KEYS } = require("../../constants/renderPageKeys");
const { STATUS_CODES } = require("../../constants/httpStatusCodes")
const Category = require("../../models/category");
const Offer = require("../../models/offers");
const Product = require("../../models/product");
const Brands = require("../../models/Brands")
const Order = require("../../models/order");

const pageNotFound = async (req, res) => {
    try {
        res.status(STATUS_CODES.NotFound).render(RENDER_PAGE_KEYS.userPage404)
    } catch (error) {
        res.redirect("user/pageNotFound")
    }
};


const landingpage = async (req, res) => {
    try {
        const productData = await Product.aggregate([
            {
                $lookup: {
                    from: "orders",
                    let: { productId: "$_id" },
                    pipeline: [
                        { $unwind: "$orderedItem" },
                        { $match: { $expr: { $eq: ["$orderedItem.productId", "$$productId"] } } },
                        { $group: { _id: null, totalOrdered: { $sum: "$orderedItem.quantity" } } }
                    ],
                    as: "orderData"
                }
            },
            {
                $addFields: {
                    totalOrdered: { $ifNull: [{ $arrayElemAt: ["$orderData.totalOrdered", 0] }, 0] }
                }
            },
            {
                $lookup: {
                    from: "brands",
                    localField: "brands",
                    foreignField: "_id",
                    as: "brandDetails"
                }
            },
            {
                $addFields: {
                    brandDetails: { $arrayElemAt: ["$brandDetails", 0] }
                }
            },
            {
                $addFields: {
                    brands: {
                        brandName: { $ifNull: ["$brandDetails.brandName", "No Brand"] },
                        isBlocked: { $ifNull: ["$brandDetails.isBlocked", false] }
                    }
                }
            },
            { $match: { isblocked: false, "brands.isBlocked": false } },
            { $sort: { totalOrdered: -1, createdAt: -1 } },
            { $limit: 8 },
            {
                $project: {
                    _id: 1,
                    productName: 1,
                    salePrice: 1,
                    productImage: 1,
                    brands: 1,
                    sizes: 1,
                    description: 1,
                    totalOrdered: 1
                }
            }
        ]);
        console.log(productData);

        const banner = {
            imageUrl: "/image/Banner1.jpg",
            imageUrl1: "/image/Banner.jpg",
            videoUrl: "/image/landing.mp4",
            title: "Experience the Elegance of Shoe Vault",
            subtitle: "Discover exclusive products crafted for modern lifestyles."
        };
        res.render(RENDER_PAGE_KEYS.userLanding, { products: productData, banner, user: req.session.user ||null });

    } catch (error) {
        console.error("Error loading home page:", error);
        res.status(STATUS_CODES.InternalServerError).render(RENDER_PAGE_KEYS.userPage404, { message: "Internal server error" });
    }
};

const loadhome = async (req, res) => {
    try {

        let productData = await Product.find({ isblocked: false }).populate({ path: "brands", match: { isBlocked: false } });
        res.render(RENDER_PAGE_KEYS.userHome, { products: productData, user: req.session.user });
    } catch (error) {
        console.error(error);
        res.status(STATUS_CODES.InternalError).send('Server Error');
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

const getPaginatedProducts = async (page, limit, filters = {}) => {
    let query = { isblocked: false };

    if (filters.category) {
        query.category = filters.category;
    }

    if (filters.brand && filters.brand.$in) {
        query.brands = { $in: filters.brand.$in };
    }

    if (filters.salePrice && filters.salePrice.$lte) {
        query.salePrice = { $lte: filters.salePrice.$lte };
    }

    if (filters.priceMin) {
        query.salePrice = { ...query.salePrice, $gte: filters.priceMin };
    }

    if (filters.sizes && filters.sizes.$in) {
        query.sizes = { $in: filters.sizes.$in };
    }

    if (filters.search) {
        query.$or = [
            { productName: { $regex: filters.search, $options: 'i' } },
            { description: { $regex: filters.search, $options: 'i' } }
        ];
    }

    let sortOption = { stock: -1 };
    if (filters.sort) {
        switch (filters.sort) {
            case 'price-asc':
                sortOption = { salePrice: 1 };
                break;
            case 'price-desc':
                sortOption = { salePrice: -1 };
                break;
            case 'name-asc':
                sortOption = { productName: 1 };
                break;
            case 'name-desc':
                sortOption = { productName: -1 };
                break;
        }
    }

    return Product.find(query)
        .populate({ path: "category", match: { isListed: true } })
        .populate({ path: "brands", match: { isBlocked: false } })
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
};

const getTotalPages = async (limit, filters = {}) => {
    let query = { isblocked: false };

    if (filters.category) {
        query.category = filters.category;
    }

    if (filters.brand && filters.brand.$in) {
        query.brands = { $in: filters.brand.$in };
    }

    if (filters.salePrice && filters.salePrice.$lte) {
        query.salePrice = { $lte: filters.salePrice.$lte };
    }

    if (filters.priceMin) {
        query.salePrice = { ...query.salePrice, $gte: filters.priceMin };
    }

    if (filters.sizes && filters.sizes.$in) {
        query.sizes = { $in: filters.sizes.$in };
    }

    if (filters.search) {
        query.$or = [
            { productName: { $regex: filters.search, $options: 'i' } },
            { description: { $regex: filters.search, $options: 'i' } }
        ];
    }

    const totalProducts = await Product.countDocuments(query);
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

const shop = async (req, res) => {
    try {
        const currentPage = parseInt(req.query.page) || 1;
        const productsPerPage = 12;

        const maxPriceProduct = await Product.findOne().sort({ salePrice: -1 }).select("salePrice");
        const maxPrice = maxPriceProduct ? maxPriceProduct.salePrice : 10000;
        const minPriceProduct = await Product.findOne().sort({ salePrice: 1 }).select("salePrice");
        const minPrice = minPriceProduct ? minPriceProduct.salePrice : 0;

        const filters = {};

        if (req.query.category) filters.category = req.query.category;

        if (req.query.brands) {
            filters.brand = { $in: req.query.brands.split(',') };
        }
        if (req.query.priceMax) {
            filters.salePrice = { $lte: parseFloat(req.query.priceMax) };
        }
        if (req.query.priceMin) filters.priceMin = parseFloat(req.query.priceMin);

        if (req.query.sizes) {
            filters.sizes = { $in: req.query.sizes.split(',') };
        }
        if (req.query.search) filters.search = req.query.search;

        if (req.query.sort) filters.sort = req.query.sort;

        console.log("Filters received:", req.query);
        console.log("Filters applied:", filters);
        const [products, totalPages, categories, Brand, offers,] = await Promise.all([
            getPaginatedProducts(currentPage, productsPerPage, filters),
            getTotalPages(productsPerPage, filters),
            Category.find({ isListed: true }),
            Brands.find({ isBlocked: false }),
            getActiveOffers(),
        ]);

        const updatedProducts = applyOffersToProducts(products, offers);

        res.render(RENDER_PAGE_KEYS.userShop, {
            products: updatedProducts,
            totalPages,
            currentPage,
            categories,
            Brand,
            offers,
            maxPrice,
            minPrice,
            req,
            user: req.session.user,
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
    shop,
    about
}
