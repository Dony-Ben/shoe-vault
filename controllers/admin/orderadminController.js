const Orders = require("../../models/order");

const getOrderpage = async (req, res) => {
    try {
        const orders = await Orders.find()
            .populate('userId', 'firstname lastname email')
            .populate('orderedItem.productId', 'name price')
            .sort({ createdAt: -1 });
        res.render('admin/ordermanage', { orders });
    } catch (error) {
        console.log("An error occurred while fetching user orders:", error);
        res.status(500).send("An error occurred");
    }
};

const updateOrderStatus = async (req, res) => {
    const { orderId, orderStatus } = req.body;

    try {
        const updatedOrder = await Orders.findOneAndUpdate(
            { _id: orderId }, 
            { orderStatus: orderStatus }, 
            { new: true } 
        );

        if (updatedOrder) {
            return res.status(200).json({
                success: true,
                message: 'Order status updated successfully.',
                updatedOrder,
            });
        } else {
            return res.status(404).json({
                success: false,
                message: 'Order not found.',
            });
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while updating the order status.',
        });
    }
};

module.exports = {
    getOrderpage,
    updateOrderStatus,
}
