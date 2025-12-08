import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD9wVfpTCCLojE-yRIFzNoJOID1jp9IwzY",
  authDomain: "architect-3d-home-modeler.firebaseapp.com",
  projectId: "architect-3d-home-modeler",
  storageBucket: "architect-3d-home-modeler.firebasestorage.app",
  messagingSenderId: "762702816387",
  appId: "1:762702816387:web:a25dc9f358b8bf45ce67b6",
  measurementId: "G-ZMZ7K9SQ72"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };