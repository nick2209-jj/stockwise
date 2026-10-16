const mongoose = require("mongoose");

const inventoryMovementSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    quantityChange: {
      type: Number,
      required: [true, "Quantity change is required"],
      validate: {
        validator: (value) => Number.isInteger(value) && value !== 0,
        message: "Quantity change must be a non-zero integer",
      },
    },

    reason: {
      type: String,
      required: [true, "Movement reason is required"],
      enum: [
        "Stock Added",
        "Sale",
        "Return",
        "Adjustment",
        "Order Cancellation",
      ],
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

module.exports = mongoose.model(
  "InventoryMovement",
  inventoryMovementSchema
);

