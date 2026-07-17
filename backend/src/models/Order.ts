import { Schema, model } from 'mongoose';
import type { IOrder } from '../types/models';

const orderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true }, // unit price excluding GST
  gstAmount: { type: Number, required: true }, // total GST for line
  totalPrice: { type: Number, required: true }, // final line price including GST
  sku: { type: String, required: true },
  variantName: String
}, { _id: false });

const orderSchema = new Schema<IOrder>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  orderNumber: { type: String, required: true, unique: true },
  items: [orderItemSchema],
  subTotal: { type: Number, required: true },
  gstTotal: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  couponApplied: String,
  shippingCharge: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true }
  },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  paymentMethod: { type: String, enum: ['upi', 'card', 'cod', 'netbanking'], required: true },
  paymentDetails: {
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    paidAt: Date
  },
  orderStatus: { 
    type: String, 
    enum: ['placed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'], 
    default: 'placed' 
  },
  invoiceNumber: String,
  invoiceUrl: String,
  email: String,
  phoneNumber: String,
  notes: String,
  cancellationReason: String
}, {
  timestamps: true
});

const Order = model<IOrder>('Order', orderSchema);
export default Order;
export { orderSchema };
