import multer from 'multer';
import type { FileFilterCallback } from 'multer';
import sharp from 'sharp';
import { UserModel } from '../models/userModel';
import { catchAsync } from '../utils/catchAsync';
import AppError from '../utils/appError';
import type { NextFunction, Request, Response } from 'express';
import handlerFactory from './handlerFactory';
import uploadImageToCloudinary from '../utils/upload';

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

const multerFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    return new AppError('Not an image! Please upload only images.', 400);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

const uploadUserPhoto = upload.single('photo');

const resizeUserPhoto = catchAsync(async (req, res, next) => {
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

const filterObj = (obj: Request['body'], ...allowedFields: string[]) => {
  const newObj = {} as any;
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

const getMe = (req: Request, res: Response, next: NextFunction) => {
  req.params.id = req.user.id;
  next();
};

const updateMe = catchAsync(async (req, res, next) => {
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
  const updatedUser = await UserModel.findByIdAndUpdate(
    req.user.id,
    filteredBody,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
    user: updatedUser,
  });
});

const deleteMe = catchAsync(async (req, res, next) => {
  await UserModel.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

const createUser = (req: Request, res: Response) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined! Please use /signup instead',
  });
};

const getUser = handlerFactory.getOne(UserModel);
const getAllUsers = handlerFactory.getAll(UserModel);

// Do NOT update passwords with this!
const updateUser = handlerFactory.updateOne(UserModel);
const deleteUser = handlerFactory.deleteOne(UserModel);

const userController = {
  createUser,
  getUser,
  getAllUsers,
  updateUser,
  deleteUser,
  getMe,
  updateMe,
  deleteMe,
  uploadUserPhoto,
  resizeUserPhoto,
};

export default userController;
