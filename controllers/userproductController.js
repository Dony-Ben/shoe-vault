const product = require("../models/product");

const productDetails = async (req, res) => {
    try {
        const id = req.query.product;
        const productData = await product.findById(id).populate('category');
        res.render("user/product-details", { productData});
    } catch (error) {
        console.log('error in productdetail: ', error);
    }
};
 
module.exports = {
    productDetails,
}