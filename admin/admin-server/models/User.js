const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'coordinator', 'admin'], default: 'user' },
  avatar: { type: String },
  bio: { type: String },
  skills: [{ type: String }],
  location: { type: String },
  education: { type: String },
  phone: { type: String },
  socialLinks: {
    github: String,
    linkedin: String,
    twitter: String,
    website: String
  },
  joinedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
