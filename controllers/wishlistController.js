const wishlist =async(req,res)=>{
    try{
        const userId = req.session.user?.id;
        res.render("user/wishlist")
    }catch{
    console.log(err)
    }
}
module.exports={
    wishlist
}