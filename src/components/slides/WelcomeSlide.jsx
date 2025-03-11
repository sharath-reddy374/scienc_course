import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SlideWrapper from '../common/SlideWrapper';

// Loading component as a separate function component
const LoadingDisplay = () => {
  return (
    <SlideWrapper className="bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="relative">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="rounded-full h-20 w-20 border-4 border-blue-600 border-t-transparent mb-8"
            ></motion.div>
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full border-4 border-blue-300 border-opacity-50"
            ></motion.div>
          </div>
          <motion.div className="flex flex-col items-center">
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-blue-700 font-semibold text-xl mb-2"
            >
              Preparing your course
            </motion.p>
            <motion.div 
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="flex space-x-2"
            >
              <span className="h-2 w-2 bg-blue-600 rounded-full"></span>
              <motion.span 
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                className="h-2 w-2 bg-blue-600 rounded-full"
              ></motion.span>
              <motion.span 
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                className="h-2 w-2 bg-blue-600 rounded-full"
              ></motion.span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </SlideWrapper>
  );
};

// Error display component for when content fails to load
const ErrorDisplay = ({ onRetry }) => {
  return (
    <SlideWrapper className="bg-gradient-to-br from-red-50 to-pink-100">
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center max-w-md text-center">
          <div className="mb-6">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-red-500 text-6xl mb-4"
            >
              ⚠️
            </motion.div>
          </div>
          <motion.h2
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-2xl font-bold text-red-700 mb-4"
          >
            Oops! We had trouble loading the course content
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-red-600 mb-8"
          >
            There was an error preparing your learning experience. This could be due to a temporary issue with our content service.
          </motion.p>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRetry}
            className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-colors"
          >
            Try Again
          </motion.button>
        </div>
      </div>
    </SlideWrapper>
  );
};

const WelcomeSlide = ({ 
  courseData, 
  content, 
  onNext, 
  onPrevious,
  onRefreshContent 
}) => {
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const contentRequested = useRef(false);
  const retryCount = useRef(0);
  
  useEffect(() => {
    // Animation sequence effect with staggered timing
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Reset error state when content becomes available
  useEffect(() => {
    if (content) {
      setHasError(false);
    }
  }, [content]);

  // Proactively request content if not available
  useEffect(() => {
    const fetchContent = async () => {
      if (!content && onRefreshContent && !contentRequested.current) {
        console.log('No welcome content available, attempting to fetch');
        contentRequested.current = true;
        try {
          await onRefreshContent();
        } catch (error) {
          console.error('Error refreshing content:', error);
          setHasError(true);
        }
      }
    };
    
    fetchContent();
    
    if (content) {
      contentRequested.current = false;
    }
  }, [content, onRefreshContent]);

  // Handle retry if there's an error
  const handleRetry = () => {
    if (retryCount.current < 3) {
      setHasError(false);
      contentRequested.current = false;
      retryCount.current += 1;
      
      // Give the user some visual feedback that we're trying again
      setTimeout(() => {
        if (onRefreshContent) {
          onRefreshContent();
        }
      }, 500);
    } else {
      // If we've tried several times, show a more permanent error
      // or use fallback content
      console.error('Multiple retry attempts failed');
      // You could load fallback content here if available
    }
  };

  // Show error state
  if (hasError) {
    return <ErrorDisplay onRetry={handleRetry} />;
  }

  // Loading state - render separate component
  if (!content) {
    return <LoadingDisplay />;
  }

  // Validate content structure and provide fallbacks for missing properties
  const validateContent = (content) => {
    // Return a new object with defaults for missing properties
    return {
      title: content?.title || courseData?.title || "Course Title",
      tagline: content?.tagline || "",
      description: content?.description || "",
      icon: content?.icon || "🔍"
    };
  };

  // Get validated content with fallbacks
  const validatedContent = validateContent(content);
  const { title, tagline, description, icon } = validatedContent;

  return (
    <SlideWrapper className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 font-sans">
      {/* Main container with 16:9 aspect ratio */}
      <div className="w-full h-full overflow-hidden">
        {/* Dynamic background elements based on subject */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          {/* Abstract decorative elements that work for any subject */}
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 0.07, y: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute top-20 right-[15%] w-32 h-32 border-4 border-blue-800 rounded-full transform rotate-12"
          ></motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 0.07, y: 0 }}
            transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
            className="absolute bottom-[25%] left-[10%] w-40 h-40 border-4 border-blue-800 rounded-lg transform -rotate-6"
          ></motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.07, scale: 1 }}
            transition={{ duration: 1.5, delay: 0.4, ease: "easeOut" }}
            className="absolute top-[30%] left-[20%] w-24 h-24 border-4 border-blue-800 transform rotate-45"
          ></motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.07, scale: 1 }}
            transition={{ duration: 1.5, delay: 0.6, ease: "easeOut" }}
            className="absolute bottom-[15%] right-[15%] w-36 h-36 border-4 border-blue-800 rounded-lg transform -rotate-12"
          ></motion.div>
          
          {/* Enhanced gradient blobs with better animation */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: 0.15 
            }}
            transition={{ 
              scale: { duration: 15, repeat: Infinity, ease: "easeInOut" },
              opacity: { duration: 2, ease: "easeOut" }
            }}
            className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl"
          ></motion.div>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: [1.1, 0.9, 1.1],
              opacity: 0.15 
            }}
            transition={{ 
              scale: { duration: 18, repeat: Infinity, ease: "easeInOut" },
              opacity: { duration: 2, delay: 0.5, ease: "easeOut" }
            }}
            className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl"
          ></motion.div>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: [0.9, 1.1, 0.9],
              opacity: 0.15 
            }}
            transition={{ 
              scale: { duration: 20, repeat: Infinity, ease: "easeInOut" },
              opacity: { duration: 2, delay: 1, ease: "easeOut" }
            }}
            className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl"
          ></motion.div>
        </div>

        {/* Content Container - Centered in 16:9 space */}
        <div className="w-full h-full flex items-center justify-center py-10 px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-4xl"
          >
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              {/* Left side - Course Icon */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="flex-shrink-0"
              >
                <div className="relative">
                  <motion.div 
                    animate={{ 
                      rotate: [0, 5, 0, -5, 0]
                    }}
                    transition={{ 
                      duration: 8,
                      repeat: Infinity,
                      repeatType: "mirror",
                      ease: "easeInOut"
                    }}
                    className="flex items-center justify-center w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full shadow-xl text-5xl md:text-6xl text-white"
                  >
                    {icon}
                  </motion.div>
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-blue-400 rounded-full filter blur-xl opacity-30"
                  />
                </div>
              </motion.div>

              {/* Right side - Content */}
              <div className="flex-grow">
                {/* Title with animated underline */}
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="mb-4"
                >
                  <h1 className="text-4xl md:text-5xl font-bold text-blue-700 mb-2 leading-tight">
                    {title}
                  </h1>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "40%" }}
                    transition={{ duration: 1, delay: 0.8 }}
                    className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mb-4"
                  />
                </motion.div>

                {/* Tagline */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="text-xl text-indigo-600 mb-6 font-light"
                >
                  {tagline}
                </motion.p>

                {/* Description */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                  className="bg-white bg-opacity-50 backdrop-filter backdrop-blur-sm p-6 rounded-xl shadow-md mb-8 border border-blue-100"
                >
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {description}
                  </p>
                </motion.div>

                {/* Start Button */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 1 }}
                  className="flex justify-start"
                >
                  <motion.button
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.5)"
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onNext}
                    className="group relative px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg rounded-xl shadow-lg overflow-hidden"
                  >
                    {/* Button hover effect */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    ></motion.div>
                    
                    {/* Button content with icon */}
                    <div className="relative flex items-center space-x-2">
                      <span>Start Your Adventure</span>
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </motion.div>
                    </div>
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </SlideWrapper>
  );
};

export default WelcomeSlide;