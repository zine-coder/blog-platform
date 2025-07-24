const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (err) {
    console.error('Failed to create uploads directory:', err);
  }
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + ext;
    cb(null, filename);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  
  cb(null, true);
};

// Initialize upload for single image
const uploadSingle = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
  fileFilter: fileFilter
}).single('image');

// Initialize upload for multiple images
const uploadMultiple = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size per file
  fileFilter: fileFilter
}).array('images', 10); // Allow up to 10 images

/**
 * Upload image to Cloudinary
 * @route POST /api/upload
 * @access Private
 */
exports.uploadImage = async (req, res) => {
  try {
    // No file uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload an image file'
      });
    }

    // Check if file exists
    if (!fs.existsSync(req.file.path)) {
      return res.status(500).json({
        success: false,
        error: 'File processing error'
      });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'blog_platform',
      use_filename: true
    });

    // Remove file from server after upload
    try {
      fs.unlinkSync(req.file.path);
    } catch (unlinkErr) {
      // Continue anyway since the upload was successful
    }

    // Return success with image URL
    return res.status(200).json({
      success: true,
      imageUrl: result.secure_url,
      public_id: result.public_id
    });
  } catch (err) {
    // Remove file from server if upload failed
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {
        // Ignore error
      }
    }
    
    return res.status(500).json({
      success: false,
      error: 'Image upload failed: ' + (err.message || 'Unknown error')
    });
  }
};

/**
 * Upload multiple images to Cloudinary
 * @route POST /api/upload/multiple
 * @access Private
 */
exports.uploadMultipleImages = async (req, res) => {
  try {
    // No files uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please upload at least one image file'
      });
    }

    const uploadResults = [];
    
    // Upload each file to Cloudinary
    for (const file of req.files) {
      // Check if file exists
      if (!fs.existsSync(file.path)) {
        continue; // Skip this file
      }
      
      try {
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'blog_platform',
          use_filename: true
        });
        
        uploadResults.push({
          originalName: file.originalname,
          imageUrl: result.secure_url,
          public_id: result.public_id
        });
        
        // Remove file from server after upload
        try {
          fs.unlinkSync(file.path);
        } catch (unlinkErr) {
          // Continue anyway since the upload was successful
        }
      } catch (uploadErr) {
        console.error(`Error uploading file ${file.originalname}:`, uploadErr);
        
        // Remove file from server if upload failed
        try {
          fs.unlinkSync(file.path);
        } catch (unlinkErr) {
          // Ignore error
        }
      }
    }
    
    // Return success with image URLs
    return res.status(200).json({
      success: true,
      count: uploadResults.length,
      images: uploadResults
    });
  } catch (err) {
    // Clean up any remaining files
    if (req.files) {
      for (const file of req.files) {
        if (fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
          } catch (unlinkErr) {
            // Ignore error
          }
        }
      }
    }
    
    return res.status(500).json({
      success: false,
      error: 'Image upload failed: ' + (err.message || 'Unknown error')
    });
  }
};

/**
 * Middleware for handling single image upload with custom error handling
 */
exports.uploadMiddleware = (req, res, next) => {
  uploadSingle(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading
      return res.status(400).json({
        success: false,
        error: `Upload error: ${err.message}`
      });
    } else if (err) {
      // An unknown error occurred when uploading
      return res.status(400).json({
        success: false,
        error: err.message || 'File upload failed'
      });
    }
    
    // Everything went fine
    next();
  });
};

/**
 * Middleware for handling multiple image uploads with custom error handling
 */
exports.uploadMultipleMiddleware = (req, res, next) => {
  uploadMultiple(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading
      return res.status(400).json({
        success: false,
        error: `Upload error: ${err.message}`
      });
    } else if (err) {
      // An unknown error occurred when uploading
      return res.status(400).json({
        success: false,
        error: err.message || 'File upload failed'
      });
    }
    
    // Everything went fine
    next();
  });
}; 