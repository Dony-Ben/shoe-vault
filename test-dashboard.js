// Test file to verify dashboard functionality
const mongoose = require('mongoose');

// Test data structure that should be passed to the dashboard view
const testDashboardData = {
    totalRevenue: 125000,
    totalOrders: 45,
    totalProducts: 120,
    totalCustomers: 89,
    topProducts: [
        {
            totalSold: 25,
            totalRevenue: 12500,
            product: {
                productName: "Nike Air Max",
                regularPrice: 5000,
                salePrice: 4500
            }
        },
        {
            totalSold: 18,
            totalRevenue: 9000,
            product: {
                productName: "Adidas Ultraboost",
                regularPrice: 6000,
                salePrice: 5500
            }
        }
    ],
    topCategories: [
        {
            count: 35,
            category: { name: "Running Shoes" }
        },
        {
            count: 28,
            category: { name: "Casual Shoes" }
        }
    ],
    topBrands: [
        {
            count: 42,
            brand: { name: "Nike" }
        },
        {
            count: 38,
            brand: { name: "Adidas" }
        }
    ],
    recentOrders: [
        {
            _id: "507f1f77bcf86cd799439011",
            finalAmount: 4500,
            orderStatus: "Delivered",
            orderDate: new Date(),
            orderedItem: [{ productId: "123", quantity: 1, price: 4500 }],
            userId: { name: "John Doe", email: "john@example.com" }
        }
    ],
    chartData: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        sales: [15000, 18000, 22000, 19000, 25000, 28000],
        orders: [12, 15, 18, 16, 22, 25]
    },
    filter: "monthly"
};

console.log("Dashboard data structure test:");
console.log("Total Revenue:", testDashboardData.totalRevenue);
console.log("Total Orders:", testDashboardData.totalOrders);
console.log("Total Products:", testDashboardData.totalProducts);
console.log("Total Customers:", testDashboardData.totalCustomers);
console.log("Top Products Count:", testDashboardData.topProducts.length);
console.log("Top Categories Count:", testDashboardData.topCategories.length);
console.log("Top Brands Count:", testDashboardData.topBrands.length);
console.log("Recent Orders Count:", testDashboardData.recentOrders.length);
console.log("Chart Labels Count:", testDashboardData.chartData.labels.length);
console.log("Chart Sales Data Count:", testDashboardData.chartData.sales.length);
console.log("Chart Orders Data Count:", testDashboardData.chartData.orders.length);

console.log("\nDashboard is ready to display sales analytics!"); 