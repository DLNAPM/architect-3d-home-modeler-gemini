
import React, { useState, useEffect } from 'react';

const Footer: React.FC = () => {
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    // Generate timestamp in YYYYMMDDHHMISS format
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    setLastUpdated(`${year}${month}${day}${hours}${minutes}${seconds}`);
  }, []);

  return (
    <footer className="w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-6 mt-auto z-10 relative">
        <div className="container mx-auto px-4 text-center">
            <p className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2">
                A C.&.S.H. Group Properties A.I. APP
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-y-1 gap-x-4 text-xs text-gray-500 dark:text-gray-400">
                <span>&copy; {currentYear} C.&.S.H. Group Properties</span>
                <span className="hidden sm:inline text-gray-300 dark:text-gray-700">|</span>
                <span className="font-mono">Last Updated: {lastUpdated}</span>
            </div>
        </div>
    </footer>
  );
};

export default Footer;
