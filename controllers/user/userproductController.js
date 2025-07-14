const product = require("../../models/product");
const Wishlist = require("../../models/wishlist");

const productDetails = async (req, res) => {
    try {
        const id = req.query.product;
        const productData = await product.findById(id).populate('category');
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