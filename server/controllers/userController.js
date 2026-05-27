const User = require('../models/User');
const Event = require('../models/Event');
const Notification = require('../models/Notification');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('joinedEvents', 'title date location status participants')
      .populate({
        path: 'createdEvents',
        select: 'title date location status participants registrationLimit isApproved isRejected',
        populate: {
          path: 'participants',
          select: 'name email avatar role bio'
        }
      })
      .populate('followers', 'name avatar role bio')
      .populate('following', 'name avatar role bio')
      .populate('connections', 'name avatar role bio')
      .populate('connectionRequests.user', 'name avatar role bio')
      .populate('blockedUsers', 'name avatar role bio')
      .populate('closeFriends', 'name avatar role bio');

    if (user) {
      // console.log('Joined events count:', user.joinedEvents.length);
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update current user profile
// @route   PUT /api/users/profile
// @access  Private
const updateMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.bio = req.body.bio || user.bio;
      user.skills = req.body.skills || user.skills;
      user.location = req.body.location || user.location;
      user.education = req.body.education || user.education;
      user.phone = req.body.phone || user.phone;
      user.socialLinks = req.body.socialLinks || user.socialLinks;
      if (req.body.isPrivate !== undefined) {
        user.isPrivate = req.body.isPrivate;
      }
      if (req.body.timeSettings) {
        user.timeSettings = req.body.timeSettings;
      }

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.avatar = req.file.path.replace(/\\/g, '/');
    await user.save();

    res.json({ message: 'Avatar updated successfully', avatar: user.avatar });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user (Admin moderation)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      // Cannot delete another admin for safety
      if (user.role === 'admin') {
        return res.status(400).json({ message: 'Cannot delete admin users' });
      }
      
      await User.findByIdAndDelete(req.params.id);
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user (Admin moderation - e.g. role change)
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.role = req.body.role || user.role;

      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Follow a user
// @route   POST /api/users/:id/follow
// @access  Private
const followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!userToFollow) return res.status(404).json({ message: 'User not found' });
    
    // Restriction: Cannot follow coordinators
    if (userToFollow.role === 'coordinator') {
      return res.status(403).json({ message: 'You can only follow regular users, not coordinators.' });
    }

    if (currentUser.following.includes(userToFollow._id)) {
      // Unfollow
      currentUser.following = currentUser.following.filter(id => id.toString() !== userToFollow._id.toString());
      userToFollow.followers = userToFollow.followers.filter(id => id.toString() !== currentUser._id.toString());
      
      // Delete notification
      await Notification.deleteOne({ sender: currentUser._id, recipient: userToFollow._id, type: 'new_follower' });
    } else {
      // Follow
      currentUser.following.push(userToFollow._id);
      userToFollow.followers.push(currentUser._id);

      // Create Notification
      await Notification.create({
        sender: currentUser._id,
        recipient: userToFollow._id,
        type: 'new_follower'
      });
    }

    await currentUser.save();
    await userToFollow.save();

    res.json({ following: currentUser.following });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Request connection
// @route   POST /api/users/:id/connect
// @access  Private
const requestConnection = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    console.log(`DEBUG: Connection request from [${req.user.name}] (${req.user._id}) to [${targetUser.name}] (${targetUser._id})`);

    // Restriction: Cannot connect with coordinators
    if (targetUser.role === 'coordinator') {
      return res.status(403).json({ message: 'You can only connect with regular users, not coordinators.' });
    }

    const alreadyRequested = targetUser.connectionRequests.some(r => r.user.toString() === req.user._id.toString());
    const alreadyConnected = targetUser.connections.some(id => id.toString() === req.user._id.toString());

    if (alreadyRequested || alreadyConnected) {
      console.log(`DEBUG: Already requested or connected with ${targetUser.name}`);
      return res.status(400).json({ message: 'Connection already requested or established' });
    }

    targetUser.connectionRequests.push({ user: req.user._id, status: 'pending' });
    await targetUser.save();
    console.log(`DEBUG: Request successfully saved to ${targetUser.name}'s connectionRequests`);

    // Create Notification
    await Notification.create({
      sender: req.user._id,
      recipient: targetUser._id,
      type: 'connection_request'
    });
    console.log(`DEBUG: Notification created for ${targetUser.name}`);

    res.json({ message: 'Connection request sent' });
  } catch (error) {
    console.error('DEBUG: Connection request error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Handle connection request
// @route   PUT /api/users/connections/:requestId
// @access  Private
const handleConnectionRequest = async (req, res) => {
  try {
    const { status } = req.body;
    const currentUser = await User.findById(req.user._id);
    
    console.log(`DEBUG: Handling connection request [${req.params.requestId}] with status [${status}] for user [${currentUser.name}]`);

    console.log(`DEBUG: Available Request IDs:`, currentUser.connectionRequests.map(r => r._id.toString()));
    
    const requestIndex = currentUser.connectionRequests.findIndex(r => r._id.toString() === req.params.requestId);
    if (requestIndex === -1) {
      console.log(`DEBUG: Request ID [${req.params.requestId}] not found in [${currentUser.connectionRequests.length}] requests`);
      return res.status(404).json({ message: 'Request not found' });
    }

    const request = currentUser.connectionRequests[requestIndex];
    const requesterId = request.user;
    console.log(`DEBUG: Requester ID is ${requesterId}`);

    if (status === 'accepted') {
      currentUser.connections.push(requesterId);
      const requester = await User.findById(requesterId);
      if (requester) {
        requester.connections.push(currentUser._id);
        await requester.save();
        console.log(`DEBUG: Connection established with ${requester.name}`);
      }

      // Create Notification for the requester
      await Notification.create({
        sender: currentUser._id,
        recipient: requesterId,
        type: 'connection_accepted'
      });
      console.log('DEBUG: Accepted notification created');
    } else if (status === 'rejected') {
      // Create Notification for the requester
      await Notification.create({
        sender: currentUser._id,
        recipient: requesterId,
        type: 'connection_rejected'
      });
      console.log('DEBUG: Rejected notification created');
    }

    currentUser.connectionRequests.splice(requestIndex, 1);
    await currentUser.save();
    console.log('DEBUG: User profile saved after handling request');

    res.json({ message: `Connection ${status}`, connections: currentUser.connections });
  } catch (error) {
    console.error('DEBUG: Handle connection request error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get suggested users
// @route   GET /api/users/suggested
// @access  Private
const getSuggestedUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id).populate('connections', 'connections');
    
    const excludedIds = [
      req.user._id.toString(), 
      ...(currentUser.following || []).map(id => id.toString()), 
      ...(currentUser.connections || []).map(c => c._id.toString())
    ];
    
    // Find Mutual Connections (Friends of Friends)
    const mutualIds = new Set();
    currentUser.connections.forEach(conn => {
      (conn.connections || []).forEach(id => {
        const idStr = id.toString();
        if (!excludedIds.includes(idStr)) {
          mutualIds.add(idStr);
        }
      });
    });

    const mutualUsers = await User.find({
      _id: { $in: Array.from(mutualIds) },
      role: 'user'
    }).select('name avatar bio role');

    // Find All other users
    const allOtherUsers = await User.find({
      _id: { $nin: [...excludedIds, ...Array.from(mutualIds)] },
      role: 'user'
    }).select('name avatar bio role').limit(20);

    res.json({
      suggested: mutualUsers,
      all: allOtherUsers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('joinedEvents', 'title date location status participants')
      .populate({
        path: 'createdEvents',
        select: 'title date location status participants registrationLimit isApproved isRejected',
        populate: {
          path: 'participants',
          select: 'name avatar role bio'
        }
      })
      .populate('followers', 'name avatar role bio')
      .populate('following', 'name avatar role bio')
      .populate('connections', 'name avatar role bio');

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all notifications
// @route   GET /api/users/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'name avatar role')
      .populate('event', 'title')
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/users/notifications/read-all
// @access  Private
const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get networking notifications count
// @route   GET /api/users/notifications/networking/count
// @access  Private
const getNetworkingNotificationsCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
      type: { $in: ['connection_request', 'new_follower', 'connection_accepted', 'connection_rejected'] }
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark networking notifications as read
// @route   PUT /api/users/notifications/networking/read
// @access  Private
const markNetworkingNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { 
        recipient: req.user._id, 
        isRead: false,
        type: { $in: ['connection_request', 'new_follower', 'connection_accepted', 'connection_rejected'] }
      },
      { isRead: true }
    );
    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle block user
// @route   POST /api/users/:id/block
// @access  Private
const toggleBlockUser = async (req, res) => {
  try {
    const userToBlock = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!userToBlock) return res.status(404).json({ message: 'User not found' });

    if (currentUser.blockedUsers.includes(userToBlock._id)) {
      currentUser.blockedUsers = currentUser.blockedUsers.filter(id => id.toString() !== userToBlock._id.toString());
    } else {
      currentUser.blockedUsers.push(userToBlock._id);
      // Remove from following/followers/connections if blocked
      currentUser.following = currentUser.following.filter(id => id.toString() !== userToBlock._id.toString());
      currentUser.followers = currentUser.followers.filter(id => id.toString() !== userToBlock._id.toString());
      currentUser.connections = currentUser.connections.filter(id => id.toString() !== userToBlock._id.toString());
      userToBlock.following = userToBlock.following.filter(id => id.toString() !== currentUser._id.toString());
      userToBlock.followers = userToBlock.followers.filter(id => id.toString() !== currentUser._id.toString());
      userToBlock.connections = userToBlock.connections.filter(id => id.toString() !== currentUser._id.toString());
      await userToBlock.save();
    }

    await currentUser.save();
    res.json({ blockedUsers: currentUser.blockedUsers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle mute user
// @route   POST /api/users/:id/mute
// @access  Private
const toggleMuteUser = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    if (currentUser.mutedUsers.includes(req.params.id)) {
      currentUser.mutedUsers = currentUser.mutedUsers.filter(id => id.toString() !== req.params.id);
    } else {
      currentUser.mutedUsers.push(req.params.id);
    }
    await currentUser.save();
    res.json({ mutedUsers: currentUser.mutedUsers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle close friend
// @route   POST /api/users/:id/close-friend
// @access  Private
const toggleCloseFriend = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    if (currentUser.closeFriends.includes(req.params.id)) {
      currentUser.closeFriends = currentUser.closeFriends.filter(id => id.toString() !== req.params.id);
    } else {
      currentUser.closeFriends.push(req.params.id);
    }
    await currentUser.save();
    res.json({ closeFriends: currentUser.closeFriends });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUserProfile,
  updateMyProfile,
  uploadAvatar,
  getUsers,
  deleteUser,
  updateUser,
  followUser,
  requestConnection,
  handleConnectionRequest,
  getSuggestedUsers,
  getUserById,
  getNetworkingNotificationsCount,
  markNetworkingNotificationsRead,
  getNotifications,
  markAllNotificationsRead,
  toggleBlockUser,
  toggleMuteUser,
  toggleCloseFriend
};
