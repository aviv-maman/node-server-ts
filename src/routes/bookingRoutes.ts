import { Router } from 'express';
import bookingController from '../controllers/bookingController';
const authController = require('../controllers/authController');

export const bookingRouter = Router();

bookingRouter.use(authController.protect);

bookingRouter.get(
  '/checkout-session/:productId',
  bookingController.getCheckoutSession
);

bookingRouter.use(authController.restrictTo('admin', 'lead-guide'));

bookingRouter
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

bookingRouter
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);
