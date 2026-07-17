import { Schema, model } from 'mongoose';
import type { IBrand } from '../types/models';

const brandSchema = new Schema<IBrand>({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  logoUrl: String,
  description: String
}, {
  timestamps: true
});

const Brand = model<IBrand>('Brand', brandSchema);
export default Brand;
