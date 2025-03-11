import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SlideWrapper from '../common/SlideWrapper';

const TOCSlide = ({ 
  courseData, 
  content, 
  onNext, 
  onPrevious, 
  onQuestSelect, 
  onBeginAdventure, 
  isRefreshing 
}) => {
  // Set 16:9 aspect ratio while preserving all functionality
  const containerStyle = {
    aspectRatio: '16/9',
    maxHeight: '100vh',
    margin: '0 auto',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  };
  
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [hoveredQuest, setHoveredQuest] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Animation sequence effect
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Handle quest click - both select quest and call the parent handler
  const handleQuestClick = (index) => {
    setSelectedQuest(index);
    if (onQuestSelect) {
      console.log("TOCSlide: handleQuestClick called with index:", index);
      onQuestSelect(index);
    }
  };

  // Handle Begin Adventure click
  const handleBeginAdventure = () => {
    if (onBeginAdventure) {
      console.log("TOCSlide: handleBeginAdventure called");
      onBeginAdventure();
    }
  };

  if (!content || !content.quests) {
    // Show loading state if no content
    return (
      <SlideWrapper className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
        <div style={containerStyle} className="w-full flex items-center justify-center">
          <div className="flex flex-col items-center">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-6"
            ></motion.div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-blue-600 font-medium text-lg"
            >
              {isRefreshing ? "Refreshing course content..." : "Preparing your learning adventure..."}
            </motion.p>
          </div>
        </div>
      </SlideWrapper>
    );
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 15 }
    }
  };

  return (
    <SlideWrapper className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
      <div style={containerStyle} className="w-full flex flex-col p-4 md:p-6 lg:p-8 relative">
        {/* Background decorative elements */}
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={onPrevious}
          className="absolute top-6 left-6 z-10 flex items-center space-x-2 text-indigo-700 hover:text-indigo-900 transition-colors"
        >
          <svg 
            className="w-5 h-5" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          <span className="font-medium">Back</span>
        </motion.button>
        
        <div className="w-full h-full max-w-6xl mx-auto flex flex-col">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: isReady ? 1 : 0, y: isReady ? 0 : -20 }}
            transition={{ duration: 0.7 }}
            className="text-center mb-4 md:mb-6 flex-shrink-0"
          >
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-700 bg-clip-text text-transparent mb-2 tracking-tight">
              {content.title || courseData.title || "Your Learning Adventure"}
            </h1>
            <p className="text-sm md:text-base text-indigo-700/80 max-w-3xl mx-auto">
              {content.description || "Embark on an exciting journey to master new concepts through interactive quests and challenges."}
            </p>
          </motion.div>

          {/* Scrollable Quests Grid - key change is here */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex-grow overflow-y-auto" // This is critical for scrolling
            style={{ 
              minHeight: 0, // This forces flex items to be able to scroll
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(79, 70, 229, 0.2) transparent'
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6 pb-4">
              {content.quests.map((quest, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ 
                    scale: 1.02, 
                    boxShadow: "0 15px 30px -10px rgba(66, 71, 200, 0.15)"
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleQuestClick(index)}
                  onHoverStart={() => setHoveredQuest(index)}
                  onHoverEnd={() => setHoveredQuest(null)}
                  className="bg-white rounded-xl shadow-md transition-all duration-300 cursor-pointer overflow-hidden h-full flex flex-col"
                >
                  {/* Colored top bar */}
                  <div className={`h-2 bg-gradient-to-r ${index % 2 === 0 ? 'from-blue-500 to-indigo-600' : 'from-indigo-500 to-purple-600'}`}></div>
                  
                  <div className="p-4 md:p-6 flex flex-col h-full">
                    {/* Quest identifier */}
                    <div className="mb-3">
                      <span className={`px-3 py-1 rounded-md text-white text-sm font-semibold bg-gradient-to-r ${index % 2 === 0 ? 'from-blue-500 to-indigo-600' : 'from-indigo-500 to-purple-600'}`}>
                        Quest {index + 1}
                      </span>
                    </div>
                    
                    {/* Quest title */}
                    <div className="mb-3">
                      <h3 className="text-lg md:text-xl font-bold text-gray-800">
                        {quest.title}
                      </h3>
                    </div>
                    
                    {/* Objectives - with internal scrolling if needed */}
                    <div className="mb-3 flex-grow overflow-y-auto">
                      <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Topics:</p>
                      <ul className="space-y-1 pr-1"> {/* Added padding for scroll */}
                        {quest.objectives?.map((objective, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start">
                            <span className="inline-block w-4 h-4 rounded-full bg-indigo-100 text-indigo-800 flex-shrink-0 mr-2 mt-0.5 flex items-center justify-center text-xs">
                              {idx + 1}
                            </span>
                            <span>{objective.split('.')[0]}.</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Progress indicator if subtopics exist */}
                    {quest.subtopics && quest.subtopics.length > 0 && (
                      <div className="mt-auto">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>
                            {quest.subtopics.filter(s => s.content).length} / {quest.subtopics.length} topics
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r ${index % 2 === 0 ? 'from-blue-500 to-indigo-600' : 'from-indigo-500 to-purple-600'}`}
                            style={{ 
                              width: `${(quest.subtopics.filter(s => s.content).length / quest.subtopics.length) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Begin Adventure Button - moved to bottom */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: isReady ? 1 : 0, scale: isReady ? 1 : 0.9 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="w-full flex justify-center mt-4 flex-shrink-0"
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(66, 71, 200, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBeginAdventure}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-lg rounded-xl shadow-lg"
            >
              Begin Your Adventure
            </motion.button>
          </motion.div>
        </div>
      </div>
    </SlideWrapper>
  );
};

export default TOCSlide;