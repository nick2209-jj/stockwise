const fs = require("node:fs/promises");
const path = require("node:path");
const Product = require("../models/Product");
const Order = require("../models/Order");
const StoreSettings = require("../models/StoreSettings");
const { uploadDirectory } = require("../middleware/productImageUpload");

const fallbackImageUrl = "https://via.placeholder.com/150?text=No+Image";

function validatedImageUrl(value) {
  if (value === undefined) return undefined;
  const imageUrl = String(value).trim();
  if (!imageUrl) return fallbackImageUrl;
  if (/^\/uploads\/[a-f0-9-]+\.(jpg|png|webp|gif)$/i.test(imageUrl)) return imageUrl;
  let parsed;
  try {
    parsed = new URL(imageUrl);
  } catch {
    const error = new Error("Image URL must use HTTP or HTTPS, or be an uploaded image path.");
    error.status = 400;
    throw error;
  }
  if (/(^|\.)google\.[a-z.]+$/i.test(parsed.hostname) &&
      (/\/imgres\/?$/i.test(parsed.pathname) || /\/search\/?$/i.test(parsed.pathname))) {
    const error = new Error("Google Images search/result pages are not image URLs. Upload the image or provide its direct image address.");
    error.status = 400;
    throw error;
  }
  if (parsed.protocol === "https:" || parsed.protocol === "http:") return parsed.toString();
  const error = new Error("Image URL must use HTTP or HTTPS, or be an uploaded image path.");
  error.status = 400;
  throw error;
}

async function removeUploadedImage(filePath) {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") console.error("Unable to clean up product image.", error);
  }
}

async function removeStoredImage(imageUrl) {
  if (!imageUrl?.startsWith("/uploads/")) return;
  const fileName = path.basename(imageUrl);
  if (fileName !== imageUrl.slice("/uploads/".length)) return;
  await removeUploadedImage(path.join(uploadDirectory, fileName));
}

function productQuery(req, lowStockThreshold) {
  const query = {};
  if (req.query.category) query.category = req.query.category;
  if (req.query.stockStatus === "low") query.stockQuantity = { $gt: 0, $lt: lowStockThreshold };
  if (req.query.stockStatus === "out") query.stockQuantity = 0;
  if (req.query.stockStatus === "in") query.stockQuantity = { $gte: lowStockThreshold };
  if (req.query.search) {
    const search = new RegExp(req.query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ name: search }, { sku: search }];
  }
  return query;
}

async function getAllProducts(req, res, next) {
  try {
    const settings = await StoreSettings.findOne({ key: "store" }).select("lowStockThreshold").lean();
    const threshold = settings?.lowStockThreshold ?? 5;
    const products = await Product.find(productQuery(req, threshold)).sort({ createdAt: -1 });
    return res.json(products);
  } catch (error) {
    return next(error);
  }
}

async function addProduct(req, res, next) {
  try {
    const { name, sku, description, category, price, stockQuantity } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : validatedImageUrl(req.body.imageUrl);
    const product = await Product.create({
      userId: req.user._id,
      name,
      sku,
      description,
      category,
      price,
      stockQuantity,
      ...(imageUrl ? { imageUrl } : {}),
    });
    return res.status(201).json(product);
  } catch (error) {
    await removeUploadedImage(req.file?.path);
    if (error.code === 11000) return res.status(409).json({ message: "SKU already exists." });
    if (error.status === 400) return res.status(400).json({ message: error.message });
    return next(error);
  }
}

async function getProductById(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found." });
    return res.json(product);
  } catch (error) {
    return next(error);
  }
}

async function updateProduct(req, res, next) {
  let oldImageUrl;
  try {
    if (req.body.stockQuantity !== undefined) {
      await removeUploadedImage(req.file?.path);
      return res.status(400).json({ message: "Use the inventory adjustment endpoint to change stock." });
    }
    const product = await Product.findById(req.params.id);
    if (!product) {
      await removeUploadedImage(req.file?.path);
      return res.status(404).json({ message: "Product not found." });
    }
    oldImageUrl = product.imageUrl;
    const allowed = ["name", "sku", "description", "category", "price"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) product[key] = req.body[key];
    }
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : validatedImageUrl(req.body.imageUrl);
    if (imageUrl !== undefined) product.imageUrl = imageUrl;
    await product.save();
    if (oldImageUrl !== product.imageUrl) await removeStoredImage(oldImageUrl);
    return res.json(product);
  } catch (error) {
    await removeUploadedImage(req.file?.path);
    if (error.code === 11000) return res.status(409).json({ message: "SKU already exists." });
    if (error.status === 400) return res.status(400).json({ message: error.message });
    return next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const reservedOrder = await Order.exists({
      status: { $in: ["Pending", "Confirmed"] },
      "items.productId": req.params.id,
    });
    if (reservedOrder) return res.status(409).json({ message: "This product is included in an active order." });
    const product = await Product.findOneAndDelete({ _id: req.params.id });
    if (!product) return res.status(404).json({ message: "Product not found." });
    await removeStoredImage(product.imageUrl);
    return res.json({ message: "Product deleted." });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getAllProducts, addProduct, getProductById, updateProduct, deleteProduct };
