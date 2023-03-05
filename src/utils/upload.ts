const cloudinary = require('cloudinary').v2;
const { options } = require('../configs/cloudinary');
const AppError = require('./appError');

exports.uploadImageToCloudinary = async (req, next) => {
  const { apiKey, apiSecret, cloudName, uploadFolder, resourceType } = options;

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  const uploadOptions = {
    folder: uploadFolder,
    public_id: req.body.publicId || req.file.filename,
    resource_type: resourceType,
    overwrite: true,
  };

  try {
    await cloudinary.uploader.upload(
      req.file.path,
      uploadOptions,
      (error, result) => {
        if (error) {
          const stringifiedError = JSON.stringify(error, null, 2);
          return next(new AppError(stringifiedError, 400));
        }
        if (result) {
          req.file.publicPath = result.secure_url;
        }
      }
    );
  } catch (error) {
    const stringifiedError = JSON.stringify(error, null, 2);
    return next(new AppError(stringifiedError, 400));
  }
};
