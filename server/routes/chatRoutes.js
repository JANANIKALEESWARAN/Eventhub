const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getMessages,
  getChatList,
  markAsRead,
  getTotalUnreadCount,
  editMessage,
  deleteMessage,
  deleteChat
} = require('../controllers/chatController');
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

router.post('/', protect, upload.single('media'), sendMessage);
router.get('/list', protect, getChatList);
router.get('/unread-count', protect, getTotalUnreadCount);
router.get('/:userId', protect, getMessages);
router.put('/read/:userId', protect, markAsRead);
router.put('/:messageId', protect, editMessage);
router.delete('/conversation/:userId', protect, deleteChat);
router.delete('/:messageId', protect, deleteMessage);

module.exports = router;
