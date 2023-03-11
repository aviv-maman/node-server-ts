import { Router } from 'express';
const reviewController = require('../controllers/reviewController');
import { protect, restrictTo } from '../controllers/authController';

export const reviewRouter = Router({ mergeParams: true });

reviewRouter.use(protect);

reviewRouter
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    restrictTo('user'),
    reviewController.setProductUserIds,
    reviewController.createReview
  );

reviewRouter
  .route('/:id')
  .get(reviewController.getReview)
  .patch(restrictTo('user', 'admin'), reviewController.updateReview)
  .delete(restrictTo('user', 'admin'), reviewController.deleteReview);
