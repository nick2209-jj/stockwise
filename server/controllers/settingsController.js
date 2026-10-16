const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const StoreSettings = require("../models/StoreSettings");
const User = require("../models/User");

async function getSettings(_req, res, next) {
  try {
    const settings = await StoreSettings.findOneAndUpdate(
      { key: "store" },
      { $setOnInsert: { key: "store", storeName: "Stockwise", currency: "INR", lowStockThreshold: 5 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
    const [activeUsers, totalProducts, totalOrders] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
    ]);
    return res.json({
      preferences: { storeName: settings.storeName, currency: settings.currency, lowStockThreshold: settings.lowStockThreshold },
      system: { database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected", activeUsers, totalProducts, totalOrders },
    });
  } catch (error) {
    return next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    if (!name?.trim() || !email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ message: "Provide a valid name and email address." });
    }
    const user = await User.findById(req.user._id).select("+passwordHash");
    if (!user) return res.status(404).json({ message: "Admin account not found." });
    const normalizedEmail = email.trim().toLowerCase();
    const conflictingUser = await User.exists({ email: normalizedEmail, _id: { $ne: user._id } });
    if (conflictingUser) return res.status(409).json({ message: "That email address is already in use." });

    if (newPassword) {
      if (!currentPassword || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
        return res.status(400).json({ message: "Enter your current password to set a new password." });
      }
      if (newPassword.length < 8) return res.status(400).json({ message: "New password must be at least 8 characters." });
      user.passwordHash = await bcrypt.hash(newPassword, 12);
    }
    user.name = name.trim();
    user.email = normalizedEmail;
    await user.save();
    return res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "That email address is already in use." });
    return next(error);
  }
}

async function updatePreferences(req, res, next) {
  try {
    const { storeName, currency, lowStockThreshold } = req.body;
    if (!storeName?.trim() || currency !== "INR" || !Number.isInteger(lowStockThreshold) || lowStockThreshold < 0 || lowStockThreshold > 100000) {
      return res.status(400).json({ message: "Provide a store name, INR currency, and a whole-number stock threshold from 0 to 100000." });
    }
    const settings = await StoreSettings.findOneAndUpdate(
      { key: "store" },
      { $set: { storeName: storeName.trim(), currency, lowStockThreshold }, $setOnInsert: { key: "store" } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    return res.json({ preferences: { storeName: settings.storeName, currency: settings.currency, lowStockThreshold: settings.lowStockThreshold } });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getSettings, updatePreferences, updateProfile };
