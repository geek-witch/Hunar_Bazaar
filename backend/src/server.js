require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const connectDB = require('../config/db');
const { migrateSessions } = require('../utils/migrateSessions');
const authRoutes = require('../routes/auth');
const profileRoutes = require('../routes/profile');
const skillRoutes = require('../routes/skill');
const contactRoutes = require('../routes/contact');
const supportRoutes = require('../routes/support');
const sessionRoutes = require('../routes/session');
const groupRoutes = require('../routes/group');
const reportRoutes = require('../routes/reports');
const chatRoutes = require('../routes/chat');
const notificationRoutes = require('../routes/notifications');
const adminRoutes = require('../routes/admin');

const app = express();

connectDB().then(() => {
  // Run session migration after database connection
  migrateSessions().catch(console.error);
});

const isDevelopment = process.env.NODE_ENV !== 'production';

const corsOptions = {
  origin: function (origin, callback) {
    if (isDevelopment) {
      return callback(null, true);
    }

    const allowedOrigins = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
      : ['http://localhost:3000', 'http://localhost:3001'];

    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Temporarily hardcode admin user IDs until a proper role management system is implemented.
// In a real application, these would be fetched from a database or environment variables.
app.locals.adminIds = process.env.ADMIN_USER_IDS ? process.env.ADMIN_USER_IDS.split(',').map(id => id.trim()) : ['65a88c304523a63321946890', '65a88c304523a63321946891']; // Replace with actual admin user ObjectIds

app.use('/api/auth', authRoutes);
app.use('/api/auth', profileRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/feedback', require('../routes/feedback'));
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/logs', require('../routes/logs'));
app.use('/api/subscriptions', require('../routes/subscription'));

app.use((err, req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (origin.includes('localhost:3000') || origin.includes('localhost:3001'))) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }

  if (err.type === 'entity.too.large' || err.status === 413) {
    return res.status(413).json({
      success: false,
      message: 'File size is too large. Please choose an image smaller than 10MB.',
      error: 'Payload too large'
    });
  }

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS: Origin not allowed'
    });
  }

  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
