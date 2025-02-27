// src/components/slides/TypesSlide.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SlideWrapper from '../common/SlideWrapper';
import DetailSlide from './DetailSlide';

const TypesSlide = ({ courseData, content, onNext, onPrevious, onRefreshContent, isRefreshing }) => {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  
  // Simple icon alternatives
  const icons = {
    refresh: "🔄",
    next: "→",
    prev: "←"
  };
  
  // Debug logging
  useEffect(() => {
    console.log('TypesSlide received content:', content);
    console.log('TypesSlide isRefreshing:', isRefreshing);
  }, [content, isRefreshing]);
  
  useEffect(() => {
    console.log('TypesSlide selectedTopic changed to:', selectedTopic);
  }, [selectedTopic]);

  // If content isn't available, don't render the slide
  if (!content) {
    console.log('TypesSlide: No content available');
    return (
      <SlideWrapper className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative">
        <div className="flex flex-col items-center justify-center h-full">
          <motion.div 
            animate={{ 
              rotate: 360 
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-6"
          ></motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-blue-600 font-medium text-lg"
          >
            Loading core concepts...
          </motion.p>
        </div>
      </SlideWrapper>
    );
  }

  // When a topic is selected, fetch the details if needed
  const handleTopicSelect = (index) => {
    console.log('TypesSlide: Topic selected:', index);
    setSelectedTopic(index);
    
    // If we have a refresh handler and we're selecting a topic, fetch its details
    if (onRefreshContent) {
      console.log('TypesSlide: Calling onRefreshContent for topic:', index);
      onRefreshContent(index);
    } else {
      console.warn('TypesSlide: onRefreshContent function not provided');
    }
  };

  const handleBackFromDetail = () => {
    console.log('TypesSlide: Back from detail');
    setSelectedTopic(null);
  };

  // If a topic is selected and we have detail content, show the DetailSlide
  if (selectedTopic !== null && content.concepts) {
    const detailContent = content.details && content.details[selectedTopic];
    console.log('TypesSlide: Showing DetailSlide with content:', detailContent);
    
    return (
      <DetailSlide 
        topic={content.concepts[selectedTopic]} 
        content={detailContent}
        onBack={handleBackFromDetail} 
        courseData={courseData}
        isRefreshing={isRefreshing}
        onRefreshContent={() => {
          console.log('DetailSlide requested refresh for topic:', selectedTopic);
          if (onRefreshContent) {
            onRefreshContent(selectedTopic);
          }
        }}
      />
    );
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  const buttonVariants = {
    hover: { 
      scale: 1.05,
      boxShadow: "0px 6px 15px rgba(0, 0, 0, 0.1)",
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 10 
      }
    },
    tap: { scale: 0.95 }
  };

  // Main Grid View
  return (
    <SlideWrapper className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-100 rounded-full filter blur-3xl opacity-20 transform -translate-x-1/2 translate-y-1/2"></div>
      
      {/* Overlay spinner for refreshing */}
      {isRefreshing && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-60 backdrop-blur-sm z-10"
        >
          <div className="flex flex-col items-center">
            <motion.div 
              animate={{ 
                rotate: 360 
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              className="rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"
            ></motion.div>
            <p className="mt-4 text-blue-600 font-medium">Refreshing content...</p>
          </div>
        </motion.div>
      )}
      
      <div className="w-full h-full p-6 sm:p-8 overflow-auto">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent mb-4">
            {courseData.topic} - Core Concepts
          </h1>
          <p className="text-base text-indigo-600 mb-4">Select any concept to explore in depth</p>
          <motion.button
            whileHover="hover"
            whileTap="tap"
            variants={buttonVariants}
            onClick={() => {
              console.log('TypesSlide: Requesting content refresh');
              if (onRefreshContent) {
                onRefreshContent();
              }
            }}
            className="mt-2 bg-white px-4 py-2 rounded-full shadow-md text-blue-600 hover:bg-blue-50 
                       transition-all flex items-center mx-auto text-sm"
          >
            <span className="mr-2">{icons.refresh}</span>
            Refresh Concepts
          </motion.button>
        </motion.header>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
        >
          {content?.concepts?.map((concept, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{ 
                scale: 1.03, 
                boxShadow: "0px 10px 25px rgba(0, 0, 0, 0.1)" 
              }}
              whileTap={{ scale: 0.98 }}
              onHoverStart={() => setHoveredCard(index)}
              onHoverEnd={() => setHoveredCard(null)}
              className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden cursor-pointer border border-indigo-100"
              onClick={() => handleTopicSelect(index)}
            >
              <div className="p-6 sm:p-8 h-full flex flex-col items-center justify-center text-center">
                <motion.div 
                  animate={{ 
                    scale: hoveredCard === index ? 1.1 : 1,
                    y: hoveredCard === index ? -5 : 0
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 10 
                  }}
                  className="text-5xl sm:text-6xl mb-4"
                >
                  {concept.icon}
                </motion.div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent mb-3">
                  {concept.title}
                </h2>
                <p className="text-indigo-600 text-sm">
                  Click to explore
                </p>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: hoveredCard === index ? 1 : 0,
                    scale: hoveredCard === index ? 1 : 0.8
                  }}
                  className="mt-4 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-medium inline-flex items-center"
                >
                  <span>View details</span>
                  <span className="ml-1">{icons.next}</span>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.5 } }}
          className="mt-8 flex justify-between"
        >
          <motion.button
            whileHover="hover"
            whileTap="tap"
            variants={buttonVariants}
            onClick={onPrevious}
            className="bg-white text-blue-600 px-5 py-3 rounded-full shadow-md 
                      hover:bg-blue-50 transition-all font-medium border border-blue-100"
          >
            <div className="flex items-center space-x-2">
              <span>{icons.prev}</span>
              <span>Previous</span>
            </div>
          </motion.button>
          <motion.button
            whileHover="hover"
            whileTap="tap"
            variants={buttonVariants}
            onClick={onNext}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-full shadow-md
                     transition-all font-medium"
          >
            <div className="flex items-center space-x-2">
              <span>Next</span>
              <span>{icons.next}</span>
            </div>
          </motion.button>
        </motion.div>
      </div>
    </SlideWrapper>
  );
};

export default TypesSlide;