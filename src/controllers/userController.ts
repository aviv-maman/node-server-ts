import multer from 'multer';
const sharp = require('sharp');
const User = require('../models/userModel');
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';
import { NextFunction, Request, Response } from 'express';
import { deleteOne, getAll, getOne, updateOne } from './handlerFactory';
const { uploadImageToCloudinary } = require('../utils/upload');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, '../../public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });
const multerStorage = multer.memoryStorage();

const multerFilter = (req: Request, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  // req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  req.file.filename = `user-${req.user.id}.jpeg`;
  req.file.path = `../../public/img/users/${req.file.filename}`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 100 })
    .toFile(req.file.path);

  //Upload to Local Server
  // req.file.publicPath = `${req.protocol}://${req.header('host')}/img/users/${
  //   req.file.filename
  // }`;

  //Upload to Cloudinary
  await uploadImageToCloudinary(req, next);
  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req: Request, res: Response, next: NextFunction) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  // so that the user can't update his role or other sensitive data.
  // Specify the fields that are allowed to be updated
  const filteredBody = filterObj(
    req.body,
    'firstName',
    'lastName',
    'phoneNumber',
    'dateOfBirth',
    'height',
    'weight',
    'siteTheme',
    'currency',
    'locale'
  );

  // if (req.file) filteredBody.photo = req.file.filename;
  if (req.file) filteredBody.photo = req.file.publicPath;

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    user: updatedUser,
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (req: Request, res: Response) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined! Please use /signup instead',
  });
};

export const getUser = getOne(User);
export const getAllUsers = getAll(User);

// Do NOT update passwords with this!
export const updateUser = updateOne(User);
export const deleteUser = deleteOne(User);
