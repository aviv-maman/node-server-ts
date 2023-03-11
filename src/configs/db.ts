import { connect } from 'mongoose';

const DB = (process.env.MONGO_URI ?? '').replace(
  '<password>',
  process.env.MONGO_PASSWORD ?? ''
);

export const connectDB = async () => {
  //DeprecationWarning: Mongoose: the `strictQuery` option will be switched back to `false` by default in Mongoose 7. Use `mongoose.set('strictQuery', false);` if you want to prepare for this change
  // mongoose.set('strictQuery', false);
  const conn = await connect(DB);
  console.log(`MongoDB Connected: ${conn.connection.host}`);
};
