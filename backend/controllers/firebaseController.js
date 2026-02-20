const { getAdmin } = require('../utils/firebaseAdmin');

exports.getFirebaseToken = async (req, res) => {
  try {
    const admin = getAdmin();
    const uid = req.user?._id?.toString();

    if (!uid) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const token = await admin.auth().createCustomToken(uid);
    return res.status(200).json({
      success: true,
      data: { token },
    });
  } catch (error) {
    console.error('Firebase token error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create Firebase token',
      error: error.message,
    });
  }
};

