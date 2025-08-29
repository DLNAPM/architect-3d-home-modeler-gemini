import React, { useState, useEffect } from 'react';
import { Home, Moon, Sun, PlusSquare, Search } from 'lucide-react';

// FIX: Add searchQuery and onSearchChange to HeaderProps to enable search functionality.
interface HeaderProps {
    onNewDesign: () => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onNewDesign, searchQuery, onSearchChange }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const isDark = document.documentElement.classList.contains('dark');
        setIsDarkMode(isDark);
    }, []);

    const toggleDarkMode = () => {
        if (isDarkMode) {
            document.documentElement.classList.remove('dark');
        } else {
            document.documentElement.classList.add('dark');
        }
        setIsDarkMode(!isDarkMode);
    };

    return (
        <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <Home className="text-brand-600 dark:text-brand-400 h-8 w-8" />
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
                        Architect 3D Home Modeler
                    </h1>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-4">
                    <div className="relative hidden md:block">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Search className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search designs..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="block w-full pl-9 p-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-brand-500 dark:focus:border-brand-500"
                        />
                    </div>
                    <button
                        onClick={onNewDesign}
                        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                    >
                        <PlusSquare className="h-5 w-5" />
                        <span className="hidden sm:inline">New Design</span>
                    </button>
                    <button
                        onClick={toggleDarkMode}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Toggle dark mode"
                    >
                        {isDarkMode ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-gray-600" />}
                    </button>
                    <button className="px-3 py-2 text-sm font-medium bg-brand-600 text-white rounded-md hover:bg-brand-700 transition-colors hidden md:block">
                        Sign In
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;