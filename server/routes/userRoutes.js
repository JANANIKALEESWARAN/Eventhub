const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer Config for Avatars
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/avatars';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `avatar-${req.user._id}-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

const {
  getUserProfile,
  updateMyProfile,
  uploadAvatar,
  followUser,
  requestConnection,
  handleConnectionRequest,
  getSuggestedUsers,
  getUserById,
  getNetworkingNotificationsCount,
  markNetworkingNotificationsRead,
  getNotifications,
  markAllNotificationsRead,
  toggleBlockUser,
  toggleMuteUser,
  toggleCloseFriend
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Profile Routes
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateMyProfile);

router.post('/profile/avatar', protect, upload.single('avatar'), uploadAvatar);

router.get('/profile/:id', protect, getUserById);

// Networking Routes
router.get('/suggested', protect, getSuggestedUsers);
router.post('/:id/follow', protect, followUser);
router.post('/:id/connect', protect, requestConnection);
router.put('/connections/:requestId', protect, (req, res, next) => {
  console.log(`ROUTE DEBUG: PUT /api/users/connections/${req.params.requestId}`);
  next();
}, handleConnectionRequest);
router.post('/:id/block', protect, toggleBlockUser);
router.post('/:id/mute', protect, toggleMuteUser);
router.post('/:id/close-friend', protect, toggleCloseFriend);

// Notification Routes
router.get('/notifications/networking/count', protect, getNetworkingNotificationsCount);
router.put('/notifications/networking/read', protect, markNetworkingNotificationsRead);
router.get('/notifications', protect, getNotifications);
router.put('/notifications/read-all', protect, markAllNotificationsRead);

// Admin routes removed - now handled by admin-server on port 5001

module.exports = router;
