const Brand = require("../../models/Brands.js");
const { RENDER_PAGE_KEYS } = require("../../constants/renderPageKeys");
const { STATUS_CODES } = require("../httpStatusCodes.js");

const getBrandpage = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;

        const brandData = await Brand.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalBrands = await Brand.countDocuments({});
        const totalPages = Math.ceil(totalBrands / limit);
        res.render(RENDER_PAGE_KEYS.adminBrand, {
            data: brandData,
            currentpages: page,
            totalPages: totalPages,
            totalBrands: totalBrands,
        });

    } catch (error) {
        console.error("Error fetching brand data:", error);
        res.redirect("/pageError");
    }
};

const addBrand = async (req, res) => {
    try {
        const brand = req.body.name;
        const findBrand = await Brand.findOne({ brand });
        if (!findBrand) {
            const image = req.file.filename;
            const newBrand = new Brand({
                brandName: brand,
                brandImage: image,
            })
            await newBrand.save();
            res.redirect("/admin/brands")
        }
    } catch (error) {
        res.redirect("/pageError")
    }
}

const blockBrand = async (req, res) => {
    try {
        const id = req.params.id;
        console.log("brand", id);

        const brand = await Brand.findById(id);

        if (!brand) {
            console.log("not getting brand")
        }
        brand.isBlocked = !brand.isBlocked;
        await brand.save();
        res.redirect("/admin/brands");
    } catch (error) {
        console.error(error);
        res.status(STATUS_CODES.InternalServerError).send("Internal server error");
    }
}

const unBlockBrand = async (req, res) => {
    try {
        const id = req.query.id;
        await Brand.updateOne({ _id: id }, { $set: { isBlocked: false } });
        res.redirect("/admin/brands");
    } catch (error) {
        res.redirect("/pageError")
    }
}


module.exports = {
    getBrandpage,
    addBrand,
    blockBrand,
    unBlockBrand,
}