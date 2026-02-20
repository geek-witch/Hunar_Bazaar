const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');

// Public route to get plans
router.get('/', subscriptionController.getPlans);

// Admin route to update plans (should eventually be protected by admin middleware)
router.put('/:id', subscriptionController.updatePlan);
router.post('/', subscriptionController.createPlan);

module.exports = router;
