const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticate } = require('../middleware/auth');

// Public route to get plans
router.get('/', subscriptionController.getPlans);

// Current user's subscription details
router.get('/me', authenticate, subscriptionController.getMySubscription);

// Create Stripe Checkout Session (authenticated users)
router.post('/checkout-session', authenticate, subscriptionController.createCheckoutSession);

// Manage current user's subscription
router.post('/auto-renew', authenticate, subscriptionController.updateAutoRenew);
router.post('/cancel', authenticate, subscriptionController.cancelSubscription);

// Fallback confirmation endpoint (called by frontend after redirect)
router.get('/confirm', authenticate, subscriptionController.confirmCheckoutSession);

// Billing portal for updating payment method
router.post('/billing-portal', authenticate, subscriptionController.createBillingPortalSession);

// Admin route to update plans (should eventually be protected by admin middleware)
router.put('/:id', subscriptionController.updatePlan);
router.post('/', subscriptionController.createPlan);

module.exports = router;