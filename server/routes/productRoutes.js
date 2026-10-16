const express = require("express");
const productController = require("../controllers/productController");
const { requireAdmin, requireAuth } = require("../middleware/auth");
const { uploadProductImage } = require("../middleware/productImageUpload");

const router = express.Router();

router.get("/", productController.getAllProducts);
router.get("/:id", requireAuth, productController.getProductById);
router.post("/", requireAuth, requireAdmin, ...uploadProductImage, productController.addProduct);
router.put("/:id", requireAuth, requireAdmin, ...uploadProductImage, productController.updateProduct);
router.delete("/:id", requireAuth, requireAdmin, productController.deleteProduct);

module.exports = router;
