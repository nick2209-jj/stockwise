const express = require("express");
const { customerOrderHistory, listCustomers } = require("../controllers/customerController");
const { requireAdmin, requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth, requireAdmin);
router.get("/", listCustomers);
router.get("/:id/orders", customerOrderHistory);

module.exports = router;
