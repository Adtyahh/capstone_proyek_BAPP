const express = require('express');
const router = express.Router();
const {
  createBAPP,
  getAllBAPP,
  getBAPPById,
  updateBAPP,
  deleteBAPP,
  submitBAPP,
  getBAPPStatistics
} = require('../controllers/bappController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { downloadBAPPPDF } = require('../controllers/documentController');

// All routes require authentication
router.use(protect);

router.post('/', authorize('vendor'), createBAPP);
router.get('/', getAllBAPP);
router.get('/statistics', getBAPPStatistics);
router.get('/:id', getBAPPById);
router.put('/:id', authorize('vendor'), updateBAPP);
router.delete('/:id', authorize('vendor'), deleteBAPP);
router.post('/:id/submit', authorize('vendor'), submitBAPP);
router.get('/:id/download/pdf', downloadBAPPPDF);

module.exports = router;