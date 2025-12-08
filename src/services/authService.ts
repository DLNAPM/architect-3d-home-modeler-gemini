import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged as firebaseOnAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { User } from "../types";

// Local state to manage the user (both Firebase and Local Guest)
let currentUser: User | null = null;
const listeners: ((user: User | null) => void)[] = [];

// Initialize Firebase Listener once to sync Google Logins
firebaseOnAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
        // Real Google User found
        currentUser = {
            name: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            picture: firebaseUser.photoURL || ''
        };
        notifyListeners();
    } else {
        // Firebase says no user. 
        // We only clear our local state if the current user was NOT a local guest.
        // This prevents Firebase initialization (which starts as null) from wiping out a Local Guest session.
        if (currentUser && currentUser.email !== 'guest-local-session') {
            currentUser = null;
            notifyListeners();
        }
    }
});

const notifyListeners = () => {
    listeners.forEach(listener => listener(currentUser));
};

export const authService = {
    signIn: async (): Promise<User | null> => {
        const provider = new GoogleAuthProvider();
        // Force the Google account picker
        provider.setCustomParameters({
            prompt: 'select_account'
        });

        try {
            // This will trigger the firebaseOnAuthStateChanged above upon success
            await signInWithPopup(auth, provider);
            return currentUser;
        } catch (error) {
            console.error("Error signing in", error);
            throw error;
        }
    },

    signInGuest: async (): Promise<User | null> => {
        // Create a local guest user object
        // We use a specific ID to identify it as a local session
        currentUser = {
            name: "Guest Architect",
            email: "guest-local-session", 
            picture: "https://ui-avatars.com/api/?name=Guest+Architect&background=E5E7EB&color=374151"
        };
        
        notifyListeners();
        return Promise.resolve(currentUser);
    },

    signOut: async (): Promise<void> => {
        try {
            // If it's a real Firebase user, sign them out of Firebase
            if (currentUser && currentUser.email !== 'guest-local-session') {
                await firebaseSignOut(auth);
            }
        } catch (error) {
            console.error("Error signing out", error);
        } finally {
            // Always clear local state
            currentUser = null;
            notifyListeners();
        }
    },

    onAuthStateChanged: (callback: (user: User | null) => void): (() => void) => {
        listeners.push(callback);
        // Immediately trigger with current state so UI updates
        callback(currentUser);
        return () => {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        };
    },
};