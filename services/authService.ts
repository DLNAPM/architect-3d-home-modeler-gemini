import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { app } from './firebase';
import { User } from '../types';

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export const authService = {
    /**
     * Initiates Google Sign-In flow using Firebase.
     */
    signIn: async (): Promise<User | null> => {
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            if (user) {
                return {
                    name: user.displayName || 'User',
                    email: user.email || '',
                    picture: user.photoURL || `https://i.pravatar.cc/150?u=${encodeURIComponent(user.email || user.uid)}`,
                };
            }
            return null;
        } catch (error) {
            console.error("Error during sign-in:", error);
            // Handle specific errors like popup closed by user if needed
            return null;
        }
    },

    /**
     * Signs the current user out using Firebase.
     */
    signOut: async (): Promise<void> => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error during sign-out:", error);
        }
    },

    /**
     * Subscribes a callback to Firebase's authentication state changes.
     * @param callback The function to call when the auth state changes.
     * @returns An unsubscribe function from Firebase.
     */
    onAuthStateChanged: (callback: (user: User | null) => void): (() => void) => {
        return onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                const appUser: User = {
                    name: firebaseUser.displayName || 'User',
                    email: firebaseUser.email || '',
                    picture: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${encodeURIComponent(firebaseUser.email || firebaseUser.uid)}`,
                };
                callback(appUser);
            } else {
                callback(null);
            }
        });
    },
};