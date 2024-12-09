const Product = require ("../models/product");
const Category =require("../models/category");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const Category = require("../models/category");




const getProductAddpage =async (req,res)=>{
    try {
       const Category = await Category.find({isListed:true});
        res.render("product-add",{
        Cat:Category,
        
       })
    } catch (error) {
        res.redirect("/pageError")
    }
}


module.exports={
    getProductAddpage,
    
}