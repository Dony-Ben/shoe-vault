const product = require("../../models/product");
const Wishlist = require("../../models/wishlist");


const productDetails = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.redirect("/shop");
            return;
        }

        const productData = await product.findById(id).populate('category').populate('brands');
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
        // Fetch related products: same category, exclude current, limit 4
        const relatedProducts = await product.find({
            category: productData.category,
            _id: { $ne: id },
            isblocked: false
        }).populate('brands').limit(4);
        res.render("user/product-details", { productData, isWishlisted, relatedProducts, user: req.session.user });
    } catch (error) {
        console.log('error in productdetail: ', error);
    }
};

module.exports = {
    productDetails,
}