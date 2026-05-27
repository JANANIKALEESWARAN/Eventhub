const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  externalId: { type: String, required: true }, // ID from the external job board
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String },
  salary: { type: String },
  type: { type: String },
  link: { type: String },
  status: { type: String, enum: ['saved', 'applied'], default: 'saved' }
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
