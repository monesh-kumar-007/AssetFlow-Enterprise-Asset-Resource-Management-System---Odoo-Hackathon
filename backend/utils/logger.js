const { ActivityLog, Notification } = require('../models');

// Helper to log user/system activities
const logActivity = async ({ userId, action, targetType, targetId, details }) => {
  try {
    await ActivityLog.create({
      userId,
      action,
      targetType,
      targetId: String(targetId),
      details,
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

// Helper to create notifications for a user
const createNotification = async ({ userId, message, type }) => {
  try {
    await Notification.create({
      userId,
      message,
      type,
      read: false,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

module.exports = {
  logActivity,
  createNotification,
};
