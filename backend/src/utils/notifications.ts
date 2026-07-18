import { EventEmitter } from 'events';
import User from '../models/User';
import Notification from '../models/Notification';

export const notificationEvents = new EventEmitter();

export const notifyAdmins = async (title: string, message: string, linkUrl?: string) => {
  try {
    const admins = await User.find({ role: 'admin' });
    const notificationPromises = admins.map(async (admin) => {
      const notif = await Notification.create({
        user: admin._id,
        title,
        message,
        linkUrl
      });
      // Emit event for this specific admin
      notificationEvents.emit(`new-notification-${admin._id}`, notif);
      return notif;
    });
    await Promise.all(notificationPromises);
  } catch (error) {
    console.error('Failed to notify admins:', error);
  }
};

export const notifyUser = async (userId: any, title: string, message: string, linkUrl?: string) => {
  try {
    const notif = await Notification.create({
      user: userId,
      title,
      message,
      linkUrl
    });
    // Emit event for this specific user
    notificationEvents.emit(`new-notification-${userId}`, notif);
    return notif;
  } catch (error) {
    console.error(`Failed to notify user ${userId}:`, error);
    return null;
  }
};
