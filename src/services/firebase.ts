import { initializeApp } from 'firebase/app';

// Use environment variables if available, otherwise fall back to the provided configuration keys
// to ensure the application works immediately.
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyD9wVfpTCCLojE-yRIFzNoJOID1jp9IwzY",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "architect-3d-home-modeler.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "architect-3d-home-modeler",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "architect-3d-home-modeler.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "762702816387",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:762702816387:web:a25dc9f358b8bf45ce67b6",
  measurementId: "G-ZMZ7K9SQ72"
};

const app = initializeApp(firebaseConfig);

export { app };