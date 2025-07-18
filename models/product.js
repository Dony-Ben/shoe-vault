const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

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
      type:  mongoose.Schema.Types.ObjectId,
      ref: "Category", 
      required: true,
    },
    brands: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true
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
      type: Number,
      default: 0,
    },
    quantity: {
      type: Number,
      min: [0, 'Quantity cannot be negative'],
    },
    isblocked: {
      type: Boolean,
      default: false
    },
    subtotal: {
      type: Number,
      require: true,
    },
    productImage: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["Available", "Out of Stock", "Discontinued"],
      default: "Available",
      required: true,
    },
    sizes: {
      type: [String],
      required: true,
    }
  },
  { timestamps: true },
);

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
