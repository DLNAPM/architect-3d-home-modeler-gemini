import firebase from 'firebase/app';
import 'firebase/auth';
import { app } from './firebase'; // Import app to ensure initialization
import { User } from '../types';

export const authService = {
    signIn: async (): Promise<User | null> => {
        // Ensure auth is available
        if (!firebase.auth) {
             console.error("Firebase Auth not initialized");
             return null;
        }

        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            const result = await firebase.auth().signInWithPopup(provider);
            const user = result.user;
            return {
                name: user?.displayName || 'User',
                email: user?.email || '',
                picture: user?.photoURL || ''
            };
        } catch (error) {
            console.error("Error signing in", error);
            return null;
        }
    },

    signOut: async (): Promise<void> => {
        try {
            await firebase.auth().signOut();
        } catch (error) {
            console.error("Error signing out", error);
        }
    },

    onAuthStateChanged: (callback: (user: User | null) => void): (() => void) => {
        if (!firebase.auth) return () => {};
        
        return firebase.auth().onAuthStateChanged((firebaseUser) => {
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