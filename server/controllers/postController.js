const Post = require('../models/Post');
const User = require('../models/User');
const Story = require('../models/Story');
const Notification = require('../models/Notification');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res) => {
  try {
    const { content, type, tags, audience, pollOptions, eventData } = req.body;
    let media = [];

    if (req.file) {
      media.push(req.file.path.replace(/\\/g, '/'));
    }

    const contentHashtags = content ? (content.match(/#[\w\u0080-\uFFFF]+/g)?.map(tag => tag.slice(1)) || []) : [];
    
    // Auto-generation logic for keywords without #
    const commonKeywords = ['hiring', 'job', 'student', 'developer', 'intern', 'opportunity', 'career', 'tech', 'innovation', 'project'];
    const contentKeywords = content ? commonKeywords.filter(kw => new RegExp(`\\b${kw}\\b`, 'i').test(content)) : [];
    
    const contentTags = [...new Set([...contentHashtags, ...contentKeywords])];
    
    let providedTags = tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [];
    const combinedTags = [...new Set([...providedTags, ...contentTags])];

    const newPostData = {
      author: req.user._id,
      content,
      type: type || (req.file ? 'media' : 'text'),
      media,
      tags: combinedTags,
      audience
    };

    if (pollOptions) {
      const parsedPoll = typeof pollOptions === 'string' ? JSON.parse(pollOptions) : pollOptions;
      newPostData.pollOptions = parsedPoll.filter(o => o.trim()).map(opt => ({ text: opt, votes: [] }));
    }

    if (eventData) {
      const parsedEvent = typeof eventData === 'string' ? JSON.parse(eventData) : eventData;
      newPostData.eventData = parsedEvent;
    }

    const newPost = await Post.create(newPostData);
    const populatedPost = await Post.findById(newPost._id).populate('author', 'name avatar role');

    res.status(201).json(populatedPost);
  } catch (error) {
    console.error('Create Post Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all posts
// @route   GET /api/posts
// @access  Private
const getPosts = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const networkIds = [...(currentUser.following || []), ...(currentUser.connections || [])].map(id => id.toString());
    
    const posts = await Post.find()
      .populate('author', 'name avatar role bio')
      .populate('comments.user', 'name avatar role')
      .populate('likes.user', 'name avatar role bio')
      .populate({
        path: 'repostedFrom',
        populate: { path: 'author', select: 'name avatar role' }
      })
      .sort({ createdAt: -1 });

    // Custom sort: Network posts first, then newest
    const sortedPosts = [...posts].sort((a, b) => {
      const aAuthorId = a.author?._id?.toString() || '';
      const bAuthorId = b.author?._id?.toString() || '';
      
      const aIsNetwork = aAuthorId && networkIds.includes(aAuthorId);
      const bIsNetwork = bAuthorId && networkIds.includes(bAuthorId);

      if (aIsNetwork && !bIsNetwork) return -1;
      if (!aIsNetwork && bIsNetwork) return 1;
      return 0; // Maintain createdAt sort from query
    });

    res.status(200).json(sortedPosts);
  } catch (error) {
    console.error('Get Posts Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Like or Unlike a post
// @route   PUT /api/posts/:id/like
// @access  Private
const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user has already liked the post
    const alreadyLiked = post.likes.find(
      (like) => like.user && like.user.toString() === req.user._id.toString()
    );

    if (alreadyLiked) {
      // Unlike
      post.likes = post.likes.filter(
        (like) => like.user && like.user.toString() !== req.user._id.toString()
      );
    } else {
      // Like
      post.likes.push({ 
        user: req.user._id,
        createdAt: new Date()
      });
    }

    await post.save();
    const updatedPost = await Post.findById(post._id).populate('likes.user', 'name avatar role bio');
    res.status(200).json(updatedPost.likes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Comment on a post
// @route   POST /api/posts/:id/comment
// @access  Private
const commentOnPost = async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const newComment = {
      user: req.user._id,
      text
    };

    post.comments.push(newComment);
    await post.save();

    const populatedPost = await Post.findById(post._id).populate('comments.user', 'name avatar role');

    res.status(201).json(populatedPost.comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check ownership or admin
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to edit this post' });
    }

    if (req.file) {
      post.media = [req.file.path.replace(/\\/g, '/')];
      post.type = 'media';
    }
    post.content = req.body.content || post.content;
    const updatedPost = await post.save();
    
    const populated = await Post.findById(updatedPost._id).populate('author', 'name avatar role');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check ownership or admin
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Vote on a poll
// @route   PUT /api/posts/:id/vote
// @access  Private
const votePoll = async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post || post.type !== 'poll') {
      return res.status(404).json({ message: 'Poll not found' });
    }

    // Remove user from all other options in this poll
    post.pollOptions.forEach((opt) => {
      opt.votes = opt.votes.filter(v => v.toString() !== req.user._id.toString());
    });

    // Add vote to chosen option
    post.pollOptions[optionIndex].votes.push(req.user._id);

    await post.save();
    res.status(200).json(post.pollOptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's own posts
// @route   GET /api/posts/my-posts
// @access  Private
const getUserPosts = async (req, res) => {
  try {
    const userId = req.params.id || req.user._id;
    console.log('Querying posts for user:', userId);
    const posts = await Post.find({ author: userId })
      .populate('author', 'name avatar role bio')
      .populate('likes.user', 'name avatar role bio')
      .populate({
        path: 'repostedFrom',
        populate: { path: 'author', select: 'name avatar role' }
      })
      .sort({ createdAt: -1 });
    console.log('Found posts count:', posts.length);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Save or Unsave a post
// @route   PUT /api/posts/:id/save
// @access  Private
const savePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const user = await User.findById(req.user._id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (user.savedPosts.map(id => id.toString()).includes(post._id.toString())) {
      // Unsave
      user.savedPosts = user.savedPosts.filter(id => id.toString() !== post._id.toString());
    } else {
      // Save
      user.savedPosts.push(post._id);
    }

    await user.save();
    res.json(user.savedPosts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get saved posts
// @route   GET /api/posts/saved
// @access  Private
const getSavedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedPosts',
      populate: { path: 'author', select: 'name avatar role' }
    });
    // Filter out null entries if any saved posts were deleted
    const validPosts = user.savedPosts.filter(post => post !== null);
    res.json(validPosts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user interactions (likes and comments on others' posts)
// @route   GET /api/posts/interactions
// @access  Private
const getUserInteractions = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const userId = new mongoose.Types.ObjectId(req.user._id);
    console.log('Fetching interactions for user:', userId);

    // 1. Posts liked by user
    const likedPosts = await Post.find({ 'likes.user': userId })
      .populate('author', 'name avatar role')
      .select('content type createdAt author likes');
    console.log(`Liked posts: ${likedPosts.length}`);

    // 2. Posts commented by user
    const commentedPosts = await Post.find({ 'comments.user': userId })
      .populate('author', 'name avatar role')
      .select('content type createdAt author comments');
    console.log(`Commented posts: ${commentedPosts.length}`);

    // 3. Stories liked by user
    const likedStories = await Story.find({ 'likes.user': userId })
      .populate('user', 'name avatar role')
      .select('content type createdAt user likes');
    console.log(`Liked stories: ${likedStories.length}`);

    // 4. Stories commented/replied by user
    const commentedStories = await Story.find({ 'comments.user': userId })
      .populate('user', 'name avatar role')
      .select('content type createdAt user comments');
    console.log(`Commented stories: ${commentedStories.length}`);

    // 5. Networking + Event actions from Notifications
    const networkingActions = await Notification.find({
      sender: userId,
      type: { $in: ['new_follower', 'connection_request', 'connection_accepted', 'event_joined'] }
    })
      .populate('recipient', 'name avatar role')
      .populate('event', 'title');
    console.log(`Networking/event actions: ${networkingActions.length}`);

    // 5b. Fallback for older event joins (no notification) – pull from user's joinedEvents
    const userWithEvents = await User.findById(userId).populate('joinedEvents', 'title createdAt');
    if (!userWithEvents) {
      return res.status(404).json({ message: 'User not found' });
    }
    const existingEventIds = new Set(networkingActions.filter(n => n.type === 'event_joined').map(n => n.event?.toString()));
    const legacyEventInteractions = (userWithEvents.joinedEvents || []).filter(ev => !existingEventIds.has(ev._id?.toString()))
      .map(ev => ({
        id: `legacy-join-${ev._id}`,
        type: 'event',
        text: `You joined "${ev.title}"`,
        date: ev.createdAt, // fallback to event creation date if join timestamp missing
        link: `/event/${ev._id}`
      }));
    // Combine networking actions with legacy events
    const allNetworking = [...networkingActions, ...legacyEventInteractions];

    // Format interactions
    const interactions = [
      ...likedPosts.map(p => {
        const userLike = p.likes.find(l => {
          const lId = l.user ? l.user : l;
          return lId.toString() === userId.toString();
        });
        return {
          id: `like-post-${p._id}`,
          type: 'like',
          text: `You liked ${p.author?.name || 'someone'}'s post`,
          date: userLike?.createdAt || p.createdAt || new Date(),
          link: `/profile/${p.author?._id || ''}`
        };
      }),
      ...commentedPosts.map(p => {
        const userComment = p.comments.find(c => c.user && c.user.toString() === userId.toString());
        return {
          id: `comment-post-${p._id}`,
          type: 'comment',
          text: `You commented: "${userComment?.text || ''}" on ${p.author?.name || 'someone'}'s post`,
          date: userComment?.createdAt || p.createdAt || new Date(),
          link: `/profile/${p.author?._id || ''}`
        };
      }),
      ...likedStories.map(s => {
        const userLike = s.likes.find(l => {
          const lId = l.user ? l.user : l;
          return lId.toString() === userId.toString();
        });
        return {
          id: `like-story-${s._id}`,
          type: 'like',
          text: `You liked ${s.user?.name || 'someone'}'s story`,
          date: userLike?.createdAt || s.createdAt || new Date(),
          link: `/profile/${s.user?._id || ''}`
        };
      }),
      ...commentedStories.map(s => {
        const userComment = s.comments.find(c => c.user && c.user.toString() === userId.toString());
        return {
          id: `comment-story-${s._id}`,
          type: 'comment',
          text: `You replied: "${userComment?.text || ''}" to ${s.user?.name || 'someone'}'s story`,
          date: userComment?.createdAt || s.createdAt || new Date(),
          link: `/profile/${s.user?._id || ''}`
        };
      }),
      ...allNetworking.map(n => {
        if (n.type === 'event_joined') {
          return {
            id: `net-${n._id}`,
            type: 'event',
            text: `You joined "${n.event?.title || 'an event'}"`,
            date: n.createdAt,
            link: n.event?._id ? `/event/${n.event._id}` : '/'
          };
        }
        if (n.type === 'event') {
          // legacy formatted event join
          return n;
        }
        return {
          id: `net-${n._id}`,
          type: n.type === 'new_follower' ? 'follow' : 'connection',
          text: n.type === 'new_follower' 
            ? `You started following ${n.recipient?.name || 'someone'}` 
            : `You sent a connection request to ${n.recipient?.name || 'someone'}`,
          date: n.createdAt,
          link: `/profile/${n.recipient?._id || ''}`
        };
      })
    ];

    interactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json(interactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Repost a post
// @route   PUT /api/posts/:id/repost
// @access  Private
const repostPost = async (req, res) => {
  try {
    const originalPost = await Post.findById(req.params.id);
    if (!originalPost) return res.status(404).json({ message: 'Post not found' });
    
    // Create the repost entry
    const repost = await Post.create({
      author: req.user._id,
      content: originalPost.content, // Copy content for simplicity or keep it empty
      repostedFrom: originalPost._id,
      type: originalPost.type,
      media: originalPost.media,
      tags: originalPost.tags,
      pollOptions: originalPost.pollOptions,
      eventData: originalPost.eventData
    });

    // Increment original post's repost count
    originalPost.repostCount = (originalPost.repostCount || 0) + 1;
    await originalPost.save();

    res.json({ 
      repostCount: originalPost.repostCount,
      newPost: repost 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPost,
  getPosts,
  getUserPosts,
  updatePost,
  likePost,
  commentOnPost,
  deletePost,
  votePoll,
  savePost,
  getSavedPosts,
  getUserInteractions,
  repostPost
};
