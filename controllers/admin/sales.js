const Order = require('../../models/order.js');
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { RENDER_PAGE_KEYS } = require("../../constants/renderPageKeys");
const { STATUS_CODES } = require("../../constants/httpStatusCodes");

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
                    orderStatus: { $in: ['pending', 'processing', 'shipped', 'completed'] }
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

        res.render(RENDER_PAGE_KEYS.adminSalesReports, {
            stats: stats,
        });
    } catch (error) {
        console.error('Error loading sales reports page:', error);
        res.status(STATUS_CODES.InternalServerError).render('error', { message: 'Error loading sales reports' });
    }
}

async function getReportData(period, customStart, customEnd) {
    const { startDate, endDate } = getDateRange(period, customStart, customEnd);

    const pipeline = [
        {
            $match: {
                orderDate: { $gte: startDate, $lt: endDate },
                orderStatus: { $in: ['pending', 'processing', 'shipped', 'completed'] }
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
                orderStatus: { $in: ['pending', 'processing', 'shipped', 'completed'] }
            }
        },
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
                productName: { $first: '$productDetails.productName' },
                totalQuantity: { $sum: '$orderedItem.quantity' },
                totalRevenue: { $sum: { $multiply: ['$orderedItem.quantity', '$productDetails.salePrice'] } },
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
                    date: { $first: { $dateToString: { format: '%Y-%m-%d', date: '$orderDate' } } },
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: '$finalAmount' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);
    }

    const paymentMethodBreakdown = await Order.aggregate([
        {
            $match: {
                orderDate: { $gte: startDate, $lt: endDate },
                orderStatus: { $in: ['Completed', 'Delivered', 'Shipped', "Pending"] }
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

    return {
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
}

const Generatesales = async (req, res) => {
    try {
        const { period } = req.params;
        const { startDate: customStart, endDate: customEnd } = req.query;
        const report = await getReportData(period, customStart, customEnd);
        res.json({ success: true, data: report });
    } catch (error) {
        console.error('Sales report error:', error);
        const { STATUS_CODES } = require("../../constants/httpStatusCodes");
        res.status(STATUS_CODES.InternalServerError).json({
            success: false,
            message: 'Error generating sales report',
            error: error.message
        });
    }
}

const exportReport = async (req, res) => {
    const { type } = req.params;
    const { format, startDate, endDate } = req.query;
    const reportData = await getReportData(type, startDate, endDate);

    if (format === 'csv') {
        const fields = [
            { label: 'Date', value: 'date' },
            { label: 'Total Orders', value: 'totalOrders' },
            { label: 'Total Revenue', value: 'totalRevenue' },
        ];
        const parser = new Parser({ fields });
        const csv = parser.parse(reportData.dailyBreakdown);

        res.header('Content-Type', 'text/csv');
        res.attachment('sales-report.csv');
        return res.send(csv);
    }

    if (format === 'excel') {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

        worksheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Total Orders', key: 'totalOrders', width: 15 },
            { header: 'Total Revenue', key: 'totalRevenue', width: 20 },
            // ... add more columns as needed
        ];

        reportData.dailyBreakdown.forEach(row => worksheet.addRow(row));

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=sales-report.xlsx');
        await workbook.xlsx.write(res);
        res.end();
        return;

    };

    if (format === 'pdf') {
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');
        doc.pipe(res);

        doc.fontSize(18).text('Sales Report', { align: 'center' });
        doc.moveDown();

        // Table headers
        doc.fontSize(12).text('Date', 50, doc.y, { continued: true });
        doc.text('Total Orders', 150, doc.y, { continued: true });
        doc.text('Total Revenue', 250, doc.y);
        doc.moveDown();

        // Table rows
        reportData.dailyBreakdown.forEach(row => {
            doc.text(row.date, 50, doc.y, { continued: true });
            doc.text(row.totalOrders, 150, doc.y, { continued: true });
            doc.text(row.totalRevenue, 250, doc.y);
            doc.moveDown();
        });

        doc.end();
        return;
    }
}

module.exports = {
    getsalespage,
    Generatesales,
    exportReport,
}