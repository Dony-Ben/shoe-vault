const userModel = require("../models/User");
const session=require("express-session")

const pageNotFound = async (req, res) => {
    try {
        res.status(404).render("user/page-404")
    } catch (error) {
        res.redirect("user/pageNotFound")
    }
};

const loadhome = async (req, res) => {
    try {
        const products = [
            {
                name: "Sporty Sneakers",
                description: "Comfortable sneakers for daily wear.",
                price: 49.99,
                image: "/images/sneakers.jpg",
            },
            {
                name: "Outdoor Boots",
                description: "Durable boots for hiking and adventures.",
                price: 89.99,
                image: "/images/boots.jpg", 
            },
            {
                name: "Kids' Running Shoes",
                description: "Lightweight and breathable running shoes for kids.",
                price: 39.99,
                image: "/images/kids-shoes.jpg", 
            },
            {
                name: "Elegant Formal Shoes",
                description: "Stylish formal shoes for special occasions.",
                price: 69.99,
                image: "/images/formal-shoes.jpg", 
            },
        ];
        res.render('user/home', { products }); 
        } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

const loadhomepage = async (req, res) => {
    try {
        const sessionuser = req.session.user;

        if (sessionuser) {
            // Ensure User is your Mongoose model
            const userData = await userModel.findOne({ _id: sessionuser._id });

            if (userData) {
                return res.render("user/home", { User: userData });
            } else {
                console.log("User not found in the database.");
                return res.render("user/landing", { User: null });
            }
        }

        let products = []
        // If no session user, render home without user data
        res.render("user/landing",{products});
    } catch (error) {
        console.error("Error loading home page:", error); // Log detailed error
        res.status(500).send("Internal Server Error");
    }
};

const loadlogin = async (req, res) => {
    try {
        res.render('user/login', { errorMessage: null });
    } catch (error) {
        console.log(error);

    }
}
const loadregister = async (req, res) => {
    try {
        res.render('user/signup', { errorMessage: null });
    } catch (error) {
        console.log(error);

    }
}


const loadOTP = async (req, res) => {
    try {
        console.log('OTP PAGE loading... ')
        res.render('user/otp')
    } catch (error) {
        console.log('error while loading otp page... ', error)
    }
}
const mens = async (req, res) => {
    try {
        // Sample data for testing, replace with actual data if available
        const products = [
            { _id: 1, name: "Classic Black Shoes", price: 49.99, image: "/images/second.jpg" },
            { _id: 2, name: "Running Sneakers", price: 69.99, image: "/images/second.jpg" },
            { _id: 2, name: "Running Sneakers", price: 69.99, image: "/images/second.jpg" },
            { _id: 2, name: "Running Sneakers", price: 69.99, image: "/images/second.jpg" },
            { _id: 2, name: "Running Sneakers", price: 69.99, image: "/images/second.jpg" },
            { _id: 2, name: "Running Sneakers", price: 69.99, image: "/images/second.jpg" },
            { _id: 2, name: "Running Sneakers", price: 69.99, image: "/images/second.jpg" },
            { _id: 2, name: "Running Sneakers", price: 69.99, image: "/images/second.jpg" },
            { _id: 2, name: "Running Sneakers", price: 69.99, image: "/images/second.jpg" },
            { _id: 2, name: "Running Sneakers", price: 69.99, image: "/images/second.jpg" }
];

        res.render("user/mens", { products });
        } catch (error) {
        console.error("Error while rendering Men's page:", error);
        res.status(500).send("An error occurred while loading the page.");
    }
};

const womens = async (req, res) => {
    try {
        // Sample data for testing, replace with actual data if available
        const products = [
            { _id: 1, name: "Classic Black Shoes", price: 49.99, image: "/images/second.jpg" },
            { _id: 2, name: "Running Sneakers", price: 69.99, image: "/images/second.jpg" },
            { _id: 2, name: "Running Sneakers", price: 69.99, image: "/images/second.jpg" },
            { _id: 2, name: "Running Sneakers", price: 69.99, image: "/images/second.jpg" },
            { _id: 2, name: "Running Sneakers", price: 69.99, image: "/images/second.jpg" },
            { _id: 2, name: "Running Sneakers", price: 69.99, image: "/images/second.jpg" },
            { _id: 2, name: "Running Sneakers", price: 69.99, image: "/images/second.jpg" },
            { _id: 2, name: "Running Sneakers", price: 69.99, image: "/images/second.jpg" },
            { _id: 2, name: "Running Sneakers", price: 69.99, image: "/images/second.jpg" },
            { _id: 2, name: "Running Sneakers", price: 69.99, image: "/images/second.jpg" }
];

        res.render("user/women", { products });
        } catch (error) {
        console.error("Error while rendering Men's page:", error);
        res.status(500).send("An error occurred while loading the page.");
    }
};

module.exports = {
    loadhomepage,
    loadhome,
    pageNotFound,
    loadlogin,
    loadregister,
    loadOTP,
    mens,
    womens,
}