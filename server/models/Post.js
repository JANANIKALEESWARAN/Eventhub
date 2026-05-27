const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['text', 'media', 'article', 'poll', 'event'], default: 'text' },
  content: { type: String, required: false },
  media: [String], // Array of URLs
  tags: [String],
  pollOptions: [{
    text: String,
    votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  }],
  eventData: {
    title: String,
    date: Date,
    location: String
  },
  likes: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  audience: { type: String, enum: ['public', 'connections', 'private'], default: 'public' },
  repostCount: { type: Number, default: 0 },
  repostedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
