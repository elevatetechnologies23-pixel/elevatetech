import { Schema, model } from 'mongoose';
import type { IBanner } from '../types/models';

const bannerSchema = new Schema<IBanner>({
  title: { type: String, required: true },
  subtitle: String,
  imageUrl: { type: String, required: true },
  linkUrl: String,
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

const Banner = model<IBanner>('Banner', bannerSchema);
export default Banner;
