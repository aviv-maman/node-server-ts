import { catchAsync } from '../utils/catchAsync';
import AppError from '../utils/appError';
import { Model } from 'mongoose';
import type { FilterQuery } from 'mongoose';
import APIFeatures from '../utils/apiFeatures';

const deleteOne = (Model: Model<any>) =>
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

const updateOne = (Model: Model<any>) =>
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

const createOne = (Model: Model<any>) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: doc,
    });
  });

const getOne = (
  Model: Model<any>,
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

const getAll = (Model: Model<any>) =>
  catchAsync(async (req, res, next) => {
    // To allow for nested GET reviews on product (hack)
    let filter = {} as FilterQuery<any>;
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

const handlerFactory = {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
};

export default handlerFactory;
