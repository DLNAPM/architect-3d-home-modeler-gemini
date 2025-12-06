import { initializeApp } from "firebase/app";

// Your web app's Firebase configuration using environment variables
// injected by Vite. Ensure you have a .env.local file in your project root.
const firebaseConfig = {
  apiKey: "AIzaSyD9wVfpTCCLojE-yRIFzNoJOID1jp9IwzY",
  authDomain: "architect-3d-home-modeler.firebaseapp.com",
  projectId: "architect-3d-home-modeler",
  storageBucket: "architect-3d-home-modeler.firebasestorage.app",
  messagingSenderId: "762702816387",
  appId: "1:762702816387:web:a25dc9f358b8bf45ce67b6"
};

// Validate that the essential Firebase config is present.
// This helps the user debug if they haven't set up their .env.local file.
if (!firebaseConfig.apiKey) {
    throw new Error("Firebase API Key is missing. Please create a .env.local file in the project root and add your VITE_FIREBASE_API_KEY.");
}


// Initialize Firebase
export const app = initializeApp(firebaseConfig);
