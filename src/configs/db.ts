import { connect, connection, version } from 'mongoose';
import AppError from '../utils/appError';

const DB = (process.env.MONGO_URI ?? '').replace(
  '<password>',
  process.env.MONGO_PASSWORD ?? ''
);

const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB. Please wait...');
    const conn = await connect(DB);
    if (conn.ConnectionStates[1]) {
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    }
  } catch (err: any) {
    console.error('Connection to MongoDB failed');
    const error: Error = err;
    if (process.env.NODE_ENV === 'production') {
      console.error(error.message);
    } else if (process.env.NODE_ENV === 'development') {
      console.error(error.name, error.message, error?.stack);
    }
    return new AppError(error.message, 500);
  }
  connection.on('error', (err) => {
    const start = Date.now();
    console.error(`Mongoose ${version}`);
    console.error(
      `Error ${err.name} was caught after ${(Date.now() - start).toString()}`
    );
    console.error(err.message);
  });
};

export default connectDB;
