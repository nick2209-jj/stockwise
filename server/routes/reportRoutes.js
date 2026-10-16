const express = require("express");
const { getReports } = require("../controllers/reportController");
const { requireAdmin, requireAuth } = require("../middleware/auth");

const router = express.Router();
router.get("/", requireAuth, requireAdmin, getReports);

module.exports = router;
