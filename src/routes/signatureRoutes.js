const express = require('express');
const router = express.Router();
const {
  uploadSignature,
  getBAPPSignatures, // Disesuaikan untuk BAPP
  deleteSignature,
  getSignatureFile
} = require('../controllers/signatureController');
const { protect } = require('../middlewares/authMiddleware');
const { uploadSignature: multerUpload } = require('../config/multer');

// All routes require authentication
router.use(protect);

// Upload signature untuk BAPP
router.post('/upload', multerUpload.single('signature'), uploadSignature);
// Get semua signature dari BAPP ID
router.get('/bapp/:bappId', getBAPPSignatures); 
router.delete('/:id', deleteSignature);
router.get('/:id/file', getSignatureFile);

module.exports = router;