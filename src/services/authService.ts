import { getAuth, signInWithPopup, signOut, GoogleAuthProvider, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { app } from "./firebase";
import { User } from '../types';

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Map Firebase user to our App's User type
const mapUser = (firebaseUser: FirebaseUser | null): User | null => {
  if (!firebaseUser) return null;
  return {
    name: firebaseUser.displayName || "Architect",
    email: firebaseUser.email || "",
    picture: firebaseUser.photoURL || "",
  };
};

export const authService = {
  signIn: async (): Promise<User | null> => {
    try {
      const result = await signInWithPopup(auth, provider);
      return mapUser(result.user);
    } catch (error) {
      console.error("Sign-in error:", error);
      throw error;
    }
  },

  signOut: async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign-out error:", error);
      throw error;
    }
  },

  onAuthStateChanged: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      callback(mapUser(firebaseUser));
    });
  },
};