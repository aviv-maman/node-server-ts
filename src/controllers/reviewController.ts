import { ReviewModel } from '../models/reviewModel';
import type { NextFunction, Request, Response } from 'express';
import handlerFactory from './handlerFactory';

const setProductUserIds = (req: Request, res: Response, next: NextFunction) => {
  // Allow nested routes
  if (!req.body.product) req.body.product = req.params.productId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

const getAllReviews = handlerFactory.getAll(ReviewModel);
const getReview = handlerFactory.getOne(ReviewModel);
const createReview = handlerFactory.createOne(ReviewModel);
const updateReview = handlerFactory.updateOne(ReviewModel);
const deleteReview = handlerFactory.deleteOne(ReviewModel);

const reviewController = {
  setProductUserIds,
  getAllReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
};

export default reviewController;
