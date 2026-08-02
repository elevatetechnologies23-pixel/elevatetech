import { Schema, model, Document } from 'mongoose';

export interface IDemoBooking extends Document {
  name: string;
  email: string;
  phone: string;
  companyName: string;
  productInterest: string; // 'Billing Software' | 'CCTV Surveillance' | 'Laptops & Workstations' | 'Server & Networking'
  preferredDate: string;
  preferredTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  meetingLink?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const demoBookingSchema = new Schema<IDemoBooking>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  companyName: { type: String, default: '' },
  productInterest: { type: String, default: 'POS Billing Software' },
  preferredDate: { type: String, required: true },
  preferredTime: { type: String, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
  meetingLink: { type: String, default: '' },
  notes: { type: String, default: '' }
}, {
  timestamps: true
});

const DemoBooking = model<IDemoBooking>('DemoBooking', demoBookingSchema);
export default DemoBooking;
