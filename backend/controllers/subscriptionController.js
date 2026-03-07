const SubscriptionPlan = require('../models/SubscriptionPlan');
const Notification = require('../models/Notification');
const User = require('../models/User');
const stripe = require('../utils/stripe');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Get all subscription plans
exports.getPlans = async (req, res) => {
    try {
        const plans = await SubscriptionPlan.find().sort({ price: 1 });
        res.status(200).json({
            success: true,
            data: plans
        });
    } catch (error) {
        console.error('Get plans error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching subscription plans',
            error: error.message
        });
    }
};

// Update a subscription plan (Admin only)
exports.updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const { price, features, description, name } = req.body;

        const plan = await SubscriptionPlan.findByIdAndUpdate(
            id,
            { price, features, description, name },
            { new: true, runValidators: true }
        );

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Subscription plan not found'
            });
        }

        // Notify all users about the plan update
        const users = await User.find({ status: { $ne: 'Deleted' } });
        const notifications = users.map(user => ({
            userId: user._id,
            type: 'plan_updated',
            message: `The ${plan.name} plan has been updated. Check the subscriptions page for new details!`,
            entityId: plan._id
        }));

        // Using insertMany for efficiency
        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        res.status(200).json({
            success: true,
            message: 'Subscription plan updated and users notified',
            data: plan
        });
    } catch (error) {
        console.error('Update plan error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating subscription plan',
            error: error.message
        });
    }
};

// Create a plan (Helper if needed)
exports.createPlan = async (req, res) => {
    try {
        const plan = await SubscriptionPlan.create(req.body);
        res.status(201).json({ success: true, data: plan });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Create Stripe Checkout Session for a subscription
exports.createCheckoutSession = async (req, res) => {
  try {
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: 'planId is required'
      });
    }

    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: 'Stripe is not configured on the server'
      });
    }

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent starting a new paid subscription while current one is still active
    if (
      user.subscription &&
      user.subscription.status === 'active' &&
      user.subscription.currentPeriodEnd &&
      user.subscription.currentPeriodEnd > new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription. You can change settings from the Subscription section before the current period ends.',
      });
    }

    const priceInSmallestUnit = Math.round(plan.price * 100);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: (plan.currency || 'PKR').toLowerCase(),
            product_data: {
              name: `${plan.name} Plan`,
              description: plan.description
            },
            unit_amount: priceInSmallestUnit,
            recurring: {
              interval: 'month'
            }
          },
          quantity: 1
        }
      ],
      customer_email: user.email,
      metadata: {
        userId: String(user._id),
        planId: String(plan._id)
      },
      success_url: `${FRONTEND_URL}/#/home?subscription_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/#/checkout?subscription_cancelled=true`
    });

    return res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating checkout session',
      error: error.message
    });
  }
};

// Create Stripe Billing Portal session for updating payment method etc.
exports.createBillingPortalSession = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.subscription || !user.subscription.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        message: 'No Stripe customer found for this user. Please subscribe first.',
      });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.subscription.stripeCustomerId,
      return_url: `${FRONTEND_URL}/#/account?tab=Settings`,
    });

    return res.status(200).json({
      success: true,
      url: portalSession.url,
    });
  } catch (error) {
    console.error('Create billing portal session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating billing portal session',
      error: error.message,
    });
  }
};

// Get current user's subscription details
exports.getMySubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('subscription.plan');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const sub = user.subscription || {};
    const plan = sub.plan;

    if (!plan || sub.status === 'none') {
      return res.status(200).json({
        success: true,
        data: {
          status: 'none',
          planType: 'Free',
          planName: 'Free',
          price: 0,
          currency: 'PKR',
          currentPeriodEnd: null,
          autoRenew: false,
        }
      });
    }

    const autoRenew = sub.cancelAtPeriodEnd ? false : true;

    return res.status(200).json({
      success: true,
      data: {
        status: sub.status,
        planType: plan.type,
        planName: plan.name,
        price: plan.price,
        currency: plan.currency,
        currentPeriodEnd: sub.currentPeriodEnd,
        autoRenew,
      }
    });
  } catch (error) {
    console.error('Get my subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription details',
      error: error.message
    });
  }
};

// Toggle auto-renew for current user's subscription
exports.updateAutoRenew = async (req, res) => {
  try {
    const { autoRenew } = req.body;
    if (typeof autoRenew !== 'boolean') {
      return res.status(400).json({ success: false, message: 'autoRenew must be a boolean' });
    }

    const user = await User.findById(req.user._id).populate('subscription.plan');
    if (!user || !user.subscription || !user.subscription.stripeSubscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'No active Stripe subscription found for this user'
      });
    }

    const stripeSubscription = await stripe.subscriptions.update(
      user.subscription.stripeSubscriptionId,
      { cancel_at_period_end: !autoRenew }
    );

    const currentPeriodEnd = stripeSubscription.current_period_end
      ? new Date(stripeSubscription.current_period_end * 1000)
      : null;

    user.subscription.status = stripeSubscription.status || user.subscription.status;
    user.subscription.currentPeriodEnd = currentPeriodEnd;
    user.subscription.cancelAtPeriodEnd = !autoRenew;
    await user.save();

    // Notify user about subscription change
    const plan = user.subscription.plan;
    await Notification.create({
      userId: user._id,
      type: 'subscription_changed',
      message: autoRenew
        ? `Your ${plan?.name || 'subscription'} will now auto-renew each period.`
        : `Your ${plan?.name || 'subscription'} will not auto-renew and will end at the current billing period.`,
      entityId: plan?._id || null,
    });

    return res.status(200).json({
      success: true,
      message: 'Subscription auto-renew setting updated',
      data: {
        status: user.subscription.status,
        autoRenew,
        currentPeriodEnd,
      }
    });
  } catch (error) {
    console.error('Update auto-renew error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating auto-renew setting',
      error: error.message
    });
  }
};

// Cancel current user's subscription immediately
exports.cancelSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('subscription.plan');
    if (!user || !user.subscription || !user.subscription.stripeSubscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'No active Stripe subscription found for this user'
      });
    }

    const stripeSubscription = await stripe.subscriptions.cancel(
      user.subscription.stripeSubscriptionId
    );

    const endedAt = stripeSubscription.ended_at
      ? new Date(stripeSubscription.ended_at * 1000)
      : null;

    user.subscription.status = stripeSubscription.status || 'canceled';
    user.subscription.currentPeriodEnd = endedAt;
    user.subscription.cancelAtPeriodEnd = false;
    await user.save();

    const plan = user.subscription.plan;
    await Notification.create({
      userId: user._id,
      type: 'subscription_changed',
      message: `Your ${plan?.name || 'subscription'} has been cancelled.`,
      entityId: plan?._id || null,
    });

    return res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: {
        status: user.subscription.status,
        currentPeriodEnd: user.subscription.currentPeriodEnd,
      }
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling subscription',
      error: error.message
    });
  }
};

// Fallback confirmation endpoint (used by frontend after redirect)
exports.confirmCheckoutSession = async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) {
      return res.status(400).json({ success: false, message: 'session_id is required' });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (!session || session.payment_status !== 'paid') {
      return res.status(400).json({ success: false, message: 'Session not paid or not found' });
    }

    const { userId, planId } = session.metadata || {};
    const stripeCustomerId = session.customer;
    const stripeSubscriptionId = session.subscription;

    // Ensure the session belongs to the logged-in user
    if (!userId || String(req.user._id) !== String(userId)) {
      return res.status(403).json({ success: false, message: 'This session does not belong to the current user' });
    }

    if (!planId || !stripeSubscriptionId) {
      return res.status(400).json({ success: false, message: 'Missing plan or subscription information on session' });
    }

    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    const currentPeriodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : null;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        subscription: {
          plan: planId,
          status: subscription.status || 'active',
          stripeCustomerId: stripeCustomerId || null,
          stripeSubscriptionId,
          currentPeriodEnd,
          cancelAtPeriodEnd: !!subscription.cancel_at_period_end,
        }
      },
      { new: true }
    ).populate('subscription.plan');

    if (user && user.subscription && user.subscription.plan) {
      await Notification.create({
        userId: user._id,
        type: 'subscription_changed',
        message: `Your subscription is now active on the ${user.subscription.plan.name} plan.`,
        entityId: user.subscription.plan._id,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Subscription confirmed successfully',
      data: {
        status: user.subscription.status,
        currentPeriodEnd: user.subscription.currentPeriodEnd,
      }
    });
  } catch (error) {
    console.error('Confirm checkout session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error confirming checkout session',
      error: error.message
    });
  }
};

// Stripe webhook handler
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not set.');
    return res.status(500).send('Webhook secret not configured');
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { userId, planId } = session.metadata || {};
        const stripeCustomerId = session.customer;
        const stripeSubscriptionId = session.subscription;

        if (userId && planId && stripeSubscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
          const currentPeriodEnd = subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000)
            : null;

          const user = await User.findByIdAndUpdate(
            userId,
            {
              subscription: {
                plan: planId,
                status: subscription.status || 'active',
                stripeCustomerId: stripeCustomerId || null,
                stripeSubscriptionId,
                currentPeriodEnd,
                cancelAtPeriodEnd: !!subscription.cancel_at_period_end,
              }
            },
            { new: true }
          ).populate('subscription.plan');

          if (user && user.subscription && user.subscription.plan) {
            await Notification.create({
              userId: user._id,
              type: 'subscription_changed',
              message: `Your subscription is now active on the ${user.subscription.plan.name} plan.`,
              entityId: user.subscription.plan._id,
            });
          }
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const stripeSubscriptionId = subscription.id;
        const status = subscription.status;
        const currentPeriodEnd = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : null;

        const user = await User.findOneAndUpdate(
          { 'subscription.stripeSubscriptionId': stripeSubscriptionId },
          {
            $set: {
              'subscription.status': status,
              'subscription.currentPeriodEnd': currentPeriodEnd,
              'subscription.cancelAtPeriodEnd': !!subscription.cancel_at_period_end,
            }
          },
          { new: true }
        ).populate('subscription.plan');

        if (user && user.subscription && user.subscription.plan) {
          await Notification.create({
            userId: user._id,
            type: 'subscription_changed',
            message: `Your subscription status changed to ${status} for the ${user.subscription.plan.name} plan.`,
            entityId: user.subscription.plan._id,
          });
        }
        break;
      }
      default:
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook processing error:', error);
    res.status(500).send('Webhook handler failed');
  }
};