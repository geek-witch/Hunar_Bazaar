const admin = require('firebase-admin');
const path = require('path');

let app;

function getServiceAccountFromEnv() {
  // Option 1: Raw JSON in env (not recommended on Windows)
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json && String(json).trim()) {
    try {
      return JSON.parse(String(json).trim());
    } catch (e) {
      throw new Error(
        `Invalid FIREBASE_SERVICE_ACCOUNT_JSON. ` +
        `Use FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 instead. Error: ${e.message}`
      );
    }
  }

  // Option 2: Base64-encoded JSON (recommended)
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64;
  if (b64 && String(b64).trim()) {
    try {
      const decoded = Buffer.from(String(b64).trim(), 'base64').toString('utf8');
      return JSON.parse(decoded);
    } catch (e) {
      throw new Error(
        `Invalid FIREBASE_SERVICE_ACCOUNT_JSON_BASE64. Error: ${e.message}`
      );
    }
  }

  // Option 3: Path to service account JSON file (BEST for local dev)
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (serviceAccountPath) {
    try {
      // Resolve relative path from backend root
      const resolvedPath = path.resolve(process.cwd(), serviceAccountPath);
      return require(resolvedPath);
    } catch (e) {
      throw new Error(
        `Failed to load FIREBASE_SERVICE_ACCOUNT_PATH (${serviceAccountPath}): ${e.message}`
      );
    }
  }

  return null;
}

/**
 * Initializes Firebase Admin SDK (singleton)
 */
function getFirebaseAdminApp() {
  if (app) return app;

  const serviceAccount = getServiceAccountFromEnv();
  if (!serviceAccount) {
    throw new Error(
      'Firebase Admin not configured. ' +
      'Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON_BASE64'
    );
  }

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  return app;
}

/**
 * Returns Firebase Admin instance
 */
function getAdmin() {
  getFirebaseAdminApp();
  return admin;
}

module.exports = { getAdmin };
