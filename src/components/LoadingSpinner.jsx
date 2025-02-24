import React from 'react';
// Import the image from the components folder
import loadingImage from './logo.png';

const LoadingSpinner = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="flex flex-col items-center space-y-6">
        {/* Image positioned above the spinner */}
        <div className="mb-6">
          <img 
            src={loadingImage} 
            alt="Loading" 
            className="w-32 h-32 object-contain"
            style={{ filter: 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))' }}
          />
        </div>
        
        <div className="relative">
          {/* Circular loading indicator */}
          <div className="w-32 h-32 border-8 border-blue-100 rounded-full"></div>
          <div className="absolute inset-0 border-8 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          
          {/* Pulsing effect */}
          <div className="absolute inset-1/4 bg-blue-500 opacity-30 rounded-full animate-ping"></div>
        </div>
        
        {/* Loading text with typing animation */}
        <div className="text-2xl font-semibold text-blue-800 animate-pulse">
          Loading...
        </div>
        
        {/* Animated loading bar */}
        <div className="w-64 h-2 bg-blue-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 transform animate-loading-bar"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;