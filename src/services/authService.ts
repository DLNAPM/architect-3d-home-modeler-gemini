
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, onAuthStateChanged as firebaseOnAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { app } from './firebase';
import { User } from '../types';

let auth: any;
let googleProvider: any;

try {
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
} catch (error) {
    console.error("Auth initialization error", error);
}

// Transform Firebase User to App User
const mapUser = (firebaseUser: FirebaseUser | null): User | null => {
    if (!firebaseUser) return null;
    return {
        name: firebaseUser.displayName || 'User',
        email: firebaseUser.email || '',
        picture: firebaseUser.photoURL || '',
    };
};

export const authService = {
    signIn: async (): Promise<User | null> => {
        if (!auth) throw new Error("Auth not initialized");
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return mapUser(result.user);
        } catch (error) {
            console.error("Sign in error", error);
            throw error;
        }
    },

    signOut: async (): Promise<void> => {
        if (!auth) return;
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            console.error("Sign out error", error);
        }
    },

    onAuthStateChanged: (callback: (user: User | null) => void): (() => void) => {
        if (!auth) return () => {};
        return firebaseOnAuthStateChanged(auth, (firebaseUser) => {
            callback(mapUser(firebaseUser));
        });
    },
};
