const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Storage untuk signature
const signatureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/signatures/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Storage untuk supporting documents
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/documents/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Filter untuk image files (signature)
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only image files (jpeg, jpg, png) are allowed for signatures'));
};

// Filter untuk document files
const documentFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|xls|xlsx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  if (extname) {
    return cb(null, true);
  }
  cb(new Error('Only document files are allowed'));
};

const uploadSignature = multer({
  storage: signatureStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

const uploadDocument = multer({
  storage: documentStorage,
  fileFilter: documentFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

module.exports = { uploadSignature, uploadDocument };