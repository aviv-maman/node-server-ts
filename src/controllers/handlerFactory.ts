import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';
import { Model } from 'mongoose';
import type { User } from '../models/userModel';
import type { Product } from '../models/productModel';
import type { Review } from '../models/reviewModel';
import type { Booking } from '../models/bookingModel';
const APIFeatures = require('../utils/apiFeatures');

export const deleteOne = (Model: Model<User | Product | Review | Booking>) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

export const updateOne = (Model: Model<User | Product | Review | Booking>) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // To send back the updated object
      runValidators: true, // To run validators in the schema
    });

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: doc,
    });
  });

export const createOne = (Model: Model<User | Product | Review | Booking>) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: doc,
    });
  });

export const getOne = (
  Model: Model<User | Product | Review | Booking>,
  popOptions?: {
    path?: string; //children
    select?: string | any;
    model?: string;
    match?: any;
  }
) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions)
      query = query.populate({
        path: popOptions.path ?? '',
        select: popOptions.select ?? '',
        model: popOptions.model ?? '',
        match: popOptions.match ?? '',
      });
    const doc = await query;

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      doc: doc,
    });
  });

export const getAll = (Model: Model<User | Product | Review | Booking>) =>
  catchAsync(async (req, res, next) => {
    // To allow for nested GET reviews on product (hack)
    let filter = {};
    if (req.params.productId) filter = { product: req.params.productId };

    const paginatedQuery = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .typeFilter()
      .nameFilter()
      .exactDateFilter()
      .fromDateFilter()
      .untilDateFilter()
      .exactPriceFilter()
      .minPriceFilter()
      .maxPriceFilter()
      .sort()
      .limitFields()
      .paginate();
    // const doc = await features.query.explain();

    const countQuery = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .typeFilter()
      .nameFilter()
      .exactDateFilter()
      .fromDateFilter()
      .untilDateFilter()
      .exactPriceFilter()
      .minPriceFilter()
      .maxPriceFilter()
      .sort()
      .limitFields()
      .count();

    const paginatedDoc = await paginatedQuery.query;
    const totalCount = await countQuery.query;

    // SEND RESPONSE
    res.status(200).json({
      success: true,
      data: paginatedDoc,
      currentCount: paginatedDoc.length,
      totalCount,
    });
  });
