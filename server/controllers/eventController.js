const Event = require('../models/Event');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create an event
// @route   POST /api/events
// @access  Private (Coordinator/Admin only)
const createEvent = async (req, res) => {
  try {
    const { title, description, type, location, date, endDate, time, endTime, registrationLimit, registrationCloseDate, isApprovalRequired, isPaid, price, requiredSkills, roadmap, contactPerson, contactEmail, contactPhone } = req.body;
    const fs = require('fs');
    const path = require('path');
    const logPath = path.join(__dirname, '../debug_log.txt');
    fs.appendFileSync(logPath, `\n--- ${new Date().toISOString()} ---\nTITLE: ${title}\nBODY: ${JSON.stringify(req.body, null, 2)}\n`);
    console.log('--- CREATE EVENT REQUEST BODY ---');
    console.log(req.body);
    console.log('---------------------------------');

    let parsedSkills = [];
    if (requiredSkills) {
      try {
        parsedSkills = typeof requiredSkills === 'string' ? JSON.parse(requiredSkills) : requiredSkills;
      } catch (e) {
        parsedSkills = typeof requiredSkills === 'string' ? requiredSkills.split(',').map(s => s.trim()) : requiredSkills;
      }
    }

    const event = await Event.create({
      title,
      description,
      coordinator: req.user._id,
      type,
      location,
      date,
      endDate,
      time,
      endTime,
      coverMedia: req.file ? req.file.path.replace(/\\/g, '/') : '',
      registrationLimit: registrationLimit ? parseInt(registrationLimit) : 0,
      registrationCloseDate: registrationCloseDate ? new Date(registrationCloseDate) : null,
      isApprovalRequired: isApprovalRequired === 'true' || isApprovalRequired === true,
      isPaid: isPaid === 'true' || isPaid === true,
      price: price ? parseInt(price) : 0,
      requiredSkills: parsedSkills,
      roadmap: typeof roadmap === 'string' ? JSON.parse(roadmap) : roadmap,
      contactPerson,
      contactEmail,
      contactPhone
    });

    // Add event to coordinator's createdEvents
    await User.findByIdAndUpdate(req.user._id, { $push: { createdEvents: event._id } });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all events
// @route   GET /api/events
// @access  Private
const getEvents = async (req, res) => {
  try {
      const events = await Event.find({ isRejected: { $ne: true } })
        .populate('coordinator', 'name email avatar')
        .sort({ createdAt: -1 }); // Sort by newly created first

    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Private
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('coordinator', 'name email avatar')
      .populate('participants', 'name avatar email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private (Coordinator/Admin only)
const updateEvent = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if the user is the coordinator or admin
    if (event.coordinator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }

    const { title, description, type, location, date, endDate, time, endTime, registrationLimit, registrationCloseDate, isApprovalRequired, isPaid, price, requiredSkills, roadmap, contactPerson, contactEmail, contactPhone } = req.body;
    console.log('--- UPDATE EVENT REQUEST BODY ---');
    console.log(req.body);
    console.log('---------------------------------');

    let parsedSkills = event.requiredSkills;
    if (requiredSkills) {
      try {
        parsedSkills = typeof requiredSkills === 'string' ? JSON.parse(requiredSkills) : requiredSkills;
      } catch (e) {
        parsedSkills = typeof requiredSkills === 'string' ? requiredSkills.split(',').map(s => s.trim()) : requiredSkills;
      }
    }

    // Construct update object
    const updatedData = {
      title: title || event.title,
      description: description || event.description,
      type: type || event.type,
      location: location || event.location,
      date: date || event.date,
      endDate: endDate !== undefined ? endDate : event.endDate,
      time: time || event.time,
      endTime: endTime !== undefined ? endTime : event.endTime,
      registrationLimit: registrationLimit !== undefined ? (registrationLimit ? parseInt(registrationLimit) : 0) : event.registrationLimit,
      registrationCloseDate: registrationCloseDate ? new Date(registrationCloseDate) : event.registrationCloseDate,
      isApprovalRequired: isApprovalRequired !== undefined ? (isApprovalRequired === 'true' || isApprovalRequired === true) : event.isApprovalRequired,
      isPaid: isPaid !== undefined ? (isPaid === 'true' || isPaid === true) : event.isPaid,
      price: price !== undefined ? (price ? parseInt(price) : 0) : event.price,
      requiredSkills: parsedSkills,
      roadmap: roadmap !== undefined ? (typeof roadmap === 'string' ? JSON.parse(roadmap) : roadmap) : event.roadmap,
      contactPerson: contactPerson !== undefined ? contactPerson : event.contactPerson,
      contactEmail: contactEmail !== undefined ? contactEmail : event.contactEmail,
      contactPhone: contactPhone !== undefined ? contactPhone : event.contactPhone
    };

    if (req.file) {
      updatedData.coverMedia = req.file.path.replace(/\\/g, '/');
    }

    event = await Event.findByIdAndUpdate(req.params.id, updatedData, { new: true });

    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Enroll in an event
// @route   POST /api/events/:id/enroll
// @access  Private
const enrollEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    const user = await User.findById(req.user._id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.isRejected) {
      return res.status(400).json({ message: 'Cannot join a rejected event' });
    }

    // Check registration deadline
    if (event.registrationCloseDate && new Date() > new Date(event.registrationCloseDate)) {
      return res.status(400).json({ message: 'Registration for this event has closed' });
    }

    if (event.participants.includes(req.user._id)) {
      return res.status(400).json({ message: 'You are already enrolled in this event' });
    }

    // Add user to event participants
    event.participants.push(req.user._id);
    await event.save();

    // Add event to user's joined events
    user.joinedEvents.push(event._id);
    await user.save();

    // Create notification to track join timestamp for activity feed
    await Notification.create({
      sender: req.user._id,
      recipient: req.user._id, // self-notification to track the action
      type: 'event_joined',
      event: event._id
    });

    res.status(200).json({ message: 'Successfully enrolled in event' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get participants for an event
// @route   GET /api/events/:id/participants
// @access  Private (Coordinator of the event only, or Admin)
const getEventParticipants = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('participants', 'name email avatar skills');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if the user requesting is the coordinator of this event or an admin
    if (event.coordinator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view participants for this event' });
    }

    res.status(200).json(event.participants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add announcement to an event
// @route   POST /api/events/:id/announcements
// @access  Private (Coordinator of the event only)
const addAnnouncement = async (req, res) => {
  try {
    const { title, url } = req.body; // Can be used for links or just text announcements in resources
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.coordinator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Reusing the resources field for announcements for now based on schema
    event.resources.push({ title, url });
    await event.save();

    res.status(200).json(event.resources);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve an event (Admin moderation)
// @route   PUT /api/events/:id/approve
// @access  Private (Admin only)
const approveEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    event.isApproved = true;
    await event.save();

    res.status(200).json({ message: 'Event approved successfully', event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an event (Admin moderation)
// @route   DELETE /api/events/:id
// @access  Private (Admin or Coordinator)
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if the user is the coordinator or admin
    if (event.coordinator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    await Event.findByIdAndDelete(req.params.id);

    // Remove event from coordinator's createdEvents
    await User.findByIdAndUpdate(event.coordinator, { $pull: { createdEvents: event._id } });

    res.status(200).json({ message: 'Event removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send notification to event participants
// @route   POST /api/events/:id/notify
// @access  Private (Coordinator of the event only)
const sendEventNotification = async (req, res) => {
  try {
    const { message } = req.body;
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if the user is the coordinator
    if (event.coordinator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to send notifications for this event' });
    }

    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Get event participants
    const participants = event.participants || [];

    if (participants.length === 0) {
      return res.status(400).json({ message: 'No participants in this event' });
    }

    // Create notifications for each participant
    const notifications = participants.map(participantId => ({
      recipient: participantId,
      sender: req.user._id,
      type: 'event_announcement',
      event: event._id,
      message: message
    }));

    await Notification.insertMany(notifications);
    
    // Also save to event resources so it shows in the Announcements tab
    event.resources.push({
      title: message,
      url: ''
    });
    await event.save();

    res.status(200).json({ message: `Notification sent to ${participants.length} participants` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove a participant from an event
// @route   DELETE /api/events/:eventId/participants/:participantId
// @access  Private (Coordinator of the event only)
const removeParticipant = async (req, res) => {
  try {
    const { eventId, participantId } = req.params;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if the user is the coordinator
    if (event.coordinator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to remove participants from this event' });
    }

    // Check if participant is in the event
    if (!event.participants.includes(participantId)) {
      return res.status(400).json({ message: 'Participant not found in this event' });
    }

    // Remove participant from event
    event.participants = event.participants.filter(p => p.toString() !== participantId);
    await event.save();

    // Remove event from user's joined events
    await User.findByIdAndUpdate(participantId, { $pull: { joinedEvents: eventId } });

    res.status(200).json({ message: 'Participant removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  enrollEvent,
  getEventParticipants,
  addAnnouncement,
  approveEvent,
  deleteEvent,
  sendEventNotification,
  removeParticipant
};
