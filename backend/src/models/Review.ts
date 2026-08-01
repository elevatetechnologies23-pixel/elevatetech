import { Schema, model } from 'mongoose';
import type { IReview } from '../types/models';

const reviewSchema = new Schema<IReview>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: false },
  name: { type: String, default: '' },
  designation: { type: String, default: '' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  isFeatured: { type: Boolean, default: true }
}, {
  timestamps: true
});

const Review = model<IReview>('Review', reviewSchema);
export default Review;
