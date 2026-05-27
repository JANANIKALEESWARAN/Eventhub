const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  endDate: { type: Date },
  time: { type: String },
  endTime: { type: String },
  location: { type: String },
  type: { type: String, enum: ['online', 'offline'], default: 'offline' },
  coverMedia: { type: String },
  registrationLimit: { type: Number },
  registrationCloseDate: { type: Date },
  isPaid: { type: Boolean, default: false },
  price: { type: Number },
  requiredSkills: [{ type: String }],
  coordinator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  resources: [{ type: String }],
  isApproved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', eventSchema);
