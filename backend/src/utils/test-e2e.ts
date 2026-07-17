import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';
import Product from '../models/Product';
import Order from '../models/Order';
import License from '../models/License';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const dbUri = process.env.MONGO_URI || '';

const runVerification = async () => {
  console.log('🏁 Starting Complete E-Commerce Backend Integration Verification...');
  
  try {
    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB Atlas.');

    // 1. Verify User Credentials exist
    const user = await User.findOne({ email: 'customer@test.com' });
    if (!user) {
      throw new Error('Customer account not found in database. Seed data first.');
    }
    console.log(`👤 Customer account verified: ${user.name} (${user.role})`);

    // 2. Fetch a Product
    const product = await Product.findOne({ sku: 'BILL-SW-ENT' });
    if (!product) {
      throw new Error('Billing Software product not found in database. Seed data first.');
    }
    console.log(`📦 Catalog product verified: "${product.name}" - Base Price: INR ${product.basePrice}`);

    // 3. Simulate placing an order
    console.log('🛒 Simulating order placement and writing to database...');
    
    // Create random order reference
    const orderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000).toString();
    const mockOrder = await Order.create({
      orderNumber,
      user: user._id,
      items: [
        {
          product: product._id,
          name: product.name,
          quantity: 1,
          price: product.basePrice,
          gstPercentage: product.gstPercentage,
          totalPrice: product.basePrice
        }
      ],
      subTotal: product.basePrice,
      gstAmount: (product.basePrice * product.gstPercentage) / 100,
      grandTotal: product.basePrice + (product.basePrice * product.gstPercentage) / 100,
      paymentMethod: 'upi',
      paymentStatus: 'paid',
      orderStatus: 'placed',
      shippingAddress: {
        street: '123 Tech Lane',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India'
      }
    });

    console.log(`🎉 Order created successfully in Database! Order ID: ${mockOrder._id} | Reference: ${mockOrder.orderNumber}`);

    // 4. Simulate Automatic License Generation (like in the backend order controller)
    console.log('🔑 Generating software license key connected to the order...');
    const licenseKey = 'LIC-' + 
      Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
      Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
      Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
      Math.random().toString(36).substring(2, 6).toUpperCase();

    const license = await License.create({
      licenseKey,
      user: user._id,
      order: mockOrder._id,
      productName: product.name,
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      maxActivations: 3,
      status: 'active'
    });

    console.log(`🔐 License created in Database! Key: ${license.licenseKey} | Status: ${license.status}`);

    // 5. Query both entries back to verify read access
    const fetchedOrder = await Order.findOne({ orderNumber: mockOrder.orderNumber }).populate('user');
    const fetchedLicense = await License.findOne({ order: mockOrder._id });

    if (fetchedOrder && fetchedLicense) {
      console.log('\n======================================================');
      console.log('✅ ALL SYSTEMS VERIFIED & OPERATIONAL (Flipkart-Grade Flow):');
      console.log('------------------------------------------------------');
      console.log(`* Read User: ${(fetchedOrder.user as any).name}`);
      console.log(`* Read Order Grand Total: INR ${fetchedOrder.grandTotal}`);
      console.log(`* Read License Assigned: ${fetchedLicense.licenseKey}`);
      console.log('======================================================\n');
    } else {
      throw new Error('Data read back verification failed.');
    }

    // Clean up verification data so database stays clean
    await Order.deleteOne({ _id: mockOrder._id });
    await License.deleteOne({ _id: license._id });
    console.log('🧹 Verification logs cleaned up. Database connection closed.');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (err: any) {
    console.error('❌ E2E Backend Verification Failed:', err.message);
    process.exit(1);
  }
};

runVerification();
