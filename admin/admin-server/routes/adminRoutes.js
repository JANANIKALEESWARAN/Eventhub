const express = require('express');
const router = express.Router();
const { adminLogin, getAdminStats, getAllUsers, updateUser, deleteUser, getPendingEvents, getAllEvents, approveEvent, rejectEvent, getAllReports, updateReportStatus, getSystemHealth } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Admin authentication
router.post('/login', adminLogin);

// Admin stats and management (Admin only)
router.get('/stats', protect, authorize('admin'), getAdminStats);
router.get('/health', protect, authorize('admin'), getSystemHealth);
router.get('/users', protect, authorize('admin'), getAllUsers);
router.put('/users/:id', protect, authorize('admin'), updateUser);
router.delete('/users/:id', protect, authorize('admin'), deleteUser);
router.get('/events', protect, authorize('admin'), getAllEvents);
router.get('/events/pending', protect, authorize('admin'), getPendingEvents);
router.put('/events/:id/approve', protect, authorize('admin'), approveEvent);
router.delete('/events/:id/reject', protect, authorize('admin'), rejectEvent);
router.get('/reports', protect, authorize('admin'), getAllReports);
router.put('/reports/:id', protect, authorize('admin'), updateReportStatus);

module.exports = router;
