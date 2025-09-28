const product = require("../../models/product");
const Wishlist = require("../../models/wishlist");


const productDetails = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.redirect("/shop");
            return;
        }

        const productData = await product.findById(id).populate('category');
        if (!productData) {
            return res.redirect("/shop");
        }
        let isWishlisted = false;
        if (req.session.user?.id) {
            const wishlist = await Wishlist.findOne({ userId: req.session.user.id });
            if (wishlist) {
                isWishlisted = wishlist.product.some(p => p.productId.toString() === id);
            }
        }
        res.render("user/product-details", { productData, isWishlisted });
    } catch (error) {
        console.log('error in productdetail: ', error);
    }
};

module.exports = {
    productDetails,
}