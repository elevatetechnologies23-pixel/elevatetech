import { Schema, model } from 'mongoose';
import type { IBlog } from '../types/models';

const blogSchema = new Schema<IBlog>({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  content: { type: String, required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tags: [{ type: String }],
  imageUrl: String,
  isPublished: { type: Boolean, default: false }
}, {
  timestamps: true
});

const Blog = model<IBlog>('Blog', blogSchema);
export default Blog;
