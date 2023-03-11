const path = require('path');
import express, { Application } from 'express';
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const sanitizer = require('perfect-express-sanitizer');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const cors = require('cors');

import { AppError } from './utils/appError';
import { globalErrorHandler } from './controllers/errorController';
const productRouter = require('./routes/productRoutes');
const userRouter = require('./routes/userRoutes');
import { reviewRouter } from './routes/reviewRoutes';
const bookingRouter = require('./routes/bookingRoutes');

const app: Application = express();

// 1) GLOBAL MIDDLEWARES
// Implement CORS
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

////
// app.use(cors());
// Access-Control-Allow-Origin *
// api.my-site.com, front-end my-site.com
// app.use(cors({
//   origin: 'https://www.my-site.com'
// }))

// app.options('*', cors());
// app.options('/api/v1/products/:id', cors());
////

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 200,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(
  sanitizer.clean({
    xss: true,
    noSql: true,
    sql: true,
    sqlLevel: 5,
    noSqlLevel: 5,
  })
);

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

// 3) ROUTES
app.use('/api/v1/products', productRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
