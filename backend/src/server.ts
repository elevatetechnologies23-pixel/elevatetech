import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';

// Catch uncaught exceptions before loading app
process.on('uncaughtException', (err: Error) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

// Load Env variables
dotenv.config({ path: path.join(__dirname, '../.env') });

import app from './app';

const port = process.env.PORT || 5000;

// Connect Database
const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/enterprise-electronics';

mongoose
  .connect(dbUri)
  .then(() => {
    console.log('MongoDB connection successful! 🔌📁');
  })
  .catch((err: Error) => {
    console.error('MongoDB connection error: 💥', err.message);
  });

const server = app.listen(port, () => {
  console.log(`Server running on port ${port} in ${process.env.NODE_ENV} mode... 🚀`);
});

// Catch unhandled rejections (promise rejections)
process.on('unhandledRejection', (err: any) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err?.name || 'Error', err?.message || err);
  server.close(() => {
    process.exit(1);
  });
});
