
import React from 'react';

interface LoadingOverlayProps {
  message: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex flex-col items-center justify-center">
      <div className="w-16 h-16 border-4 border-t-4 border-gray-200 border-t-brand-500 rounded-full animate-spin"></div>
      <p className="mt-4 text-white text-lg font-semibold">{message || 'Processing...'}</p>
    </div>
  );
};

export default LoadingOverlay;
