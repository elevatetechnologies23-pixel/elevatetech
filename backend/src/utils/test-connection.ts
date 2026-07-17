import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const dbUri = process.env.MONGO_URI || '';

const testConnect = async () => {
  console.log('Attempting to connect to MongoDB Atlas using URL from .env...');
  console.log(`Connection URL: ${dbUri.replace(/:([^:@]+)@/, ':****@')}`); // Hide password for security

  try {
    await mongoose.connect(dbUri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connection Successful! MongoDB Atlas is connected and fully operational.');
    await mongoose.connection.close();
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Connection Failed! Here is the error description:');
    console.error(err.message || err);
    console.log('\nCommon causes:');
    console.log('1. IP Address is not whitelisted on MongoDB Atlas Network Access.');
    console.log('2. Local DNS resolver cannot lookup _mongodb._tcp.cluster0.suxooyt.mongodb.net (try Google DNS 8.8.8.8).');
    console.log('3. Password or Username is incorrect in the connection string.');
    process.exit(1);
  }
};

testConnect();
