
import admin from 'firebase-admin';

// Check if the app is already initialized to prevent re-initialization.
// This is important for Next.js's hot-reloading environment.
if (!admin.apps.length) {
  // This will throw a detailed error if credentials are not found or are invalid,
  // which is better than catching it and causing a secondary, less clear error.
  // The hosting environment (or GOOGLE_APPLICATION_CREDENTIALS) should provide the necessary credentials.
  // In a standard Firebase/GCP environment, the project ID is often inferred automatically.
  // Explicitly setting it can sometimes cause issues if not managed carefully across environments.
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

// Get the firestore instance. This will only work if initializeApp was successful.
const firestore = admin.firestore();

export { admin, firestore };
