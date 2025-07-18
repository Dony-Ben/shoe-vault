const mongoose=require("mongoose");
const Schema = mongoose.Schema

const addressSchema=new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
        name:{
            type:String,
            required:true
        },
        city:{
            type:String,
            required:true,
           
        },
        state:{
            type:String,
            required:true
        },
        pincode:{
            type:String,
            required:true
        },
        phone:{
            type:String,
            required:true
        },
        addressType:{
            type:String,
            enum:['Home', 'Work', 'Other'],
            default:'Home'
        }

})
const Address=mongoose.model("Address",addressSchema);
module.exports=Address;