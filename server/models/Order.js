const mongoose = require("mongoose");

const orderLineSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  productName: { type: String, required: true, trim: true },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    validate: { validator: Number.isInteger, message: "Quantity must be an integer." },
  },
  unitPrice: { type: Number, required: true, min: 0 },
});

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    customerName: { type: String, required: true, trim: true },
    customerContact: { type: String, required: true, trim: true },
    shippingAddress: { type: String, required: true, trim: true },
    items: {
      type: [orderLineSchema],
      validate: { validator: (items) => items.length > 0, message: "An order requires at least one item." },
    },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Shipped", "Cancelled"],
      default: "Pending",
      required: true,
    },
    stockReserved: { type: Boolean, default: true },
    seedKey: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);
