import { Schema, model } from 'mongoose';
import type { ICoupon } from '../types/models';

const couponSchema = new Schema<ICoupon>({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true },
  minPurchase: Number,
  maxDiscount: Number,
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  usageLimit: Number,
  usageCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

const Coupon = model<ICoupon>('Coupon', couponSchema);
export default Coupon;
