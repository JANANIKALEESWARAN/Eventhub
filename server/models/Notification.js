const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['connection_request', 'new_follower', 'connection_accepted', 'connection_rejected', 'event_announcement', 'event_joined'], required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  message: { type: String },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
