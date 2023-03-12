import { UploadApiOptions, v2 as cloudinary } from 'cloudinary';
import type { NextFunction, Request } from 'express';
import cloudinaryOptions from '../configs/cloudinary';
import AppError from './appError';

const uploadImageToCloudinary = async (req: Request, next: NextFunction) => {
  const { apiKey, apiSecret, cloudName, uploadFolder, resourceType } =
    cloudinaryOptions;

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  const uploadOptions = {
    folder: uploadFolder,
    public_id: req.body.publicId || req?.file?.filename,
    resource_type: resourceType,
    overwrite: true,
  } as UploadApiOptions;

  try {
    await cloudinary.uploader.upload(
      req?.file?.path ?? '/',
      uploadOptions,
      (error, result) => {
        if (error) {
          const stringifiedError = JSON.stringify(error, null, 2);
          return next(new AppError(stringifiedError, 400));
        }
        if (result && req.file) {
          req.file.publicPath = result.secure_url;
        }
      }
    );
  } catch (error) {
    const stringifiedError = JSON.stringify(error, null, 2);
    return next(new AppError(stringifiedError, 400));
  }
};

export default uploadImageToCloudinary;
