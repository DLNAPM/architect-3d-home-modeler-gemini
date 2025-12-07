import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyD9wVfpTCCLojE-yRIFzNoJOID1jp9IwzY",
  authDomain: "architect-3d-home-modeler.firebaseapp.com",
  projectId: "architect-3d-home-modeler",
  storageBucket: "architect-3d-home-modeler.firebasestorage.app",
  messagingSenderId: "762702816387",
  appId: "1:762702816387:web:a25dc9f358b8bf45ce67b6",
  measurementId: "G-ZMZ7K9SQ72"
};

const app = initializeApp(firebaseConfig);

export { app };