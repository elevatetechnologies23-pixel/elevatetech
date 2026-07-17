import { Document, Model, Types } from 'mongoose';

// User & Address types
export interface IAddress {
  _id?: Types.ObjectId;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role: 'customer' | 'admin' | 'employee';
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpire?: Date;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  refreshToken?: string;
  savedAddresses: IAddress[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export type UserModel = Model<IUser, {}, IUserMethods>;

// Category and Brand types
export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  parentId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBrand extends Document {
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Product specs & variant types
export interface ISpecification {
  name: string; // e.g., 'Processor'
  value: string; // e.g., 'Core i7'
}

export interface IVariant {
  name: string; // e.g., '16GB RAM / 512GB SSD'
  sku: string;
  price: number;
  stock: number;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  sku: string;
  modelNumber: string;
  description: string;
  category: Types.ObjectId;
  brand: Types.ObjectId;
  basePrice: number;
  gstPercentage: number;
  stock: number;
  images: string[];
  videoUrl?: string;
  variants: IVariant[];
  specifications: ISpecification[];
  warrantyMonths: number;
  accessoriesIncluded: string[];
  ratingsAverage: number;
  ratingsQuantity: number;
  status: 'active' | 'draft' | 'archived';
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Coupon types
export interface ICoupon extends Document {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase?: number;
  maxDiscount?: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  usageLimit?: number;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Order & Order Item types
export interface IOrderItem {
  product: Types.ObjectId;
  name: string;
  quantity: number;
  price: number; // Price per unit excluding GST
  gstAmount: number; // GST for this line item
  totalPrice: number; // Final price including GST
  sku: string;
  variantName?: string;
}

export interface IOrder extends Document {
  user: Types.ObjectId;
  orderNumber: string;
  items: IOrderItem[];
  subTotal: number; // Excluding tax and discounts
  gstTotal: number; // Total GST collected
  discountAmount: number;
  couponApplied?: string;
  shippingCharge: number;
  grandTotal: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'upi' | 'card' | 'cod' | 'netbanking';
  paymentDetails?: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    paidAt?: Date;
  };
  orderStatus: 'placed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  invoiceNumber?: string;
  invoiceUrl?: string;
  email?: string;
  phoneNumber?: string;
  notes?: string;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Reviews types
export interface IReview extends Document {
  user: Types.ObjectId;
  product: Types.ObjectId;
  rating: number; // 1-5
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

// Billing Software license key types
export interface ILicense extends Document {
  licenseKey: string;
  productName: string; // "Enterprise Billing Standard", etc.
  assignedTo: Types.ObjectId; // User ID
  orderId: Types.ObjectId;
  maxActivations: number;
  activeActivations: number;
  macAddresses: string[];
  status: 'active' | 'suspended' | 'expired';
  validUntil: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Subscription plans types
export interface ISubscription extends Document {
  user: Types.ObjectId;
  license: Types.ObjectId;
  planName: string; // 'monthly' | 'yearly' | 'lifetime'
  startDate: Date;
  endDate: Date;
  price: number;
  status: 'active' | 'cancelled' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

// Support Tickets types
export interface ITicketMessage {
  sender: Types.ObjectId; // User ID
  message: string;
  createdAt: Date;
}

export interface ISupportTicket extends Document {
  user: Types.ObjectId;
  ticketNumber: string;
  subject: string;
  description: string;
  category: 'technical' | 'billing' | 'sales' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  messages: ITicketMessage[];
  assignedTo?: Types.ObjectId; // Employee or Admin ID
  createdAt: Date;
  updatedAt: Date;
}

// Blog types
export interface IBlog extends Document {
  title: string;
  slug: string;
  content: string;
  author: Types.ObjectId;
  tags: string[];
  imageUrl?: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Settings model
export interface ISettings extends Document {
  key: string;
  value: any;
  createdAt: Date;
  updatedAt: Date;
}

// Audit Logs model
export interface IAuditLog extends Document {
  user?: Types.ObjectId;
  action: string; // e.g. "PRODUCT_CREATE", "USER_LOGIN"
  details: string; // descriptive JSON or string
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// Banner models
export interface IBanner extends Document {
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  order: number;
  isActive: boolean;
}

// Notification models
export interface INotification extends Document {
  user: Types.ObjectId;
  title: string;
  message: string;
  isRead: boolean;
  linkUrl?: string;
  createdAt: Date;
}
