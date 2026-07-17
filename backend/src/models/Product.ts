import { Schema, model } from 'mongoose';
import type { IProduct } from '../types/models';

const specificationSchema = new Schema({
  name: { type: String, required: true },
  value: { type: String, required: true }
}, { _id: false });

const variantSchema = new Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 }
}, { _id: false });

const productSchema = new Schema<IProduct>({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  sku: { type: String, required: true, unique: true },
  modelNumber: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
  basePrice: { type: Number, required: true },
  gstPercentage: { type: Number, required: true, default: 18 }, // Standard electronics GST is 18%
  stock: { type: Number, required: true, default: 0 },
  images: [{ type: String }],
  videoUrl: String,
  variants: [variantSchema],
  specifications: [specificationSchema],
  warrantyMonths: { type: Number, default: 12 },
  accessoriesIncluded: [{ type: String }],
  ratingsAverage: { type: Number, default: 0, min: 0, max: 5 },
  ratingsQuantity: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'draft', 'archived'], default: 'active' },
  isFeatured: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false }
}, {
  timestamps: true
});

const Product = model<IProduct>('Product', productSchema);
export default Product;
export { productSchema };
