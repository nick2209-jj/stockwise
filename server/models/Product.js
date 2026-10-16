const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },

    sku: {
      type: String,
      required: [true, "SKU is required"],
      trim: true,
      uppercase: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    category: {
      type: String,
      required: [true, "Product category is required"],
      trim: true,
    },

    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },

    stockQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Stock quantity cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Stock quantity must be an integer",
      },
    },
  },
  {
    timestamps: true,
  }
);

// SKU must be unique for each user.
productSchema.index({ userId: 1, sku: 1 }, { unique: true });

module.exports = mongoose.model("Product", productSchema);

