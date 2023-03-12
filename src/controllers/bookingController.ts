import { ProductModel } from '../models/productModel';
import { BookingModel } from '../models/bookingModel';
import { catchAsync } from '../utils/catchAsync';
import handlerFactory from './handlerFactory';

const getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked product
  const product = await ProductModel.findById(req.params.productId);

  // 2) Create checkout session

  // 3) Create session as response
  res.status(200).json({
    status: 'success',
  });
});

const createBookingCheckout = catchAsync(async (req, res, next) => {
  // This is only TEMPORARY, because it's UNSECURE: everyone can make bookings without paying
  const { product, user, price } = req.query;

  if (!product && !user && !price) return next();
  await BookingModel.create({ product, user, price });

  res.redirect(req.originalUrl.split('?')[0]);
});

const createBooking = handlerFactory.createOne(BookingModel);
const getBooking = handlerFactory.getOne(BookingModel);
const getAllBookings = handlerFactory.getAll(BookingModel);
const updateBooking = handlerFactory.updateOne(BookingModel);
const deleteBooking = handlerFactory.deleteOne(BookingModel);

const bookingController = {
  getCheckoutSession,
  createBookingCheckout,
  createBooking,
  getBooking,
  getAllBookings,
  updateBooking,
  deleteBooking,
};

export default bookingController;
