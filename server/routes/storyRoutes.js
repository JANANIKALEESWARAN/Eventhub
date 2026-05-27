const express = require('express');
const router = express.Router();
const Story = require('../models/Story');
const { protect: auth } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/stories'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ 
  storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
});

// Get all stories from the network
router.get('/', auth, async (req, res) => {
  try {
    const stories = await Story.find({ expiresAt: { $gt: new Date() } })
      .populate('user', 'name avatar')
      .populate('likes.user', 'name avatar')
      .populate('comments.user', 'name avatar')
      .sort({ createdAt: -1 });
    
    // Ensure content URLs are absolute if needed
    const updatedStories = stories.map(s => ({
      ...s._doc,
      content: s.content.startsWith('http') ? s.content : `${req.protocol}://${req.get('host')}/${s.content}`
    }));

    res.json(updatedStories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new story (File Upload with Debugging)
router.post('/', auth, (req, res) => {
  // Ensure directory exists
  const dir = 'uploads/stories';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  upload.single('file')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer Error:', err);
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      console.error('Unknown Upload Error:', err);
      return res.status(500).json({ message: `Server error: ${err.message}` });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please select a file to upload' });
    }

    try {
      const story = new Story({
        user: req.user.id,
        content: req.file.path.replace(/\\/g, '/'),
        type: req.file.mimetype.startsWith('video') ? 'video' : 'image'
      });
      const savedStory = await story.save();
      res.status(201).json(savedStory);
    } catch (dbErr) {
      console.error('Database Error:', dbErr);
      res.status(400).json({ message: dbErr.message });
    }
  });
});

// Delete a story
router.delete('/:id', auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    // Check ownership
    if (story.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Delete physical file
    const filePath = path.join(__dirname, '..', story.content);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await story.deleteOne();
    res.json({ message: 'Story removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const Message = require('../models/Message');

// Like/Unlike a story
router.post('/:id/like', auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    const alreadyLiked = story.likes.find(l => l.user && l.user.toString() === req.user.id);
    
    if (alreadyLiked) {
      story.likes = story.likes.filter(l => l.user && l.user.toString() !== req.user.id);
    } else {
      story.likes.push({ 
        user: req.user.id,
        createdAt: new Date()
      });
    }

    await story.save();
    const updatedStory = await Story.findById(story._id).populate('likes.user', 'name avatar');
    res.json(updatedStory.likes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Comment on a story
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    const comment = {
      user: req.user.id,
      text: req.body.text
    };

    story.comments.push(comment);
    await story.save();
    
    const updatedStory = await Story.findById(story._id).populate('comments.user', 'name');
    res.json(updatedStory.comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reply to a story (Send Message)
router.post('/:id/reply', auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    const message = new Message({
      sender: req.user.id,
      recipient: story.user,
      text: req.body.text,
      storyRef: story._id
    });

    await message.save();
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
