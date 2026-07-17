import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const dbUri = process.env.MONGO_URI || '';

const run = async () => {
  try {
    await mongoose.connect(dbUri);
    const users = await User.find({}, 'name email role');
    console.log('USERS_LIST:', JSON.stringify(users, null, 2));
    await mongoose.connection.close();
  } catch (err: any) {
    console.error('Error:', err);
  }
};

run();
