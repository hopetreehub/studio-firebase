import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

// Check if running on the client side before proceeding
if (typeof window !== 'undefined') {
  // Check if all required config values are present and valid strings
  const isConfigValid = 
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId;

  if (isConfigValid) {
    try {
      // Initialize Firebase
      app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      auth = getAuth(app);
    } catch (error) {
      console.error("Firebase initialization error:", error);
      // If initialization fails for any reason, ensure app and auth are null
      app = null;
      auth = null;
    }
  } else {
    // This warning is crucial for developers to identify configuration issues.
    console.warn(
      "Firebase configuration is missing or incomplete. " +
      "Please check your .env file and ensure all NEXT_PUBLIC_FIREBASE_* variables are set correctly. " +
      "Authentication features will be disabled."
    );
  }
}

export { app, auth };
