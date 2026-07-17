import { Schema, model } from 'mongoose';
import type { ISupportTicket } from '../types/models';

const ticketMessageSchema = new Schema({
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const supportTicketSchema = new Schema<ISupportTicket>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  ticketNumber: { type: String, required: true, unique: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['technical', 'billing', 'sales', 'general'], default: 'general' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: { type: String, enum: ['open', 'in-progress', 'resolved', 'closed'], default: 'open' },
  messages: [ticketMessageSchema],
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

const SupportTicket = model<ISupportTicket>('SupportTicket', supportTicketSchema);
export default SupportTicket;
