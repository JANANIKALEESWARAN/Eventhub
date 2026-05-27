const Message = require('../models/Message');
const User = require('../models/User');
const path = require('path');

// @desc    Send a message
// @route   POST /api/chats
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { recipientId, text } = req.body;
    
    let mediaUrl = null;
    let mediaType = null;

    if (req.file) {
      mediaUrl = `/uploads/${req.file.filename}`;
      const ext = path.extname(req.file.originalname).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) mediaType = 'image';
      else if (['.mp4', '.mov', '.avi'].includes(ext)) mediaType = 'video';
      else mediaType = 'document';
    }

    const currentUser = await User.findById(req.user._id);
    const isConnected = currentUser.connections.map(id => id.toString()).includes(recipientId);
    
    // Allow message if connected OR if prior message history exists
    let hasHistory = false;
    if (!isConnected) {
      const priorMessage = await Message.findOne({
        $or: [
          { sender: req.user._id, recipient: recipientId },
          { sender: recipientId, recipient: req.user._id }
        ]
      });
      if (priorMessage) hasHistory = true;
    }

    if (!isConnected && !hasHistory) {
      return res.status(403).json({ message: 'You can only message your connections.' });
    }

    const message = await Message.create({
      sender: req.user._id,
      recipient: recipientId,
      text,
      mediaUrl,
      mediaType
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get messages for a specific chat
// @route   GET /api/chats/:userId
// @access  Private
const getMessages = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const blockedIds = (currentUser.blockedUsers || []).map(id => id.toString());
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, recipient: otherUserId },
        { sender: otherUserId, recipient: req.user._id }
      ]
    }).sort({ createdAt: 1 });

    // If I have blocked this person, hide their messages from my view
    const filtered = blockedIds.includes(otherUserId)
      ? messages.filter(m => m.sender.toString() === req.user._id.toString())
      : messages;

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get chat list (connections with latest message)
// @route   GET /api/chats/list
// @access  Private
const getChatList = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const blockedIds = (user.blockedUsers || []).map(id => id.toString());
    const chatList = [];

    // Find all distinct users we have messages with
    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { recipient: req.user._id }]
    });

    const uniqueUserIds = new Set();
    messages.forEach(m => {
      if (m.sender.toString() !== req.user._id.toString()) uniqueUserIds.add(m.sender.toString());
      if (m.recipient.toString() !== req.user._id.toString()) uniqueUserIds.add(m.recipient.toString());
    });

    // Also include active connections even if no messages yet
    if (user.connections) {
      user.connections.forEach(c => uniqueUserIds.add(c.toString()));
    }

    const chatUsers = await User.find({ _id: { $in: Array.from(uniqueUserIds) } }).select('name avatar role');

    for (let conn of chatUsers) {
      const connIdStr = conn._id.toString();
      const isBlockedByMe = blockedIds.includes(connIdStr);

      // For latest message: if I blocked this person, only show MY messages as latest
      let latestMessage;
      if (isBlockedByMe) {
        latestMessage = await Message.findOne({
          $or: [
            { sender: req.user._id, recipient: conn._id },
            // exclude their messages from preview
          ],
          sender: req.user._id,
          recipient: conn._id
        }).sort({ createdAt: -1 });
        // fall back: also check if I sent anything
        if (!latestMessage) {
          latestMessage = await Message.findOne({
            sender: req.user._id, recipient: conn._id
          }).sort({ createdAt: -1 });
        }
      } else {
        latestMessage = await Message.findOne({
          $or: [
            { sender: req.user._id, recipient: conn._id },
            { sender: conn._id, recipient: req.user._id }
          ]
        }).sort({ createdAt: -1 });
      }

      // Unread count: if I blocked them, don't count their messages as unread
      const unreadCount = isBlockedByMe ? 0 : await Message.countDocuments({
        sender: conn._id,
        recipient: req.user._id,
        isRead: false
      });

      chatList.push({
        user: conn,
        latestMessage: latestMessage ? (latestMessage.text || (latestMessage.mediaType ? '📎 Media' : '')) : '',
        latestMessageTime: latestMessage ? latestMessage.createdAt : null,
        unreadCount,
        isBlockedByMe
      });
    }

    // Sort by latest message time
    chatList.sort((a, b) => {
      if (!a.latestMessageTime) return 1;
      if (!b.latestMessageTime) return -1;
      return new Date(b.latestMessageTime) - new Date(a.latestMessageTime);
    });

    res.json(chatList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/chats/read/:userId
// @access  Private
const markAsRead = async (req, res) => {
  try {
    await Message.updateMany(
      { sender: req.params.userId, recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get total unread count
// @route   GET /api/chats/unread-count
// @access  Private
const getTotalUnreadCount = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id).select('blockedUsers');
    const blockedIds = (currentUser.blockedUsers || []).map(id => id.toString());

    const count = await Message.countDocuments({
      recipient: req.user._id,
      sender: { 
        $ne: req.user._id,           // ignore self-messages
        $nin: blockedIds             // ignore blocked users
      },
      isRead: false
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Edit a message
// @route   PUT /api/chats/:messageId
// @access  Private
const editMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    message.text = req.body.text;
    await message.save();
    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a message
// @route   DELETE /api/chats/:messageId
// @access  Private
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Message.findByIdAndDelete(req.params.messageId);
    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete entire chat with a user (only for current user's view)
// @route   DELETE /api/chats/conversation/:userId
// @access  Private
const deleteChat = async (req, res) => {
  try {
    // Delete all messages between the two users
    await Message.deleteMany({
      $or: [
        { sender: req.user._id, recipient: req.params.userId },
        { sender: req.params.userId, recipient: req.user._id }
      ]
    });
    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  getChatList,
  markAsRead,
  getTotalUnreadCount,
  editMessage,
  deleteMessage,
  deleteChat
};
