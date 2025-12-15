
import React, { useState, useEffect } from 'react';
import { Home, Moon, Sun, PlusSquare, Search, LogIn, Save, HelpCircle, X, Sparkles, Cloud, Video, Layout, Share2 } from 'lucide-react';
import { User } from '../types';
import UserProfileMenu from './UserProfileMenu';

interface HeaderProps {
    user: User | null;
    onSignIn: () => void;
    onSignOut: () => void;
    onNewDesign: () => void;
    onSaveDesign: () => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    isSaving?: boolean;
    hasActiveDesign: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
    user, 
    onSignIn, 
    onSignOut, 
    onNewDesign, 
    onSaveDesign, 
    searchQuery, 
    onSearchChange,
    isSaving = false,
    hasActiveDesign
}) => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

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
        <>
            <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <Home className="text-brand-600 dark:text-brand-400 h-8 w-8" />
                        <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
                            Architect 3D
                        </h1>
                        <button 
                            onClick={() => setShowHelp(true)}
                            className="p-1.5 rounded-full text-gray-500 hover:text-brand-600 hover:bg-brand-50 dark:text-gray-400 dark:hover:text-brand-400 dark:hover:bg-gray-700 transition-colors"
                            aria-label="App Help & Information"
                            title="About Architect 3D"
                        >
                            <HelpCircle className="h-5 w-5" />
                        </button>
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
                                className="block w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 dark:focus:placeholder-gray-500 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                            />
                        </div>
                        
                        {hasActiveDesign && (
                            <button
                                onClick={onSaveDesign}
                                disabled={isSaving}
                                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Save current session to Cloud"
                            >
                                <Save className={`h-5 w-5 ${isSaving ? 'animate-pulse' : ''}`} />
                                <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save Design'}</span>
                            </button>
                        )}

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
                        
                        {user ? (
                        <UserProfileMenu user={user} onSignOut={onSignOut} />
                        ) : (
                        <button 
                            onClick={onSignIn}
                            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium bg-brand-600 text-white rounded-md hover:bg-brand-700 transition-colors"
                        >
                            <LogIn className="h-5 w-5" />
                            <span>Sign In</span>
                        </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Help Modal */}
            {showHelp && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={() => setShowHelp(false)}
                >
                    <div 
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Home className="h-6 w-6 text-brand-600" />
                                    About Architect 3D
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">AI-Powered Home Design & Visualization</p>
                            </div>
                            <button 
                                onClick={() => setShowHelp(false)}
                                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                <X className="h-6 w-6 text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-brand-500" />
                                        How It Works
                                    </h3>
                                    <ol className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                                        <li className="flex gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs">1</span>
                                            <p><strong className="block text-gray-900 dark:text-white">Describe Your Vision</strong> Enter a detailed text description or use voice input to describe your dream home. You can also upload floor plans or reference images.</p>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs">2</span>
                                            <p><strong className="block text-gray-900 dark:text-white">Generate & Visualize</strong> The AI creates a structured house plan and a photorealistic 3D rendering of the exterior.</p>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs">3</span>
                                            <p><strong className="block text-gray-900 dark:text-white">Customize Rooms</strong> Select specific rooms (Kitchen, Living Room, etc.) to customize details like flooring, lighting, and style, then generate interior views.</p>
                                        </li>
                                    </ol>
                                </div>

                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Layout className="h-5 w-5 text-purple-500" />
                                        Advanced Features
                                    </h3>
                                    <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                                        <li className="flex items-start gap-2">
                                            <Cloud className="h-4 w-4 text-brand-500 mt-1" />
                                            <span><strong>Cloud Sync:</strong> Sign in with Google to save your designs to the cloud. Access your sessions from any computer or mobile device.</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Share2 className="h-4 w-4 text-indigo-500 mt-1" />
                                            <span><strong>Project Sharing:</strong> Collaborate with others by inviting them to view or edit your designs via email.</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Video className="h-4 w-4 text-pink-500 mt-1" />
                                            <span><strong>Cinematic Video Tours:</strong> Generate 30-second AI video tours of your property. (Requires 10+ liked renderings for Marketing Videos).</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Sparkles className="h-4 w-4 text-yellow-500 mt-1" />
                                            <span><strong>Interactive Slideshows:</strong> View your favorite designs in a presentation mode with custom transitions and background music.</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                                <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2 text-sm">Pro Tip</h4>
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                    Be specific in your descriptions! Mentioning "Golden hour lighting", "Mid-century modern furniture", or "Matte black finishes" helps the AI create exactly what you envision.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
