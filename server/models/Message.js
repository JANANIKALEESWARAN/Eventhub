const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String },
  mediaUrl: { type: String },
  mediaType: { type: String, enum: ['image', 'video', 'document'] },
  isRead: { type: Boolean, default: false },
  storyRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Story' },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
