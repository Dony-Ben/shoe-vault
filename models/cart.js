const mongoose=require("mongoose");
const {Schema}=mongoose;
const cartSchema = new mongoose({
    userId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    items:[{
        productId:{
            type:Schema.Types.ObjectId,
            ref:'product',
            required:true
        },
        qauantity:{
            type:Number,
            default:1
        },
        price:{
            type:Number,
            required:true
        },
        totalprice:{
            type:Number,
            required:true
        },
        status:{
            type:String,
            default:"placed"
        },
        cancelletionReaseon:{
            type:String,
            default:"none"
        }
    }]
})
const Cart=mongoose.model("cartSchema");
module.exports=Cart
