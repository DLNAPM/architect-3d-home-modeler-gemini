import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged as firebaseOnAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { app } from './firebase';
import { User } from '../types';

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export const authService = {
    signIn: async (): Promise<User | null> => {
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            return {
                name: user.displayName || 'User',
                email: user.email || '',
                picture: user.photoURL || ''
            };
        } catch (error) {
            console.error("Error signing in with Google", error);
            // If the popup is closed by the user, we just return null without crashing
            return null;
        }
    },

    signOut: async (): Promise<void> => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out", error);
        }
    },

    onAuthStateChanged: (callback: (user: User | null) => void): (() => void) => {
        return firebaseOnAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                const user: User = {
                    name: firebaseUser.displayName || 'User',
                    email: firebaseUser.email || '',
                    picture: firebaseUser.photoURL || ''
                };
                callback(user);
            } else {
                callback(null);
            }
        });
    },
};