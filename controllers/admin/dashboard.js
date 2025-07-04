const { compare } = require('bcrypt');
const Order = require('../../models/order.js');
const Product = require('../../models/product.js');
const User = require('../../models/User.js');

const getSalesChartData = async (req, res) => {
    try {
        const filter = req.query.filter || 'monthly';
        const now = new Date();
        let startDate;

        if (filter === 'yearly') {
            startDate = new Date(now.getFullYear(), 0, 1);
        } else if (filter === 'monthly') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (filter === 'weekly') {
            const day = now.getDay();
            startDate = new Date(now);
            startDate.setDate(now.getDate() - day);
        } else {
            // daily
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        }

        // Get overall statistics
        const totalRevenue = await Order.aggregate([
            {
                $match: {
                    orderStatus: { $in: ['pending', 'processing', 'shipped', 'completed'] }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$finalAmount' }
                }
            }
        ]);

        const totalOrders = await Order.countDocuments({
            orderStatus: { $in: ['pending', 'processing', 'shipped', 'completed'] }
        });
        console.log('Total Orders:', totalOrders);

        const totalProducts = await Product.countDocuments();
        const totalCustomers = await User.countDocuments({ isadmin: false });

        // Get sales chart data
        const salesChartData = await Order.aggregate([
            {
                $match: {
                    orderDate: { $gte: startDate },
                    orderStatus: { $in: ['pending', 'processing', 'shipped', 'completed'] }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$orderDate' },
                        month: { $month: '$orderDate' },
                        day: { $dayOfMonth: '$orderDate' }
                    },
                    totalSales: { $sum: '$finalAmount' },
                    orderCount: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
            }
        ]);

        // Get top selling products
        const topProducts = await Order.aggregate([
            { $unwind: '$orderedItem' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'orderedItem.productId',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' },
            {
                $group: {
                    _id: '$orderedItem.productId',
                    totalSold: { $sum: '$orderedItem.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$productDetails.salePrice', '$orderedItem.quantity'] } },
                    product: { $first: '$productDetails' }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 }
        ]);

        // Get top categories
        const topCategories = await Product.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            { $unwind: '$category' },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // Get top brands
        const topBrands = await Product.aggregate([
            {
                $group: {
                    _id: '$brands',
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'brands',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'brand'
                }
            },
            { $unwind: '$brand' },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // Get recent orders
        const recentOrders = await Order.find({
            orderStatus: { $in: ['pending', 'processing', 'shipped', 'completed'] }
        })
        .sort({ orderDate: -1 })
        .limit(5)
        .populate('userId', 'name email');

        // Prepare chart data for different periods
        const chartData = {
            labels: [],
            sales: [],
            orders: []
        };

        if (filter === 'yearly') {
            // Group by months
            const monthlyData = {};
            salesChartData.forEach(item => {
                const month = item._id.month;
                if (!monthlyData[month]) {
                    monthlyData[month] = { sales: 0, orders: 0 };
                }
                monthlyData[month].sales += item.totalSales;
                monthlyData[month].orders += item.orderCount;
            });

            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            for (let i = 1; i <= 12; i++) {
                chartData.labels.push(monthNames[i - 1]);
                chartData.sales.push(monthlyData[i] ? monthlyData[i].sales : 0);
                chartData.orders.push(monthlyData[i] ? monthlyData[i].orders : 0);
            }
        } else if (filter === 'monthly') {
            // Group by days
            const dailyData = {};
            salesChartData.forEach(item => {
                const day = item._id.day;
                if (!dailyData[day]) {
                    dailyData[day] = { sales: 0, orders: 0 };
                }
                dailyData[day].sales += item.totalSales;
                dailyData[day].orders += item.orderCount;
            });

            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            for (let i = 1; i <= daysInMonth; i++) {
                chartData.labels.push(i.toString());
                chartData.sales.push(dailyData[i] ? dailyData[i].sales : 0);
                chartData.orders.push(dailyData[i] ? dailyData[i].orders : 0);
            }
        } else if (filter === 'weekly') {
            // Group by days of week
            const weeklyData = {};
            salesChartData.forEach(item => {
                const day = item._id.day;
                if (!weeklyData[day]) {
                    weeklyData[day] = { sales: 0, orders: 0 };
                }
                weeklyData[day].sales += item.totalSales;
                weeklyData[day].orders += item.orderCount;
            });

            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            for (let i = 0; i < 7; i++) {
                chartData.labels.push(dayNames[i]);
                chartData.sales.push(weeklyData[i + 1] ? weeklyData[i + 1].sales : 0);
                chartData.orders.push(weeklyData[i + 1] ? weeklyData[i + 1].orders : 0);
            }
        } else {
            // Daily - show last 7 days
            const dailyData = {};
            salesChartData.forEach(item => {
                const day = item._id.day;
                if (!dailyData[day]) {
                    dailyData[day] = { sales: 0, orders: 0 };
                }
                dailyData[day].sales += item.totalSales;
                dailyData[day].orders += item.orderCount;
            });

            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                chartData.labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                chartData.sales.push(dailyData[date.getDate()] ? dailyData[date.getDate()].sales : 0);
                chartData.orders.push(dailyData[date.getDate()] ? dailyData[date.getDate()].orders : 0);
            }
        }
        const loginSuccess = req.session.loginSuccess;
        req.session.loginSuccess = undefined;
        res.render('admin/dashboard', {
            totalRevenue: totalRevenue[0]?.total || 0,
            totalOrders,
            totalProducts,
            totalCustomers,
            topProducts,
            topCategories,
            topBrands,
            recentOrders,
            chartData,
            filter,
            loginSuccess,
        });

    } catch (err) {
        console.error('Dashboard Error:', err);
        res.status(500).send('Dashboard Error');
    }
};

module.exports = {
    getSalesChartData,
}