const express = require('express');
const router = express.Router();
const skillController = require('../controllers/skillController');
const { authenticate } = require('../middleware/auth');

router.get('/list', skillController.getAllSkills);
router.get('/', authenticate, skillController.browseSkills);

module.exports = router;