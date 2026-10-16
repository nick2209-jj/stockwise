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
        "Restock",
        "Damaged",
        "Customer Return",
        "Audit",
        "CUSTOMER_ORDER",
        "ORDER_CANCELLED",
      ],
    },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

inventoryMovementSchema.index({ createdAt: -1 });

module.exports = mongoose.models.InventoryMovement || mongoose.model("InventoryMovement", inventoryMovementSchema);
