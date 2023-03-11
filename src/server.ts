import dotenv from 'dotenv';
dotenv.config({ path: './config.env' });

process.on('uncaughtException', (err: Error) => {
  console.log('Uncaught Exception! 💥 Shutting down... 💩');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

import { app } from './app';

import { connectDB } from './configs/db';
//mongodb://127.0.0.1:27017/test-db
connectDB();

const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Express server is listening on port ${port}`);
});

process.on('unhandledRejection', (err: Error) => {
  console.log('Unhandled Rejection! 💥 Shutting down... 🤡');
  console.error(err.name, err.message, err.stack);
  server.close((err) => {
    process.exit(1);
  });
});

process.on('SIGTERM', (listener) => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close((err) => {
    console.error(err?.name, err?.message, err?.stack);
    console.log('💥 Process terminated!');
    process.exit(0);
  });
});
