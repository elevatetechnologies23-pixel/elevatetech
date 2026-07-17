import User from '../models/User';
import Notification from '../models/Notification';

export const notifyAdmins = async (title: string, message: string, linkUrl?: string) => {
  try {
    const admins = await User.find({ role: 'admin' });
    const notificationPromises = admins.map(admin => {
      return Notification.create({
        user: admin._id,
        title,
        message,
        linkUrl
      });
    });
    await Promise.all(notificationPromises);
  } catch (error) {
    console.error('Failed to notify admins:', error);
  }
};
