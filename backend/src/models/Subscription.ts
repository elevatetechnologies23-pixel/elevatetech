import { Schema, model } from 'mongoose';
import type { ISubscription } from '../types/models';

const subscriptionSchema = new Schema<ISubscription>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  license: { type: Schema.Types.ObjectId, ref: 'License', required: true },
  planName: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  price: { type: Number, required: true },
  status: { type: String, enum: ['active', 'cancelled', 'expired'], default: 'active' }
}, {
  timestamps: true
});

const Subscription = model<ISubscription>('Subscription', subscriptionSchema);
export default Subscription;
