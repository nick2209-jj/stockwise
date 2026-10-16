const express = require("express");
const { getSettings, updatePreferences, updateProfile } = require("../controllers/settingsController");
const { requireAdmin, requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth, requireAdmin);
router.get("/", getSettings);
router.patch("/profile", updateProfile);
router.put("/preferences", updatePreferences);

module.exports = router;
