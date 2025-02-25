import React from 'react';

const SlideWrapper = ({ children, className = '' }) => {
  return (
    <div className="w-full h-screen flex items-center justify-center p-4 bg-gray-100">
      <div className="relative w-full max-w-[177.78vh] max-h-[100vh]"> {/* 16:9 ratio */}
        <div className="aspect-w-16 aspect-h-9">
          <div className={`w-full h-full ${className}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlideWrapper;