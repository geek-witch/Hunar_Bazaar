const express = require('express');
const router = express.Router();
const skillController = require('../controllers/skillController');
const { optionalAuthenticate } = require('../middleware/auth');

router.get('/list', skillController.getAllSkills);
router.get('/', optionalAuthenticate, skillController.browseSkills);
router.get('/:profileId', optionalAuthenticate, skillController.getProfileById);

module.exports = router;