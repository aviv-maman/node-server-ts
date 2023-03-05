require('dotenv').config({ path: '../config.env' });

module.exports = {
  options: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    resourceType: `image`,
    context: true,
    maxResults: 10,
    prefix: process.env.CLOUDINARY_SOURCE_PREFIX,
    uploadFolder: process.env.CLOUDINARY_UPLOAD_FOLDER,
  },
};
