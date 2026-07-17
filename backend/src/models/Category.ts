import { Schema, model } from 'mongoose';
import type { ICategory } from '../types/models';

const categorySchema = new Schema<ICategory>({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: String,
  parentId: { type: Schema.Types.ObjectId, ref: 'Category', default: null }
}, {
  timestamps: true
});

const Category = model<ICategory>('Category', categorySchema);
export default Category;
