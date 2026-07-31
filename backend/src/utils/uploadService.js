const cloudinary = require('cloudinary').v2;

const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

const uploadImage = (fileBuffer, mimeType = 'image/jpeg') => {
  return new Promise((resolve) => {
    if (!fileBuffer) {
      return resolve('');
    }

    if (!isCloudinaryConfigured) {
      const base64Str = fileBuffer.toString('base64');
      return resolve(`data:${mimeType};base64,${base64Str}`);
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'campuscare' },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          const base64Str = fileBuffer.toString('base64');
          return resolve(`data:${mimeType};base64,${base64Str}`);
        }
        resolve(result.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

module.exports = { uploadImage, isCloudinaryConfigured };
