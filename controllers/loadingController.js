const Category = require("../models/category");
const Product = require("../models/product");
const userModel = require("../models/User");
const session = require("express-session")

const pageNotFound = async (req, res) => {
    try {
        res.status(404).render("user/page-404")
    } catch (error) {
        res.redirect("user/pageNotFound")
    }
};

const loadhome = async (req, res) => {
    try {
        let productData = await Product.find({ isblocked: false })

        res.render('user/home', { products :productData});
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

const loadhomepage = async (req, res) => {
    try {
      if (req.session.user && req.session.user.id && req.session.user.email) {
        return res.redirect("/home");
      }
  
      let productData = await Product.find({ isblocked: false });
      res.render("user/landing", { products: productData });
  
    } catch (error) {
      console.error("Error loading home page:", error);
      res.status(500).render("user/page-404", { message: "Internal server error" });
    }
  };
  

const loadlogin = async (req, res) => {
    try {
        res.render('user/login', { message: null });
    } catch (error) {
        console.error("Error loading login page:", error);
        res.status(500).render('error', { message: "Internal Server Error" });
    }
};


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

const shop = async (req, res) => {
    try {
        let productData = await Product.find({ isblocked: false })
        res.render("user/shop", { products:productData });
    } catch (error) {
        console.error("Error while rendering Men's page:", error);
        res.status(500).send("An error occurred while loading the page.");
    }
};
const about = async(req,res)=>{
    try {
        res.render("user/about")
    } catch (error) {
       console.error(error);
        
    }
}

module.exports = {
    loadhomepage,
    loadhome,
    pageNotFound,
    loadlogin,
    loadregister,
    loadOTP,
    shop,
    about,
}