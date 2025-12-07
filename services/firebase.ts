import { initializeApp, FirebaseApp } from "firebase/app";

// FIX: Use process.env instead of import.meta.env to fix ImportMeta errors.
const apiKey = process.env.VITE_FIREBASE_API_KEY;
const authDomain = process.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
const storageBucket = process.env.VITE_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.VITE_FIREBASE_APP_ID;

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId
};

let app: FirebaseApp | undefined;

// Only initialize Firebase if the API key is present.
// This prevents the "Uncaught FirebaseError: (auth/invalid-api-key)" crash.
if (apiKey) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
  }
} else {
  console.warn("Firebase API Key is missing. Authentication features will be disabled. Please check your .env.local file.");
}

export { app };