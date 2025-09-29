const Order = require("../../models/order.js");
const PDFDocument = require('pdfkit');
const { STATUS_CODES } = require("../../constants/httpStatusCodes");

const downloadInvoice = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const userId = req.session.user?.id;
        const order = await Order.findById(orderId).populate('orderedItem.productId')
        console.log("Order details:", order);
        if (!order || order.userId.toString() !== userId) {
            return res.status(STATUS_CODES.Forbidden).send('Unauthorized or Order not found');
        }
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=invoice-${order._id}.pdf`
        );

        doc.pipe(res);

        // Invoice Header
        doc.fontSize(20).text('INVOICE', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Order ID: ${order._id}`);
        doc.text(`Date: ${new Date(order.orderDate).toLocaleDateString()}`);
        doc.text(`Status: ${order.orderStatus}`);
        doc.text(`Payment Method: ${order.paymentMethod}`);
        doc.text(`User: ${req.session.user.firstName || "Customer"}`);
        doc.moveDown();

        doc.fontSize(14).text('Items:', { underline: true });
        doc.moveDown(0.5);

        // Table Content
        if (order.orderedItem && order.orderedItem.length > 0) {
            order.orderedItem.forEach((item, index) => {
                const product = item.productId;
                const name = product.productName || 'Unnamed Product';
                const price = product.price || 0;
                const quantity = item.quantity;

                doc
                    .fontSize(12)
                    .text(`${index + 1}. ${name} - ₹${price} x ${quantity}`);
            });
        } else {
            doc.fontSize(12).text('No items found in this order.');
        }

        doc.moveDown();
        doc.fontSize(14).text(`Total: ₹${order.finalAmount}`, { align: 'right' });

        doc.end();

    } catch (error) {
        console.error("Error downloading invoice:", error);
        res.status(STATUS_CODES.InternalServerError).send("Internal Server Error");

    }
}
module.exports = {
    downloadInvoice,
}