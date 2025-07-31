const Wishlist = require("../../models/wishlist")


const wishlist = async (req, res) => {
    try {
        const userId = req.session.user?.id;
        const wishlist = await Wishlist.findOne({ userId }).populate('product.productId');

        const wishlistItems = wishlist ? wishlist.product.map(item => item.productId) : [];
        res.render("user/wishlist", { wishlistItems });
    } catch (err) {
        console.log(err);
        res.render("user/page-404");
    }
};

const wishlistadd = async (req, res) => {
    try {
        const userId = req.session.user?.id;
        const { productId } = req.body;

        let wishlist = await Wishlist.findOne({ userId });

        if (!wishlist) {
            wishlist = new Wishlist({ userId, product: [] });
        }

        const productIndex = wishlist.product.findIndex(item => item.productId.equals(productId));

        if (productIndex > -1) {
            wishlist.product.splice(productIndex, 1);
            await wishlist.save();
            return res.json({ message: null, success: true, added: false });
        } else {
            wishlist.product.push({ productId, addedOn: new Date() });
            await wishlist.save();
            return res.json({ success: true, added: true, message: 'Product added to cart successfully.' });
        }
    } catch (error) {
       console.error("Wishlist update error:", error);
        res.json({ message: "An error occurred while updating the wishlist.", success: false });
    }
};

const ProductRemove = async (req, res) => {
    try {

        const userId = req.session.user?.id;
        const { productId } = req.params;
        let wishlist = await Wishlist.findOne({ userId });
        const existingItem = wishlist.product.find(item => item.productId.equals(productId));
        if (existingItem) {
            wishlist.product.pull({ productId });
            await wishlist.save();
            return res.json({ message: "Item removed from wishlist", success: true });
        } else {
            return res.json({ message: "Item not found in wishlist", success: false });
        }
    }
    catch (err) {
        console.log(err);
        res.json({ message: "An error occurred while removing the item from wishlist.", success: false });
    }
}

module.exports = {
    wishlist,
    wishlistadd,
    ProductRemove,
}