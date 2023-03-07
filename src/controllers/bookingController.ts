const Product = require('../models/productModel');
const Booking = require('../models/bookingModel');
import { catchAsync } from '../utils/catchAsync';
import {
  createOne,
  deleteOne,
  getAll,
  getOne,
  updateOne,
} from './handlerFactory';

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked product
  const product = await Product.findById(req.params.productId);
  console.log(product);

  // 2) Create checkout session

  // 3) Create session as response
  res.status(200).json({
    status: 'success',
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // This is only TEMPORARY, because it's UNSECURE: everyone can make bookings without paying
  const { product, user, price } = req.query;

  if (!product && !user && !price) return next();
  await Booking.create({ product, user, price });

  res.redirect(req.originalUrl.split('?')[0]);
});

export const createBooking = createOne(Booking);
export const getBooking = getOne(Booking);
export const getAllBookings = getAll(Booking);
export const updateBooking = updateOne(Booking);
export const deleteBooking = deleteOne(Booking);
