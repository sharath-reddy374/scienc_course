import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="flex flex-col items-center space-y-6">
        <div className="relative">
          {/* Circular loading indicator */}
          <div className="w-32 h-32 border-8 border-blue-100 rounded-full"></div>
          <div className="absolute inset-0 border-8 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          
          {/* Pulsing inner circle */}
          <div className="absolute inset-1/4 bg-blue-500 rounded-full animate-ping"></div>
        </div>
        
        {/* Loading text with typing animation */}
        <div className="text-2xl font-semibold text-blue-800 animate-pulse">
          Loading Next Slide...
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