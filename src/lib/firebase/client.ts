import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";

// Using the hardcoded configuration provided by the user for stability.
const firebaseConfig = {
  apiKey: "AIzaSyDgZBb3PEMFe58TxXFyeEAh6pzpeG_P9lg",
  authDomain: "innerspell-an7ce.firebaseapp.com",
  projectId: "innerspell-an7ce",
  storageBucket: "innerspell-an7ce.firebasestorage.app",
  messagingSenderId: "944680989471",
  appId: "1:944680989471:web:ebd8a91794fb525e7f362a"
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

if (firebaseConfig.apiKey) {
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    auth = getAuth(app);
  } catch (error) {
    console.error("Firebase initialization error:", error);
    // If initialization fails, ensure app and auth are null
    app = null;
    auth = null;
  }
} else {
  // This warning is helpful for developers.
  console.warn("Firebase configuration is missing. Authentication features will be disabled.");
}


export { app, auth };
