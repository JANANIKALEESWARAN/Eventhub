const User = require('../models/User');
const Event = require('../models/Event');
const Report = require('../models/Report');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// @desc    Admin login
// @route   POST /api/admin/login
// @access  Public
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get admin stats
// @route   GET /api/admin/stats
// @access  Private (Admin only)
const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalEvents = await Event.countDocuments();
    const pendingEvents = await Event.countDocuments({ isApproved: false, isRejected: false });
    const coordinators = await User.countDocuments({ role: 'coordinator' });

    res.json({
      users: totalUsers,
      events: totalEvents,
      pendingEvents,
      coordinators
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user (Admin moderation)
// @route   PUT /api/admin/users/:id
// @access  Private (Admin only)
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Cannot delete another admin for safety
    if (user.role === 'admin' && req.user._id.toString() !== user._id.toString()) {
      return res.status(400).json({ message: 'Cannot modify other admin users' });
    }

    const { name, email, role, bio, skills, location, education } = req.body;

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (bio) user.bio = bio;
    if (skills) user.skills = skills;
    if (location) user.location = location;
    if (education) user.education = education;

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user (Admin moderation)
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Cannot delete another admin for safety
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin users' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get pending events
// @route   GET /api/admin/events/pending
// @access  Private (Admin only)
const getPendingEvents = async (req, res) => {
  try {
    const events = await Event.find({ isApproved: false, isRejected: false })
      .populate('coordinator', 'name email')
      .sort({ createdAt: -1 });

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all events
// @route   GET /api/admin/events
// @access  Private (Admin only)
const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate('coordinator', 'name email')
      .sort({ createdAt: -1 });

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve event
// @route   PUT /api/admin/events/:id/approve
// @access  Private (Admin only)
const approveEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    event.isApproved = true;
    event.updatedAt = Date.now();
    await event.save();

    res.json({ message: 'Event approved successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject/Delete event
// @route   DELETE /api/admin/events/:id/reject
// @access  Private (Admin only)
const rejectEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    event.isRejected = true;
    event.updatedAt = Date.now();
    await event.save();

    res.json({ message: 'Event rejected successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all reports
// @route   GET /api/admin/reports
// @access  Private (Admin only)
const getAllReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('reporter', 'name email')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update report status
// @route   PUT /api/admin/reports/:id
// @access  Private (Admin only)
const updateReportStatus = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const { status } = req.body;
    report.status = status;
    await report.save();

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get system health
// @route   GET /api/admin/health
// @access  Private (Admin only)
const getSystemHealth = async (req, res) => {
  try {
    const health = {
      status: 'Stable',
      db: 'Connected',
      uptime: process.uptime(),
      memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
    };
    res.json(health);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  adminLogin,
  getAdminStats,
  getAllUsers,
  updateUser,
  deleteUser,
  getPendingEvents,
  getAllEvents,
  approveEvent,
  rejectEvent,
  getAllReports,
  updateReportStatus,
  getSystemHealth
};
