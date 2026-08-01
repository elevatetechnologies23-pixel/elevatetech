import { Schema, model } from 'mongoose';
import type { IVideo } from '../types/models';

const videoSchema = new Schema<IVideo>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    videoUrl: { type: String, required: true, trim: true },
    thumbnailUrl: { type: String, default: '' },
    category: { type: String, default: 'Product Demo' },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 1 }
  },
  { timestamps: true }
);

const Video = model<IVideo>('Video', videoSchema);
export default Video;
