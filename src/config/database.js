import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

let isConnecting = false;

export const connectDB = async (uri = env.MONGODB_URI) => {
  if (mongoose.connection.readyState === 1) {
    logger.info('Database already connected.');
    return mongoose.connection;
  }

  if (isConnecting) {
    logger.warn('Database connection already in progress...');
    return;
  }

  try {
    isConnecting = true;
    logger.info('Connecting to MongoDB database...');

    const connection = await mongoose.connect(uri, {
      maxPoolSize: 20,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority'
    });

    isConnecting = false;
    logger.info(`MongoDB connected successfully to host: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    isConnecting = false;
    logger.error('Failed to connect to MongoDB database:', { error: error.message });
    throw error;
  }
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    logger.info('Disconnecting MongoDB connection...');
    await mongoose.disconnect();
    logger.info('MongoDB disconnected cleanly.');
  }
};

export const isDBConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Lifecycle Event Listeners
mongoose.connection.on('connected', () => {
  logger.info('Mongoose connection established.');
});

mongoose.connection.on('error', (err) => {
  logger.error('Mongoose connection error occurred:', { error: err.message });
});

mongoose.connection.on('disconnected', () => {
  logger.warn('Mongoose connection lost / disconnected.');
});

export const connectDatabase = connectDB;
export const disconnectDatabase = disconnectDB;

export default { connectDB, disconnectDB, connectDatabase, disconnectDatabase, isDBConnected };
