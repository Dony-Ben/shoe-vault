const mongoose = require("mongoose");
const { Schema } = mongoose;

const productSchema = new Schema(
  {
    productName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      ref: "Category", 
      required: true,
    },
    regularPrice: {
      type: Number,
      required: true,
    },
    salePrice: {
      type: Number,
      required: true,
    },
    productOffer: {
      type: Number, // Added the `type` property
      default: 0,
    },
    quantity: {
      type: Number,
      default: 0, // Updated `default` to a valid value for a Number field
    },
    isblocked:{
      type:Boolean,
      default:false
       },
   
    productImage: {
      type: [String],
      default: [], // Changed `false` to an empty array for a field of type `[String]`
    },
    status: {
      type: String,
      enum: ["Available", "Out of Stock", "Discontinued"],
      default: "Available", // Fixed the spelling of `default`
      required: true,
    },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
