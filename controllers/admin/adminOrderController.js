const Orders = require("../../models/order");
const getOrderpage = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 3;
        const skip = (page - 1) * limit;

        // Filters
        const { orderStatus, paymentStatus, dateFrom, dateTo, paymentMethod, sortBy } = req.query;
        const query = {};

        if (orderStatus) query.orderStatus = orderStatus;
        if (paymentStatus) query.paymentStatus = paymentStatus;
        if (paymentMethod) query.paymentMethod = paymentMethod;
        if (dateFrom || dateTo) {
            query.orderDate = {};
            if (dateFrom) query.orderDate.$gte = new Date(dateFrom);
            if (dateTo) {
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                query.orderDate.$lte = toDate;
            }
        }

        // Sorting
        let sort = { createdAt: -1 }; // Default: newest
        if (sortBy === 'highest') {
            sort = { finalAmount: -1 };
        }

        const totalOrders = await Orders.countDocuments(query);
        const totalPages = Math.ceil(totalOrders / limit);

        const orders = await Orders.find(query)
            .populate('userId', 'firstname lastname email')
            .populate('orderedItem.productId', 'name price')
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean();

        res.render('admin/ordermanage', {
            orders,
            currentPage: page,
            totalPages,
            orderStatus,
            paymentStatus,
            dateFrom,
            dateTo,
            paymentMethod,
            sortBy
        });
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

