import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase using the deployed config
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// Use the custom firestoreDatabaseId if specified, otherwise default
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");

console.log("Firebase initialized successfully with config:", firebaseConfig.projectId);

export { app, auth, db };