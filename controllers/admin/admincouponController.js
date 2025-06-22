const Coupon = require("../../models/coupon.js");

const  loadcouponpage = async (req, res) => {
    try {
        const coupons = await Coupon.find({});
        res.render('admin/coupons', { coupons });
    } catch (error) {
        console.error('Error loading coupons:', error);
        res.status(500).send('Failed to load coupons');
    }
}

const createCoupon = async (req, res) => {
    try {
        const { code, type, discount, expiryDate } = req.body;
        const newCoupon = new Coupon({
            code,
            type,
            discount: parseFloat(discount),
            expiryDate: new Date(expiryDate),
        });

        await newCoupon.save();
        res.redirect('/admin/coupons');
    } catch (error) {
        console.error('Error adding coupon:', error);
        res.status(500).send('Failed to add coupon');
    }
}

const deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        console.log("Deleting coupon with ID:", id);
        await Coupon.findByIdAndDelete(id);
        res.redirect('/admin/coupons');
    } catch (error) {
        console.error('Error deleting coupon:', error);
        res.status(500).send('Failed to delete coupon');
    }
};

const editCoupon = async (req,res) =>{
    try {
    const { id } = req.params;
    const { code, type, discount, expiryDate } = req.body;

    await Coupon.findByIdAndUpdate(id, { code, type, discount, expiryDate });
    res.redirect('/admin/coupons');
  } catch (error) {
    console.error('Error updating coupon:', error);
    res.status(500).send('Server Error');
  }
}
module.exports = {
    loadcouponpage,
    createCoupon,
    deleteCoupon,
    editCoupon,
};