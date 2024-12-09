const mongoose=require("mongoose");
const {schema}=mongoose;

const addressSchema=new Schema({
    usesrId:{
        type:Schema.Type.Object,
        ref:"User",
        requires:true
    },
    address:[{
        addressType:String,
        required:true,
        name:{
            type:String,
            required:true
        },
        city:{
            type:String,
            required:true,
           
        },
        landmark:{
         type:String,
         required:true
        },
        state:{
            type:String,
            required:true
        },
        pincode:{
            tyoe:Number,
            required:true
        },
        phone:{
            type:String,
            required:true
        }
    }]
})
const Address=mongoose.model("Address",addressSchema);
module.exports=Address;