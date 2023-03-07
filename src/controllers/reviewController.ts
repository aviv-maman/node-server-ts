const Review = require('../models/reviewModel');
import {
  createOne,
  deleteOne,
  getAll,
  getOne,
  updateOne,
} from './handlerFactory';
// const catchAsync = require('./../utils/catchAsync');

exports.setProductUserIds = (req, res, next) => {
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
