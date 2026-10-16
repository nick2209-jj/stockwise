const express = require("express");
const { cancelMyOrder, createOrder, listOrders, updateOrderStatus } = require("../controllers/orderController");
const { requireAdmin, requireAuth, requireCustomer } = require("../middleware/auth");

const router = express.Router();

router.get("/mine", requireAuth, listOrders);
router.post("/", requireAuth, requireCustomer, createOrder);
router.patch("/:id/cancel", requireAuth, requireCustomer, cancelMyOrder);
router.get("/", requireAuth, requireAdmin, listOrders);
router.patch("/:id/status", requireAuth, requireAdmin, updateOrderStatus);

module.exports = router;
