const { RENDER_PAGE_KEYS } = require("../../constants/renderPageKeys");
const { STATUS_CODES } = require("../../constants/httpStatusCodes");
const { RESPONSE_SUCCESS, RESPONSE_ERROR } = require("../../constants/responseMessages");
const Orders = require("../../models/order");
const Wallet = require("../../models/wallet");
const getOrderpage = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 3;
        const skip = (page - 1) * limit;

        const { orderStatus, paymentStatus, dateFrom, dateTo, paymentMethod, sortBy } = req.query;
        const query = {};

        if (orderStatus) {
            if (orderStatus === 'returned') {
                query['orderedItem.returned'] = true;
            } else {
                query.orderStatus = orderStatus;
            }
        }
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

        let sort = { createdAt: -1 };
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

        res.render(RENDER_PAGE_KEYS.adminOrderManage, {
            orders,
            currentPage: page,
            totalPages,
            orderStatus,
            paymentStatus,
            dateFrom,
            dateTo,
            paymentMethod,
            sortBy,
        });
    } catch (error) {
        console.log("An error occurred while fetching user orders:", error);
        res.status(STATUS_CODES.InternalServerError).send("An error occurred");
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
            return res.status(STATUS_CODES.OK).json({
                success: true,
                message: RESPONSE_SUCCESS.orderStatusUpdated,
                updatedOrder,
            });
        } else {
            return res.status(STATUS_CODES.NotFound).json({
                success: false,
                message: RESPONSE_ERROR.orderNotFound,
            });
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        return res.status(STATUS_CODES.InternalServerError).json({
            success: false,
            message: RESPONSE_ERROR.operationFailed,
        });
    }
};

const approveReturn = async (req, res) => {
    try {
        const { orderId, productId } = req.params;
        const order = await Orders.findById(orderId).populate('orderedItem.productId');
        if (!order) return res.status(STATUS_CODES.NotFound).json({ success: false, message: RESPONSE_ERROR.orderNotFound });
        const item = order.orderedItem.find(i => i.productId._id.toString() === productId);
        if (!item || !item.returned) return res.status(STATUS_CODES.BadRequest).json({ success: false, message: RESPONSE_ERROR.itemNotMarkedForReturn });
       
        return res.json({ success: true, message: RESPONSE_SUCCESS.returnApproved });
    } catch (err) {
        res.status(STATUS_CODES.InternalServerError).json({ success: false, message: RESPONSE_ERROR.serverError });
    }
};

const rejectReturn = async (req, res) => {
    try {
        const { orderId, productId } = req.params;
        const order = await Orders.findById(orderId).populate('orderedItem.productId');
        if (!order) return res.status(STATUS_CODES.NotFound).json({ success: false, message: RESPONSE_ERROR.orderNotFound });
        const item = order.orderedItem.find(i => i.productId._id.toString() === productId);
        if (!item || !item.returned) return res.status(STATUS_CODES.BadRequest).json({ success: false, message: RESPONSE_ERROR.itemNotMarkedForReturn });
        item.returned = false;
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
        return res.json({ success: true, message: RESPONSE_SUCCESS.returnRejected });
    } catch (err) {
        res.status(STATUS_CODES.InternalServerError).json({ success: false, message: RESPONSE_ERROR.serverError });
    }
};

module.exports = {
    getOrderpage,
    updateOrderStatus,
    approveReturn,
    rejectReturn,
};

