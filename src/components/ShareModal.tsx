
import React, { useState } from 'react';
import { X, Share2, Shield, AlertCircle } from 'lucide-react';
import { AccessLevel } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (email: string, permission: AccessLevel) => Promise<void>;
  designTitle: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, onShare, designTitle }) => {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<AccessLevel>('view');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
        setError('Please enter a valid email address.');
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
        await onShare(email, permission);
        setSuccess(true);
        setTimeout(() => {
            setSuccess(false);
            setEmail('');
            onClose();
        }, 1500);
    } catch (err) {
        setError("Failed to share project. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
            <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <Share2 className="h-5 w-5 text-brand-600" />
            Share Project
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 truncate">
            Sharing "{designTitle}"
        </p>

        {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
            </div>
        )}

        {success ? (
            <div className="py-8 text-center text-green-600 dark:text-green-400 font-medium animate-pulse">
                Successfully shared!
            </div>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Recipient Email (Google Account)
                    </label>
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Permission Level
                    </label>
                    <div className="relative">
                        <select
                            value={permission}
                            onChange={(e) => setPermission(e.target.value as AccessLevel)}
                            className="w-full p-2 pl-9 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none appearance-none"
                        >
                            <option value="view">View Only (Read Only)</option>
                            <option value="edit">Update (View & Edit)</option>
                        </select>
                        <Shield className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {permission === 'view' 
                            ? "User can view renderings but cannot make changes." 
                            : "User can generate new renderings and save changes."}
                    </p>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-md shadow-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? 'Sharing...' : 'Send Invitation'}
                    </button>
                </div>
            </form>
        )}
      </div>
    </div>
  );
};

export default ShareModal;
