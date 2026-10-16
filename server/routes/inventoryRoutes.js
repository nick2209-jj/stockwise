const express = require("express");
const { adjustStock, listMovements } = require("../controllers/inventoryController");
const { requireAdmin, requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireAdmin);
router.get("/movements", listMovements);
router.post("/adjustments", adjustStock);

module.exports = router;
