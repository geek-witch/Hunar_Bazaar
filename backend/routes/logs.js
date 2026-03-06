const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
// Assuming some auth middleware exists to protect admin routes
// const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', logController.getLogs);
router.get('/export', logController.exportLogs);

module.exports = router;
