import { Schema, model } from 'mongoose';
import type { INotification } from '../types/models';

const notificationSchema = new Schema<INotification>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  linkUrl: String
}, {
  timestamps: true
});

const Notification = model<INotification>('Notification', notificationSchema);
export default Notification;
