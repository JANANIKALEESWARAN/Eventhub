const express = require('express');
const router = express.Router();
const { 
  createEvent, 
  getEvents, 
  getEventById,
  updateEvent,
  enrollEvent, 
  getEventParticipants,
  addAnnouncement,
  approveEvent,
  deleteEvent,
  sendEventNotification,
  removeParticipant
} = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Get all events and Create new event (protected)
router.route('/')
  .get(protect, getEvents)
  .post(protect, authorize('coordinator', 'admin'), upload.single('coverMedia'), createEvent);

router.route('/:id')
  .get(protect, getEventById)
  .put(protect, authorize('coordinator', 'admin'), upload.single('coverMedia'), updateEvent)
  .delete(protect, authorize('coordinator', 'admin'), deleteEvent);

// Enroll in an event
router.post('/:id/enroll', protect, enrollEvent);

// Coordinator specific routes
router.get('/:id/participants', protect, authorize('coordinator', 'admin'), getEventParticipants);
router.post('/:id/announcements', protect, authorize('coordinator', 'admin'), addAnnouncement);
router.post('/:id/notify', protect, authorize('coordinator', 'admin'), sendEventNotification);
router.delete('/:eventId/participants/:participantId', protect, authorize('coordinator', 'admin'), removeParticipant);

// Admin moderation routes removed - now handled by admin-server on port 5001

module.exports = router;
