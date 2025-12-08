import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged as firebaseOnAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { User } from "../types";

export const authService = {
    signIn: async (): Promise<User | null> => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            return {
                name: user.displayName || 'User',
                email: user.email || '',
                picture: user.photoURL || ''
            };
        } catch (error) {
            console.error("Error signing in", error);
            throw error;
        }
    },

    signOut: async (): Promise<void> => {
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            console.error("Error signing out", error);
        }
    },

    onAuthStateChanged: (callback: (user: User | null) => void): (() => void) => {
        return firebaseOnAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                callback({
                    name: firebaseUser.displayName || 'User',
                    email: firebaseUser.email || '',
                    picture: firebaseUser.photoURL || ''
                });
            } else {
                callback(null);
            }
        });
    },
};