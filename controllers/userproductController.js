const product = require("../models/product");
const Category = require("../models/category");
const user = require("../models/User");


const productDetails = async (req, res) => {
    try {
        const userId = req.session.user?.id;
        const id = req.query.product;
        const productData = await product.findById(id).populate('category');
        console.log(productData)
        
        res.render("user/product-details", { productData });
    } catch (error) {
        console.log('error in productdetail: ', error);
    }
}

module.exports = {
    productDetails,
}