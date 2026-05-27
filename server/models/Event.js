const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  coordinator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['online', 'offline'], default: 'offline' },
  location: String, // Or online link
  date: { type: Date, required: true },
  endDate: { type: Date },
  time: String,
  endTime: String,
  coverMedia: String,
  registrationLimit: Number,
  registrationCloseDate: Date,
  isApprovalRequired: { type: Boolean, default: false },
  isPaid: { type: Boolean, default: false },
  price: { type: Number, default: 0 },
  requiredSkills: [String],
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  resources: [{
    title: String,
    url: String
  }],
  roadmap: [{
    day: String,
    title: String,
    description: String
  }],
  contactPerson: String,
  contactEmail: String,
  contactPhone: String,
  isClosed: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false },
  isRejected: { type: Boolean, default: false },
  status: { type: String, enum: ['upcoming', 'ongoing', 'past'], default: 'upcoming' }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
