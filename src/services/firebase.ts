import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuration uses environment variables injected via vite.config.ts
// Fallback values are provided to ensure the app works even if env vars are missing in the build environment
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyD9wVfpTCCLojE-yRIFzNoJOID1jp9IwzY",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "architect-3d-home-modeler.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "architect-3d-home-modeler",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "architect-3d-home-modeler.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "762702816387",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:762702816387:web:a25dc9f358b8bf45ce67b6",
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || "G-ZMZ7K9SQ72"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("Firebase initialized successfully");

export { app, auth, db };