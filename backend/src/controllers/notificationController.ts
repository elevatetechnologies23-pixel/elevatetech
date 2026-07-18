import { Request, Response, NextFunction } from 'express';
import Notification from '../models/Notification';
import { notificationEvents } from '../utils/notifications';

// GET /api/v1/notifications - get all notifications for logged-in user
export const getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const notifications = await Notification.find({ user: req.user?._id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    const unreadCount = await Notification.countDocuments({ user: req.user?._id, isRead: false });

    res.status(200).json({
      status: 'success',
      data: notifications,
      unreadCount
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/notifications/mark-all-read
export const markAllRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await Notification.updateMany({ user: req.user?._id, isRead: false }, { isRead: true });
    res.status(200).json({ status: 'success', message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/notifications/:id/read
export const markOneRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.status(200).json({ status: 'success' });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/notifications/stream - Server-Sent Events stream
export const streamNotifications = (req: Request, res: Response): void => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const userId = req.user?._id;
  const eventName = `new-notification-${userId}`;

  // Keep connection alive with a ping comment every 20 seconds
  const keepAliveInterval = setInterval(() => {
    res.write(': ping\n\n');
  }, 20000);

  const listener = (notification: any) => {
    res.write(`data: ${JSON.stringify(notification)}\n\n`);
  };

  notificationEvents.on(eventName, listener);

  req.on('close', () => {
    clearInterval(keepAliveInterval);
    notificationEvents.off(eventName, listener);
    res.end();
  });
};
