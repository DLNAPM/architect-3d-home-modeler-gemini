import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { LogOut, ChevronDown } from 'lucide-react';

interface UserProfileMenuProps {
  user: User;
  onSignOut: () => void;
}

const UserProfileMenu: React.FC<UserProfileMenuProps> = ({ user, onSignOut }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 focus:ring-brand-500"
      >
        <img className="h-8 w-8 rounded-full" src={user.picture} alt="User avatar" />
        <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-200">{user.name}</span>
        <ChevronDown className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none animate-scale-in-ver-top" role="menu" aria-orientation="vertical" aria-labelledby="menu-button">
          <div className="py-1" role="none">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
            </div>
            <button
              onClick={() => {
                onSignOut();
                setIsOpen(false);
              }}
              className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              role="menuitem"
            >
              <LogOut className="h-4 w-4 text-gray-500" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileMenu;