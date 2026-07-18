import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog';
import Banner from '../models/Banner';
import Blog from '../models/Blog';
import Brand from '../models/Brand';
import Category from '../models/Category';
import Coupon from '../models/Coupon';
import License from '../models/License';
import Notification from '../models/Notification';
import Order from '../models/Order';
import Product from '../models/Product';
import Review from '../models/Review';
import Settings from '../models/Settings';
import Subscription from '../models/Subscription';
import SupportTicket from '../models/SupportTicket';
import User from '../models/User';

// Load Env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/enterprise-electronics';

const cleanDatabase = async () => {
  try {
    console.log('Connecting to database for cleanup... 🔌');
    await mongoose.connect(dbUri);
    console.log('Connected! Wiping all collections permanently... 🧹');

    // Delete documents from all collections
    const collections = [
      { name: 'AuditLog', model: AuditLog },
      { name: 'Banner', model: Banner },
      { name: 'Blog', model: Blog },
      { name: 'Brand', model: Brand },
      { name: 'Category', model: Category },
      { name: 'Coupon', model: Coupon },
      { name: 'License', model: License },
      { name: 'Notification', model: Notification },
      { name: 'Order', model: Order },
      { name: 'Product', model: Product },
      { name: 'Review', model: Review },
      { name: 'Settings', model: Settings },
      { name: 'Subscription', model: Subscription },
      { name: 'SupportTicket', model: SupportTicket },
      { name: 'User', model: User }
    ];

    for (const col of collections) {
      console.log(`Clearing collection: ${col.name}...`);
      await (col.model as any).deleteMany({});
    }

    console.log('✅ Database successfully cleared! All tables are empty.');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error: any) {
    console.error('💥 Error clearing database: ', error.message);
    process.exit(1);
  }
};

cleanDatabase();
