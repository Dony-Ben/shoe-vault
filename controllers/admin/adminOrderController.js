const Orders = require("../../models/order");
const Wallet = require("../../models/wallet");
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

const approveReturn = async (req, res) => {
    try {
        const { orderId, productId } = req.params;
        const order = await Orders.findById(orderId).populate('orderedItem.productId');
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        const item = order.orderedItem.find(i => i.productId._id.toString() === productId);
        if (!item || !item.returned) return res.status(400).json({ success: false, message: 'Item not marked for return' });
        // Already marked as returned, so just confirm
        // (Refund already processed on user request)
        return res.json({ success: true, message: 'Return approved' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const rejectReturn = async (req, res) => {
    try {
        const { orderId, productId } = req.params;
        const order = await Orders.findById(orderId).populate('orderedItem.productId');
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        const item = order.orderedItem.find(i => i.productId._id.toString() === productId);
        if (!item || !item.returned) return res.status(400).json({ success: false, message: 'Item not marked for return' });
        // Reverse the return
        item.returned = false;
        // If refund was processed, deduct from wallet
        if (order.paymentMethod !== 'cod') {
            const refundAmount = item.productId.salePrice * item.quantity;
            let wallet = await Wallet.findOne({ userId: order.userId });
            if (wallet && wallet.balance >= refundAmount) {
                wallet.balance -= refundAmount;
                wallet.transactions.push({
                    type: 'debit',
                    amount: refundAmount,
                    description: `Return rejected for item in order #${orderId}`,
                    date: new Date(),
                });
                await wallet.save();
            }
        }
        await order.save();
        return res.json({ success: true, message: 'Return rejected and refund reversed' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getOrderpage,
    updateOrderStatus,
    approveReturn,
    rejectReturn,
};

