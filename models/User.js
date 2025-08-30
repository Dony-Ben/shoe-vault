const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    firstname:{
        type:String,
        required:true
    },
    lastname:{
        type:String,
        required:false
    },
    email:{
       type:String,
       required:true,
       unique: true,
       lowercase: true,
       validate: {
         validator: function(v) {
           return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
         },
         message: 'Please enter a valid email address'
       }
    },
    googleId:{
       type:String,
       unique: true,
       required:false
    },
    password:{
        type:String,
        required:false
    },
    isadmin:{
        type:Boolean,
        default:false
    },
    isblocked:{
   type:Boolean,
   default:false
    },
},{timestamps:true})

const userModel=mongoose.model("User",userSchema);
module.exports =userModel; 