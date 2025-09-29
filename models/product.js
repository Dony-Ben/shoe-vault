const mongoose = require("mongoose");
const { PRODUCT_STATUS, PRODUCT_SIZES, PRODUCT_COLORS } = require("../constants/enums");
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
      type: mongoose.Schema.Types.ObjectId,
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
    productImage: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum:PRODUCT_STATUS,
      default: "Available",
      required: true,
    },
    sizes: [{
      type: String,
      enum: PRODUCT_SIZES,
      required: true,
    }],
    colors: [{
      type: String,
      enum: PRODUCT_COLORS,
      required: true,
    }],
  },
  { timestamps: true },
);

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
