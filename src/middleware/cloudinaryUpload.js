const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Test Cloudinary connection
const testCloudinaryConnection = async () => {
  try {
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary connected successfully:', result.status);
  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error.message);
    console.log('📝 Make sure CLOUDINARY_* environment variables are set');
  }
};

// Test connection on startup
setTimeout(testCloudinaryConnection, 2000);

// News images storage
const newsStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'jpr/news',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 1200, height: 800, crop: 'limit', quality: 'auto' }
    ],
  },
});

// Publications PDF storage
const publicationStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'jpr/publications',
    allowed_formats: ['pdf'],
    resource_type: 'raw', // For non-image files like PDFs
  },
});

// Create multer instances
const uploadNewsImages = multer({ 
  storage: newsStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for news'), false);
    }
  }
});

const uploadPublicationPdf = multer({ 
  storage: publicationStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for PDFs
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for publications'), false);
    }
  }
});

module.exports = {
  uploadNewsImages,
  uploadPublicationPdf,
  cloudinary,
};