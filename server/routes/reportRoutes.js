const express = require('express');
const router = express.Router();
const { createReport } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

// Report routes
router.route('/')
  .post(protect, createReport);

// Admin report routes removed - now handled by admin-server on port 5001

module.exports = router;
