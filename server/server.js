require("dotenv").config();
const cors = require("cors");
const express = require("express");
const multer = require("multer");
const path = require("node:path");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const orderRoutes = require("./routes/orderRoutes");
const customerRoutes = require("./routes/customerRoutes");
const reportRoutes = require("./routes/reportRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());
app.use("/uploads", express.static(path.resolve(__dirname, "uploads"), {
  dotfiles: "deny",
  index: false,
  maxAge: "1d",
  fallthrough: false,
}));
app.get("/api/health", (_request, response) => response.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/settings", settingsRoutes);

app.use((error, _request, response, _next) => {
  console.error("Unhandled API error.", error);
  if (error instanceof multer.MulterError) {
    const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return response.status(status).json({ message: error.code === "LIMIT_FILE_SIZE" ? "Image must be 5 MB or smaller." : "Invalid image upload." });
  }
  if (error.status === 404 && error.path?.startsWith("/uploads/")) {
    return response.status(404).json({ message: "Image not found." });
  }
  if (error.message === "Only JPEG, PNG, WebP, and GIF images are supported.") {
    return response.status(400).json({ message: error.message });
  }
  if (error.status === 400) return response.status(400).json({ message: error.message });
  if (error.name === "ValidationError") {
    return response.status(400).json({ message: error.message });
  }
  if (error.name === "CastError") {
    return response.status(400).json({ message: "Invalid identifier." });
  }
  return response.status(500).json({ message: "Internal server error." });
});

async function start() {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured.");
  await connectDB();
  app.listen(port, () => console.log(`API listening on port ${port}.`));
}

start().catch((error) => {
  console.error("API startup failed.", error);
  process.exitCode = 1;
});
