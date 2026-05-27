const mongoose = require('mongoose');

const marketJobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String },
  salary: { type: String },
  type: { type: String },
  link: { type: String },
  description: { type: String },
  skills: [String],
  postedDate: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for search
marketJobSchema.index({ title: 'text', company: 'text', description: 'text', skills: 'text' });

module.exports = mongoose.model('MarketJob', marketJobSchema);
