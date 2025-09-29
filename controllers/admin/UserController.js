const userModel = require("../../models/User");
const { STATUS_CODES } = require("../httpStatusCodes");
const { RENDER_PAGE_KEYS } = require("../../constants/renderPageKeys");

const customerInfo = async (req, res) => {
    try {
        let search = "";
        if (req.query.search) {
            search = req.query.search;
        }
        let page = 1;
        if (req.query.page) {
            page = parseInt(req.query.page, 10);
        }
        const limit = 3;
        const userData = await userModel.find({
            isadmin: false,
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: "i" } },
                { email: { $regex: ".*" + search + ".*", $options: "i" } },
            ],
        })
            .limit(limit)
            .skip((page - 1) * limit)
            .exec();

        const count = await userModel.countDocuments({
            isadmin: false,
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: "i" } },
                { email: { $regex: ".*" + search + ".*", $options: "i" } },
            ],
        });

        const data = userData.length > 0 ? userData : "no user";
        res.render(RENDER_PAGE_KEYS.adminCoustomers || "admin/coustomers", {
            data,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            search,
        });
    } catch (error) {
        console.error("Error in customerInfo:", error);
        res.status(STATUS_CODES.InternalServerError).send("An error occurred while fetching customers.");
    }
};

const customerBlocked = async (req, res) => {
    try {
        let id = req.query.id;
        await userModel.updateOne({ _id: id }, { isblocked: true });
        res.redirect("/admin/customers")
    } catch (error) {
        res.redirect("/pageError");
    }
};

const customerUnblocked = async (req, res) => {
    try {

        let id = req.query.id;
        await userModel.updateOne({ _id: id }, { isblocked: false });
        res.redirect("/admin/customers")
    } catch (error) {
        res.redirect("/pageError")
    }
};

module.exports = {
    customerInfo,
    customerBlocked,
    customerUnblocked,
} 