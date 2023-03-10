const Review = require('../models/reviewModel');
import { NextFunction, Request, Response } from 'express';
import {
  createOne,
  deleteOne,
  getAll,
  getOne,
  updateOne,
} from './handlerFactory';
// const catchAsync = require('./../utils/catchAsync');

export const setProductUserIds = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Allow nested routes
  if (!req.body.product) req.body.product = req.params.productId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

export const getAllReviews = getAll(Review);
export const getReview = getOne(Review);
export const createReview = createOne(Review);
export const updateReview = updateOne(Review);
export const deleteReview = deleteOne(Review);
