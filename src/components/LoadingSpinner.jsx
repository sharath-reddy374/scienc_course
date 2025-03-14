import React, { useState, useEffect } from 'react';
// Import your logo
import logoImage from '../components/logo.png';

const FreshLoadingScreen = ({ customImage = logoImage }) => {
  const learningTips = [
    "Break complex topics into smaller, manageable chunks for better understanding.",
    "Try explaining concepts to someone else to test your knowledge.",
    "Regular short study sessions are more effective than cramming.",
    "Connect new information to things you already know.",
    "Take handwritten notes to improve retention.",
    "Use visual aids like mind maps to organize information.",
    "Test yourself frequently rather than just re-reading material.",
    "Get enough sleep - it helps consolidate new memories.",
    "Teach what you've learned to someone else to solidify your understanding.",
    "Ask 'why' and 'how' questions to deepen your understanding.",
    "Alternate between different subjects rather than focusing on just one.",
    "Review material right before sleep to help with memory consolidation.",
  ];

  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Rotate through tips every 4 seconds
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTipIndex((prevIndex) => {
        // Ensure we always move to a different tip
        const nextIndex = Math.floor(Math.random() * (learningTips.length - 1));
        // Adjust to avoid the current tip
        return nextIndex >= prevIndex ? nextIndex + 1 : nextIndex;
      });
    }, 4000);

    return () => clearInterval(tipInterval);
  }, []);

  // Animate progress bar
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 15;
        }
        return prev + 1;
      });
    }, 150);

    return () => clearInterval(progressInterval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
      {/* Background decorative elements */}
      <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="rounded-2xl bg-white shadow-xl p-6 max-w-md mx-4 flex flex-col items-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-200 rounded-full opacity-20"></div>
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-blue-200 rounded-full opacity-20"></div>
        
        {/* Logo image */}
        <div className="mb-4 relative">
          {customImage ? (
            <div className="relative w-24 h-24 flex items-center justify-center">
              <img
                src={customImage}
                alt="Logo"
                className="max-w-full max-h-full object-contain"
              />
              {/* Subtle pulsing effect behind logo */}
              <div className="absolute inset-0 rounded-full bg-blue-100 animate-pulse opacity-30" style={{ animationDuration: '3s' }}></div>
            </div>
          ) : (
            <div className="relative">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24"
                className="w-16 h-16 text-indigo-600" 
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15.5 13a5 5 0 1 0-5.5 5"></path>
                <path d="M17 8a5 5 0 1 0 0 8"></path>
                <path d="M12 8a5 5 0 1 0 0 8"></path>
                <path d="M10 13a5 5 0 1 0 6 0"></path>
              </svg>
              
              {/* Pulsing circle behind the icon */}
              <div className="absolute inset-0 rounded-full bg-indigo-200 animate-ping opacity-30" style={{ animationDuration: '3s' }}></div>
            </div>
          )}
        </div>
        
        {/* Creative loading text with gradient */}
        <h3 className="text-xl font-bold mb-1 bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-700 bg-clip-text text-transparent">
          Preparing Your Experience
        </h3>
        
        <p className="text-indigo-700/80 text-sm mb-5">Just a moment while we load...</p>
        
        {/* Learning tips section */}
        <div className="mb-6 text-center px-4">
          <div className="px-3 py-1 rounded-md text-white text-sm font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 inline-block mb-2">
            Learning Tip
          </div>
          <div 
            className="text-gray-700 text-sm bg-indigo-50/50 rounded-lg border border-indigo-100 p-4 transition-all duration-300 ease-in-out"
            key={currentTipIndex}
          >
            {learningTips[currentTipIndex]}
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-100 rounded-full mb-2 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        {/* Small animated dots */}
        <div className="flex space-x-1.5 mt-3">
          {[0, 1, 2].map((i) => (
            <div 
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-indigo-500"
              style={{
                opacity: (progress % 3 === i) ? 1 : 0.3,
                transform: (progress % 3 === i) ? 'scale(1.2)' : 'scale(1)',
                transition: 'all 0.3s ease'
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FreshLoadingScreen;