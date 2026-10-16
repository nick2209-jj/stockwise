const InventoryMovement = require("../models/InventoryMovement");
const Product = require("../models/Product");

const allowedReasons = ["Restock", "Damaged", "Customer Return", "Audit"];

async function adjustStock(req, res, next) {
  const { productId, type, quantity, reason } = req.body;
  if (!Number.isInteger(quantity) || quantity < 1 || !["INCREASE", "DECREASE"].includes(type) || !allowedReasons.includes(reason)) {
    return res.status(400).json({ message: "Provide a valid adjustment type, positive whole quantity, and reason." });
  }

  try {
    const delta = type === "INCREASE" ? quantity : -quantity;
    const filter = { _id: productId };
    if (delta < 0) filter.stockQuantity = { $gte: quantity };
    const product = await Product.findOneAndUpdate(filter, { $inc: { stockQuantity: delta } }, { new: true });
    if (!product) return res.status(409).json({ message: "Product not found or insufficient stock." });

    let movement;
    try {
      movement = await InventoryMovement.create({
        productId,
        userId: req.user._id,
        quantityChange: delta,
        reason,
      });
    } catch (error) {
      await Product.findByIdAndUpdate(productId, { $inc: { stockQuantity: -delta } });
      throw error;
    }
    return res.status(201).json({ product, movement });
  } catch (error) {
    return next(error);
  }
}

async function listMovements(req, res, next) {
  try {
    const movements = await InventoryMovement.find()
      .populate("productId", "name sku")
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(500);
    return res.json(movements);
  } catch (error) {
    return next(error);
  }
}

module.exports = { adjustStock, listMovements };
