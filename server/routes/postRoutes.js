const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { createPost, getPosts, getUserPosts, updatePost, likePost, commentOnPost, deletePost, votePoll, savePost, getSavedPosts, getUserInteractions, repostPost } = require('../controllers/postController');
const { protect, authorize } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB for posts
});

router.route('/')
  .post(protect, upload.single('media'), createPost)
  .get(protect, getPosts);

router.get('/my-posts', protect, getUserPosts);
router.get('/user/:id', protect, getUserPosts);

router.get('/saved', protect, getSavedPosts);
router.get('/interactions', protect, getUserInteractions);

router.route('/:id')
  .put(protect, upload.single('media'), updatePost)
  .delete(protect, deletePost);

router.put('/:id/save', protect, savePost);
router.put('/:id/like', protect, likePost);
router.put('/:id/vote', protect, votePoll);
router.put('/:id/repost', protect, repostPost);
router.post('/:id/comment', protect, commentOnPost);

module.exports = router;
