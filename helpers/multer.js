const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "re-image",
    allowed_formats: ['jpg', 'png', 'svg', 'jpeg', 'webp',"AVIF"],
    // transformation: [{ width: 800, height: 600, crop: 'limit' }],
  },
});

module.exports = storage;
