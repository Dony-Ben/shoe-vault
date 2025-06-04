const Order = require('../models/order.js');

const getDateRange = (period, customStart = null, customEnd = null) => {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
        case 'daily':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            break;

        case 'weekly':
            const startOfWeek = now.getDate() - now.getDay();
            startDate = new Date(now.getFullYear(), now.getMonth(), startOfWeek);
            endDate = new Date(now.getFullYear(), now.getMonth(), startOfWeek + 7);
            break;

        case 'monthly':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            break;

        case 'yearly':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear() + 1, 0, 1);
            break;

        case 'custom':
            startDate = new Date(customStart);
            endDate = new Date(customEnd);
            endDate.setDate(endDate.getDate() + 1); // Include end date
            break;

        default:
            throw new Error('Invalid period specified');
    }

    return { startDate, endDate };
};

const getsalespage = async (req, res) => {
    try {
        // Get quick stats for dashboard
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const todayStats = await Order.aggregate([
            {
                $match: {
                    orderDate: { $gte: startOfDay },
                    orderStatus: { $in: ['Completed', 'Delivered', 'Shipped',"Pending"] }
                }
            },
            {
                $group: {
                    _id: null,
                    todayOrders: { $sum: 1 },
                    todayRevenue: { $sum: '$finalAmount' }
                }
            }
        ]);

        const stats = todayStats[0] || { todayOrders: 0, todayRevenue: 0 };

        res.render('admin/sales-reports', {
            stats: stats,
        });
    } catch (error) {
        console.error('Error loading sales reports page:', error);
        res.status(500).render('error', { message: 'Error loading sales reports' });
    }
}

const Generatesales = async (req, res) => {
    try {
        const { period } = req.params;
        const { startDate: customStart, endDate: customEnd } = req.query;

        const { startDate, endDate } = getDateRange(period, customStart, customEnd);

        const pipeline = [
            {
                $match: {
                    orderDate: { $gte: startDate, $lt: endDate },
                    orderStatus: { $in: ['Completed', 'Delivered', 'Shipped',"Pending"] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: '$finalAmount' },
                    totalShipping: { $sum: '$deliveryCharge' },
                    totalDiscount: { $sum: '$totalDiscount' },
                    avgOrderValue: { $avg: '$finalAmount' },
                    orders: { $push: '$$ROOT' }
                }
            }
        ];

        const reportData = await Order.aggregate(pipeline);

        const productSales = await Order.aggregate([
            {
                $match: {
                    orderDate: { $gte: startDate, $lt: endDate },
                    orderStatus: { $in: ['Completed', 'Delivered', 'Shipped',"Pending"] }
                }
            },
            { $unwind: '$orderedItem' },
            {
                $group: {
                    _id: '$orderedItem.productId',
                    productName: { $first: '$productInfo.name' },
                    totalQuantity: { $sum: '$orderedItem.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$orderedItem.price', '$orderedItem.quantity'] } },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { totalRevenue: -1 } }
        ]);

        let dailyBreakdown = [];
        if (period !== 'daily') {
            dailyBreakdown = await Order.aggregate([
                {
                    $match: {
                        orderDate: { $gte: startDate, $lt: endDate },
                        orderStatus: { $in: ['Completed', 'Delivered', 'Shipped',"Pending"] }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$orderDate' },
                            month: { $month: '$orderDate' },
                            day: { $dayOfMonth: '$orderDate' }
                        },
                        date: { $first: { $dateToString: { format: '%Y-%m-%d', date: '$orderDate' } } },
                        totalOrders: { $sum: 1 },
                        totalRevenue: { $sum: '$finalAmount' }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
            ]);
        }

        // Payment method breakdown
        const paymentMethodBreakdown = await Order.aggregate([
            {
                $match: {
                    orderDate: { $gte: startDate, $lt: endDate },
                    orderStatus: { $in: ['Completed', 'Delivered', 'Shipped',"Pending"] }
                }
            },
            {
                $group: {
                    _id: '$paymentMethod',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$finalAmount' }
                }
            }
        ]);

        const report = {
            period,
            dateRange: {
                start: startDate.toISOString().split('T')[0],
                end: new Date(endDate.getTime() - 1).toISOString().split('T')[0]
            },
            summary: reportData[0] || {
                totalOrders: 0,
                totalRevenue: 0,
                totalTax: 0,
                totalShipping: 0,
                totalDiscount: 0,
                avgOrderValue: 0
            },
            productSales,
            dailyBreakdown,
            paymentMethodBreakdown,
            generatedAt: new Date()
        };
        console.log('Sales report generated:', report);
        res.json({
            success: true,
            data: report
        });

    } catch (error) {
        console.error('Sales report error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating sales report',
            error: error.message
        });
    }
}

module.exports = {
    getsalespage,
    Generatesales,
}