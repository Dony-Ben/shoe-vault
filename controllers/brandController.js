const Brand = require("../models/Brands");
// const Product = require("../models/product");


const getBrandpage = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;

        // Fetch paginated brand data
        const brandData = await Brand.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Calculate total pages for pagination
        const totalBrands = await Brand.countDocuments({});
        const totalPages = Math.ceil(totalBrands / limit);

        // Render the brand page
        res.render("admin/Brand", {
            data: brandData, // No need for reverse if already sorted
            currentpages: page,
            totalPages: totalPages,
            totalBrands: totalBrands,
        });

    } catch (error) {
        console.error("Error fetching brand data:", error);
        res.redirect("/pageError");
    }
};


const addBrand = async (req, res) => {
    try {
        const brand = req.body.name;
        const findBrand = await Brand.findOne({ brand });
        if (!findBrand) {
            const image = req.file.filename;
            const newBrand = new Brand({
                brandName: brand,
                brandImage: image,
            })
            await newBrand.save();
            res.redirect("/admin/brands")
        }
    } catch (error) {
        res.redirect("/pageError")
    }
}
const blockBrand = async (req,res)=>{
    try {
        const id = req.query.id;
        await Brand.updateOne({_id:id},{$set:{isBlocked:true}});
        res.redirect("/admin/brands")

    } catch (error) {
        
    }
}

const unBlockBrand =async (req,res)=>{
    try {
        const id = req.query.id;
        await Brand.updateOne({_id:id},{$set:{isBlocked:false}});
        res.redirect("/admin/brands");
    } catch (error) {
      res.redirect("/pageError")  
    }
}
const deleteBrand =async (req,res)=>{
    try {
       const {id}= req.query;
       if(!id){
        return res.status(400).redirect("/pageError")
       } 
       await Brand.deleteOne({_id:id});
       res.redirect("/admin/brands")
    } catch (error) {
       console.log("Error delete brand:",error);
    res.status(500).redirect("/pageError")
        
    }
}
module.exports = {
    getBrandpage,
    addBrand,
    blockBrand,
    unBlockBrand,
    deleteBrand,
}