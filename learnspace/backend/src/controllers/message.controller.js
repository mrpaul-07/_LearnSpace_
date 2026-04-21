// ============================================================
// LearnSpace - Messaging Controller
// Student <-> Instructor direct messaging.
// Students can message any instructor whose course they're enrolled in.
// Instructors can message any student enrolled in their courses.
// ============================================================
const mongoose = require('mongoose');
const { Message, User, Course, Enrollment } = require('../models');
const logger = require('../utils/logger');

const isValidId = (id) => typeof id === 'string' && mongoose.Types.ObjectId.isValid(id);

// Can `sender` message `receiver`? Returns true if they share any enrollment.
const canMessage = async (senderId, receiverId) => {
  if (String(senderId) === String(receiverId)) return false;

  // Check all courses where sender is instructor and receiver is enrolled
  const senderAsInstructor = await Course.find({ instructor_id: senderId }).select('_id');
  const senderCourseIds = senderAsInstructor.map(c => c._id);

  const enrollmentExists1 = await Enrollment.findOne({
    student_id: receiverId,
    course_id: { $in: senderCourseIds }
  });
  if (enrollmentExists1) return true;

  // Or sender is enrolled in a course receiver teaches
  const receiverAsInstructor = await Course.find({ instructor_id: receiverId }).select('_id');
  const receiverCourseIds = receiverAsInstructor.map(c => c._id);

  const enrollmentExists2 = await Enrollment.findOne({
    student_id: senderId,
    course_id: { $in: receiverCourseIds }
  });
  return Boolean(enrollmentExists2);
};

// POST /api/messages
// Body: { receiver_id, content, course_id? }
const sendMessage = async (req, res) => {
  try {
    const { receiver_id, content, course_id } = req.body;
    const sender_id = req.user.id;

    if (!isValidId(receiver_id)) {
      return res.status(400).json({ success: false, message: 'Invalid receiver id.' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required.' });
    }

    // Admin can message anyone
    if (req.user.role !== 'admin') {
      const allowed = await canMessage(sender_id, receiver_id);
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: 'You can only message instructors of courses you are enrolled in (or vice versa).'
        });
      }
    }

    const message = await Message.create({
      sender_id,
      receiver_id,
      course_id: course_id && isValidId(course_id) ? course_id : null,
      content: content.trim()
    });

    const populated = await Message.findById(message._id)
      .populate('sender_id', 'name avatar role')
      .populate('receiver_id', 'name avatar role');

    res.status(201).json({ success: true, data: { message: populated } });
  } catch (error) {
    logger.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
};

// GET /api/messages/conversations
// List of people the user has chatted with, plus latest message + unread count
const listConversations = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const convs = await Message.aggregate([
      { $match: { $or: [{ sender_id: userId }, { receiver_id: userId }] } },
      {
        $addFields: {
          partner: {
            $cond: [{ $eq: ['$sender_id', userId] }, '$receiver_id', '$sender_id']
          }
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$partner',
          last_message: { $first: '$$ROOT' },
          unread: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$receiver_id', userId] }, { $eq: ['$is_read', false] }] },
                1, 0
              ]
            }
          }
        }
      },
      { $sort: { 'last_message.createdAt': -1 } },
      { $limit: 50 }
    ]);

    // Populate partner user info
    const partnerIds = convs.map(c => c._id);
    const users = await User.find({ _id: { $in: partnerIds } })
      .select('name avatar role')
      .lean();
    const userMap = Object.fromEntries(users.map(u => [String(u._id), u]));

    const conversations = convs.map(c => ({
      partner: userMap[String(c._id)] || { _id: c._id, name: 'Unknown', role: '' },
      last_message: c.last_message,
      unread: c.unread
    }));

    res.json({ success: true, data: { conversations } });
  } catch (error) {
    logger.error('List conversations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch conversations.' });
  }
};

// GET /api/messages/thread/:userId
// Full conversation with a specific user, and mark as read
const getThread = async (req, res) => {
  try {
    const otherId = req.params.userId;
    const me = req.user.id;

    if (!isValidId(otherId)) {
      return res.status(400).json({ success: false, message: 'Invalid user id.' });
    }

    const messages = await Message.find({
      $or: [
        { sender_id: me, receiver_id: otherId },
        { sender_id: otherId, receiver_id: me }
      ]
    })
      .populate('sender_id', 'name avatar role')
      .sort({ createdAt: 1 })
      .limit(200);

    // Mark messages TO me as read
    await Message.updateMany(
      { sender_id: otherId, receiver_id: me, is_read: false },
      { is_read: true }
    );

    res.json({ success: true, data: { messages } });
  } catch (error) {
    logger.error('Get thread error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch thread.' });
  }
};

// GET /api/messages/unread-count
const getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({ receiver_id: req.user.id, is_read: false });
    res.json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch unread count.' });
  }
};

module.exports = { sendMessage, listConversations, getThread, getUnreadCount };
