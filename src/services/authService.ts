import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut, 
    onAuthStateChanged, 
    User as FirebaseUser,
    Auth
} from 'firebase/auth';
import { app } from './firebase';
import { User } from '../types';

let auth: Auth | undefined;

// Initialize auth if app is available
if (app) {
    try {
        auth = getAuth(app);
    } catch (e) {
        console.error("Failed to initialize Firebase Auth:", e);
    }
}

export const authService = {
    signIn: async (): Promise<User | null> => {
        if (!auth) {
            console.error("Authentication is disabled: Firebase not initialized.");
            throw new Error("Authentication service is unavailable.");
        }

        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            return {
                name: user.displayName || 'User',
                email: user.email || '',
                picture: user.photoURL || '',
            };
        } catch (error) {
            console.error("Error signing in with Google", error);
            throw error;
        }
    },

    signOut: async (): Promise<void> => {
        if (!auth) return;
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out", error);
        }
    },

    onAuthStateChanged: (callback: (user: User | null) => void): (() => void) => {
        if (!auth) {
            // If auth is not active, immediately return null and a no-op unsubscribe
            callback(null);
            return () => {};
        }

        return onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                const user: User = {
                    name: firebaseUser.displayName || 'User',
                    email: firebaseUser.email || '',
                    picture: firebaseUser.photoURL || '',
                };
                callback(user);
            } else {
                callback(null);
            }
        });
    },
};
