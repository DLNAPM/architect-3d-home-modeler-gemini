import { User } from '../types';

export const authService = {
  signIn: async (): Promise<User | null> => {
    console.warn("Authentication is disabled.");
    return null;
  },

  signOut: async (): Promise<void> => {
    console.warn("Authentication is disabled.");
  },

  onAuthStateChanged: (callback: (user: User | null) => void): (() => void) => {
    callback(null);
    return () => {};
  },
};