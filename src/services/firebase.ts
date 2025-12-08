import * as firebaseAppModule from 'firebase/app';

// Workaround for potential type definition mismatch where initializeApp/FirebaseApp are not found by TS.
const firebaseApp = firebaseAppModule as any;
const initializeApp = firebaseApp.initializeApp;

// Define the config interface
interface FirebaseConfig {
  apiKey: string | undefined;
  authDomain: string | undefined;
  projectId: string | undefined;
  storageBucket: string | undefined;
  messagingSenderId: string | undefined;
  appId: string | undefined;
  measurementId: string | undefined;
}

const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

let app: any | undefined;

// Check if critical config is present
const isConfigValid = firebaseConfig.apiKey && firebaseConfig.authDomain;

if (isConfigValid) {
    try {
        if (initializeApp) {
            app = initializeApp(firebaseConfig);
            console.log("Firebase initialized successfully");
        } else {
             console.error("Firebase initializeApp is not available via import");
        }
    } catch (error) {
        console.error("Firebase initialization failed:", error);
    }
} else {
    console.warn("Firebase configuration is missing or incomplete. Please check your environment variables in Render.com.");
    // In dev, you might want to log which keys are missing
    if (!firebaseConfig.apiKey) console.warn("Missing VITE_FIREBASE_API_KEY");
}

export { app };