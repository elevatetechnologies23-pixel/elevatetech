import { Schema, model } from 'mongoose';
import type { ILicense } from '../types/models';

const licenseSchema = new Schema<ILicense>({
  licenseKey: { type: String, required: true, unique: true },
  productName: { type: String, required: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  maxActivations: { type: Number, default: 1 },
  activeActivations: { type: Number, default: 0 },
  macAddresses: [{ type: String }],
  status: { type: String, enum: ['active', 'suspended', 'expired'], default: 'active' },
  validUntil: { type: Date, required: true }
}, {
  timestamps: true
});

const License = model<ILicense>('License', licenseSchema);
export default License;
