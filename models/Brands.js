const mongoose = require("mongoose");
const { Schema } = mongoose;

const brandSchema = new Schema(
  {
    brandName: {
      type: String,
      required: true, // Fixed 'require' to 'required'
    },
    brandImage: {
      type: String,
      required: true, // Fixed 'require' to 'required'
    },
    description: {
      type: String,
      default: "", // Optional with a default empty string
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
  }
);

const Brand = mongoose.model("Brand", brandSchema);
module.exports = Brand;
