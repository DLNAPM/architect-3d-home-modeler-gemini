import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged as firebaseOnAuthStateChanged, signInAnonymously } from "firebase/auth";
import { auth } from "./firebase";
import { User } from "../types";

export const authService = {
    signIn: async (): Promise<User | null> => {
        const provider = new GoogleAuthProvider();
        // Force the Google account picker to show every time, allowing users to switch accounts
        provider.setCustomParameters({
            prompt: 'select_account'
        });

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

    signInGuest: async (): Promise<User | null> => {
        try {
            const result = await signInAnonymously(auth);
            const user = result.user;
            // Return a formatted user object for the guest
            // We use the UID as the email to ensure a unique key for the database
            return {
                name: "Guest Architect",
                email: user.uid, 
                picture: "https://ui-avatars.com/api/?name=Guest&background=E5E7EB&color=374151"
            };
        } catch (error) {
            console.error("Error signing in as guest", error);
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
                if (firebaseUser.isAnonymous) {
                    // Handle anonymous guest user state persistence
                    callback({
                        name: 'Guest Architect',
                        email: firebaseUser.uid,
                        picture: "https://ui-avatars.com/api/?name=Guest&background=E5E7EB&color=374151"
                    });
                } else {
                    // Handle logged in Google user
                    callback({
                        name: firebaseUser.displayName || 'User',
                        email: firebaseUser.email || '',
                        picture: firebaseUser.photoURL || ''
                    });
                }
            } else {
                callback(null);
            }
        });
    },
};