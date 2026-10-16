const mongoose = require("mongoose");

const storeSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "store" },
    storeName: { type: String, required: true, trim: true, default: "Stockwise" },
    currency: { type: String, enum: ["INR"], default: "INR", required: true },
    lowStockThreshold: { type: Number, min: 0, max: 100000, default: 5, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.StoreSettings || mongoose.model("StoreSettings", storeSettingsSchema);
