import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SlideWrapper from '../common/SlideWrapper';
import LoadingSpinner from '../LoadingSpinner';

const DetailedQuestSlide = ({ 
  courseData, 
  content, 
  onNext, 
  onPrevious, 
  selectedQuestIndex,
  onRefreshContent,
  onSubtopicSelect,
  isRefreshing,
  onNextQuest,
  questSequence,
  onExitAdventure
}) => {
  const [isReady, setIsReady] = useState(false);
  const [showTopics, setShowTopics] = useState(false);

  useEffect(() => {
    // Animation sequence effect
    const timer = setTimeout(() => {
      setIsReady(true);
      
      // If in adventure mode, automatically show topics
      if (questSequence?.started && questSequence?.mode === 'adventure' && !showTopics) {
        setShowTopics(true);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [questSequence]);

  // Handle navigation
  const handleViewTopics = () => {
    setShowTopics(true);
  };

  const handleBackToIntro = () => {
    setShowTopics(false);
  };

  const handleSubtopicClick = (index) => {
    if (onSubtopicSelect) {
      // If in adventure mode, update the current subtopic index
      if (questSequence?.started && questSequence?.mode === 'adventure') {
        // You would need to have this setQuestSequence function passed down as a prop
        // or use a context to update this state
        // This is a conceptual example:
        if (questSequence.setCurrentSubtopicIndex) {
          questSequence.setCurrentSubtopicIndex(index);
        }
      }
      
      onSubtopicSelect(index);
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

  // Validation
  if (!content || !content.quests || selectedQuestIndex === null) {
    return (
      <SlideWrapper className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
        <div className="w-full h-full flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </SlideWrapper>
    );
  }

  const quest = content.quests[selectedQuestIndex];
  if (!quest) {
    return (
      <SlideWrapper className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-xl text-red-600 mb-4">Quest not found</h3>
            <button
              onClick={onPrevious}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Back to Course Overview
            </button>
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

  const gradientColors = selectedQuestIndex % 2 === 0 
    ? 'from-blue-500 to-indigo-600' 
    : 'from-indigo-500 to-purple-600';

  // Extract topics from objectives or key points
  const extractTopics = (quest) => {
    if (!quest) return [];
    
    // First try to get from objectives
    if (quest.objectives && quest.objectives.length) {
      return quest.objectives.map(objective => ({
        description: objective.trim()
      }));
    }
    
    // If no objectives, try to use keyPoints if available
    if (quest.keyPoints && quest.keyPoints.length) {
      return quest.keyPoints.map(point => {
        if (typeof point === 'object' && point.title) {
          return {
            title: point.title,
            description: point.description || ''
          };
        }
        return { description: point };
      });
    }
    
    // Fallback to empty array
    return [];
  };

  const topics = extractTopics(quest);

  // Card component
  const SimpleCard = ({ index, children }) => {
    return (
      <motion.div
        whileHover={{ 
          scale: 1.03, 
          boxShadow: "0 10px 20px -5px rgba(66, 71, 200, 0.15)"
        }}
        whileTap={{ scale: 0.98 }}
        onClick={() => handleSubtopicClick(index)}
        className="bg-white rounded-xl shadow-md transition-all duration-300 cursor-pointer overflow-hidden"
      >
        {children}
      </motion.div>
    );
  };


  // function to render the adventure mode status
  const renderAdventureModeStatus = () => {
    if (!questSequence || !questSequence.started || questSequence.mode !== 'adventure') {
      return null;
    }

    // Calculate progress
    const totalQuests = questSequence.totalQuests || 0;
    const currentQuestIndex = questSequence.currentQuestIndex;
    const progressPercentage = ((currentQuestIndex + 1) / totalQuests) * 100;

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-indigo-600/10 to-blue-600/10 border border-indigo-200 rounded-lg p-3 mb-4"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <span className="bg-indigo-600 text-white rounded-md px-2 py-0.5 text-xs font-medium mr-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Adventure Mode
            </span>
            <span className="text-indigo-700 text-sm font-medium">
              Quest {currentQuestIndex + 1} of {totalQuests}
            </span>
          </div>
          
          <button
            onClick={onExitAdventure}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
          >
            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Exit Adventure
          </button>
        </div>
        
        <div className="w-full bg-indigo-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </motion.div>
    );
  };


  // Floating background element
  const FloatingElement = ({ size, delay, left, top, color, speed }) => (
    <motion.div
      initial={{ y: 0, opacity: 0.5 }}
      animate={{ 
        y: [-10, 10, -10], 
        opacity: [0.5, 0.8, 0.5],
        rotate: [0, 5, -5, 0]
      }}
      transition={{ 
        repeat: Infinity,
        duration: speed || 6,
        delay: delay || 0,
        ease: "easeInOut"
      }}
      className={`absolute rounded-full ${size} ${color} blur-lg`}
      style={{ left, top, transformStyle: "preserve-3d", zIndex: 0 }}
    />
  );

  return (
    <SlideWrapper className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 overflow-hidden" style={{ aspectRatio: '16/9' }}>
      <div className="w-full h-full flex flex-col p-4 md:p-6 lg:p-8 relative overflow-hidden">

           {/* Adventure Mode Status */}
           {renderAdventureModeStatus()}

        {/* Floating Background Elements */}
        <FloatingElement size="w-64 h-64" left="5%" top="15%" color="bg-blue-400/10" speed={7} />
        <FloatingElement size="w-48 h-48" left="70%" top="60%" color="bg-indigo-400/10" delay={1} speed={9} />
        <FloatingElement size="w-32 h-32" left="20%" top="70%" color="bg-purple-400/10" delay={2} speed={5} />
        
        <div className="w-full h-full max-w-6xl mx-auto flex flex-col relative z-10">
          {/* Header with navigation */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: isReady ? 1 : 0, y: isReady ? 0 : -20 }}
            transition={{ duration: 0.7 }}
            className="flex justify-between items-center mb-3"
          >
            {/* Left - Back button */}
            <motion.button 
              onClick={showTopics ? handleBackToIntro : onPrevious}
              className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              whileHover={{ scale: 1.05, x: -3 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg
                className="mr-2 w-5 h-5"
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
              {showTopics ? 'Back to Introduction' : 'Back to Quests'}
            </motion.button>
            
            {/* Center - Quest badge */}
            <div className="absolute left-0 right-0 mx-auto w-fit flex justify-center pointer-events-none">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                <motion.span 
                  className={`px-3 py-1 rounded-md text-white text-sm font-semibold bg-gradient-to-r ${gradientColors}`}
                  animate={{ 
                    boxShadow: ["0 0 0px rgba(80, 70, 230, 0)", "0 0 15px rgba(80, 70, 230, 0.5)", "0 0 0px rgba(80, 70, 230, 0)"] 
                  }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                >
                  Quest {selectedQuestIndex + 1}
                </motion.span>
              </motion.div>
            </div>
            
            {/* Right - Empty space to balance layout */}
            <div className="w-[110px]"></div>
          </motion.div>

          <AnimatePresence mode="wait">
            {!showTopics ? (
              /* Introduction Section */
              <motion.div 
                key="introduction"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="flex-1 flex flex-col"
              >
                {/* Quest Title */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: isReady ? 1 : 0, y: isReady ? 0 : -20 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  className="text-center mb-4"
                >
                  <motion.h1 
                    className="text-3xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-700 bg-clip-text text-transparent mb-3 tracking-tight"
                    animate={{ 
                      backgroundPosition: ['0% center', '100% center', '0% center'],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    style={{ backgroundSize: "200% auto" }}
                  >
                    {quest.title}
                  </motion.h1>
                  <p className="text-base md:text-lg text-indigo-700/80 max-w-3xl mx-auto">
                    {quest.description}
                  </p>
                </motion.div>

                {/* Introduction Content */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: isReady ? 1 : 0, y: isReady ? 0 : 20 }}
                  transition={{ duration: 0.7, delay: 0.4, type: "spring" }}
                  className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-8 flex-1 relative overflow-hidden"
                  whileHover={{ boxShadow: "0 30px 60px -15px rgba(0, 0, 0, 0.15)" }}
                >
                  {/* Decorative element */}
                  <motion.div 
                    className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-indigo-100 opacity-50"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  />
                  
                  <div className="prose prose-indigo max-w-none relative z-10">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-indigo-100">Introduction</h2>
                    <p className="mb-4">
                      {quest.description || `Welcome to this exploration of ${quest.title}. This quest will guide you through the key concepts, principles, and applications of this fascinating topic.`}
                    </p>
                    <p className="mb-4">
                      Through a series of interactive lessons, you'll develop a comprehensive understanding of the subject matter and be able to apply your knowledge in various contexts.
                    </p>
                    <h3 className="font-bold text-lg mt-6 mb-3">What You'll Learn</h3>
                    <ul className="space-y-2">
                      {topics.map((topic, idx) => (
                        <motion.li 
                          key={idx} 
                          className="flex items-start"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + (idx * 0.1) }}
                          whileHover={{ x: 5 }}
                        >
                          <motion.span 
                            className="inline-block w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 flex-shrink-0 mr-3 mt-0.5 flex items-center justify-center text-sm font-medium"
                            whileHover={{ scale: 1.2, backgroundColor: "#818cf8", color: "#ffffff" }}
                          >
                            {idx + 1}
                          </motion.span>
                          <span>{topic.description}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </motion.div>

                {/* View Topics Button */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isReady ? 1 : 0 }}
                  transition={{ delay: 0.8 }}
                  className="mt-auto pt-2 flex justify-center"
                >
                  <motion.button
                    onClick={handleViewTopics}
                    className="group flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-lg rounded-xl shadow-lg transition-all overflow-hidden relative"
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: "0 15px 30px -10px rgba(66, 71, 200, 0.5)",
                      y: -2
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {/* Animated background effect */}
                    <motion.div 
                      className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20" 
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.6 }}
                    />
                    
                    <span className="relative z-10">View Topics</span>
                    <motion.svg
                      className="ml-2 w-5 h-5 relative z-10"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                    >
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </motion.svg>
                  </motion.button>
                </motion.div>
              </motion.div>
            ) : (
              /* Topics List */
              <motion.div 
                key="topics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="flex-1 flex flex-col"
              >
                {/* Section Title */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: isReady ? 1 : 0, y: isReady ? 0 : -20 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  className="text-center mb-8"
                >
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">
                    Topics for {quest.title}
                  </h2>
                  <p className="text-sm text-gray-600 max-w-2xl mx-auto">
                    Select a topic to begin learning. Each topic builds upon the previous one.
                  </p>
                </motion.div>

                {/* Topics Grid */}
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto flex-1 pb-4 pr-1"
                  style={{ maxHeight: "calc(100% - 160px)" }}
                >
                  {topics.map((topic, index) => (
                    <motion.div
                      key={index}
                      variants={itemVariants}
                      custom={index}
                    >
                      <SimpleCard index={index}>
                        <div className="p-4 h-full flex flex-col">
                          {/* Topic number badge */}
                          <div className="mb-2 flex items-start">
                            <div 
                              className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 
                                        flex items-center justify-center font-bold mr-2 text-xs"
                            >
                              {index + 1}
                            </div>
                            
                            {/* Topic name */}
                            <h3 className="text-base font-medium text-gray-800 leading-tight">
                              {topic.title || 
                                (topic.description && topic.description.includes('.') ? 
                                  topic.description.split('.')[0].trim() : 
                                  topic.description)}
                            </h3>
                          </div>
                          
                          {/* Topic description */}
                          <div className="ml-8">
                            <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                              {topic.title ? topic.description : 
                                (topic.description && topic.description.includes('.') ? 
                                  topic.description.split('.').slice(1).join('.').trim() : 
                                  '')}
                            </p>
                          </div>
                          
                          {/* Action button */}
                          <div className="flex justify-end mt-auto">
                            <motion.button
                              className={`px-3 py-1 text-xs font-medium rounded-lg text-white 
                                        bg-gradient-to-r ${gradientColors}
                                        flex items-center`}
                              whileHover={{ scale: 1.05 }}
                            >
                              <span>Start</span>
                              <svg 
                                className="w-3 h-3 ml-1" 
                                xmlns="http://www.w3.org/2000/svg" 
                                viewBox="0 0 24 24"
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                              >
                                <polyline points="9 18 15 12 9 6"></polyline>
                              </svg>
                            </motion.button>
                          </div>
                        </div>
                      </SimpleCard>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Continue Button */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isReady ? 1 : 0 }}
                  transition={{ delay: 0.8 }}
                  className="mt-auto pt-4 flex justify-center"
                >
                   <motion.button
                      whileHover="hover"
                      whileTap="tap"
                      variants={buttonVariants}
                      onClick={() => {
                        // Use onNextQuest if available (for adventure mode)
                        if (typeof onNextQuest === 'function' && questSequence?.started) {
                          onNextQuest();
                        } else {
                          // Otherwise use standard navigation
                          onNext();
                        }
                      }}
                      className="group flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl shadow-lg transition-all overflow-hidden relative"
                    >
                    <span className="relative z-10">
                       {questSequence?.started ? 'Continue Adventure' : 'Finish Quest'}
                    </span>
                    <motion.svg
                      className="ml-2 w-5 h-5 relative z-10"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                    >
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </motion.svg>
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </SlideWrapper>
  );
};

export default DetailedQuestSlide;