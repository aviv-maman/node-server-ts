import type { UploadApiOptions } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config({ path: '../config.env' });

const cloudinaryOptions = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
  resourceType: 'image' as UploadApiOptions['resource_type'],
  context: true,
  maxResults: 10,
  prefix: process.env.CLOUDINARY_SOURCE_PREFIX,
  uploadFolder: process.env.CLOUDINARY_UPLOAD_FOLDER,
};

export default cloudinaryOptions;
