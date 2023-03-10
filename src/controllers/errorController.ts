import { NextFunction, Request, Response } from 'express';
import { MongoServerError } from 'mongodb';
import { Error as MongooseError } from 'mongoose';
import { AppError } from '../utils/appError';

const handleCastErrorDB = (err: MongooseError.CastError) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err: MongoServerError) => {
  const errmsg = err.errmsg.match(/(["'])(\\?.)*?\1/);
  const value = errmsg ? errmsg[0] : 'null';
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err: MongooseError.ValidationError) => {
  const errors = Object.values(err.errors).map((element) => element.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

const sendErrorDev = (err: AppError, req: Request, res: Response) => {
  // To send error only
  // res.status(err.statusCode).json({
  //   status: err.status,
  //   error: err,
  //   message: err.message,
  //   stack: err.stack
  // });

  // A) API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(Number(err.statusCode)).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  // B) RENDERED WEBSITE
  console.error('ERROR 💥', err);
  return res.status(Number(err.statusCode)).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};

const sendErrorProd = (err: AppError, req: Request, res: Response) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    // A) Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(Number(err.statusCode)).json({
        status: err.status,
        message: err.message,
      });
    }
    // B) Programming or other unknown error: don't leak error details
    // 1) Log error
    console.error('ERROR 💥', err);
    // 2) Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }

  // B) RENDERED WEBSITE
  // A) Operational, trusted error: send message to client
  if (err.isOperational) {
    console.log(err);
    return res.status(Number(err.statusCode)).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }
  // B) Programming or other unknown error: don't leak error details
  // 1) Log error
  console.error('ERROR 💥', err);
  // 2) Send generic message
  return res.status(Number(err.statusCode)).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.',
  });
};

module.exports = (
  err: AppError | MongooseError.CastError | MongoServerError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // console.log(err.stack);

  if (err instanceof AppError) {
    err.statusCode = Number(err.statusCode) || 500;
    err.status = err.status || 'error';
  }

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err as AppError, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    if (err instanceof MongooseError.CastError && err.name === 'CastError')
      error = handleCastErrorDB(error as MongooseError.CastError);
    if (err instanceof MongoServerError && err.code === 11000)
      error = handleDuplicateFieldsDB(error as MongoServerError);
    if (
      err instanceof MongooseError.ValidationError &&
      err.name === 'ValidationError'
    )
      error = handleValidationErrorDB(error as MongooseError.ValidationError);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error as AppError, req, res);
  }
};
