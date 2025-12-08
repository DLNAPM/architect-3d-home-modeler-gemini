import { User } from '../types';

let currentUser: User | null = null;
const listeners: ((user: User | null) => void)[] = [];

export const authService = {
    signIn: async (): Promise<User | null> => {
        // Simulate network delay for realism
        await new Promise(resolve => setTimeout(resolve, 600));
        
        currentUser = {
            name: "Guest Architect",
            email: "guest@architect3d.com",
            picture: "https://ui-avatars.com/api/?name=Guest+Architect&background=0D8ABC&color=fff"
        };
        
        listeners.forEach(listener => listener(currentUser));
        return currentUser;
    },

    signOut: async (): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, 300));
        currentUser = null;
        listeners.forEach(listener => listener(null));
    },

    onAuthStateChanged: (callback: (user: User | null) => void): (() => void) => {
        listeners.push(callback);
        // Immediately trigger with current state
        callback(currentUser);
        return () => {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        };
    },
};