// src/components/slides/DetailSlide.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SlideWrapper from '../common/SlideWrapper';

const DetailSlide = ({ topic, content, onBack, courseData, isRefreshing, onRefreshContent }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [answers, setAnswers] = useState({});
  const [showFeedback, setShowFeedback] = useState({});
  const [expandedKeyPoint, setExpandedKeyPoint] = useState(null);
  
  // Simple icon alternatives
  const icons = {
    overview: "📚",
    examples: "✏️",
    practice: "🎯",
    back: "←",
    refresh: "🔄",
    correct: "✓",
    incorrect: "✗",
    celebration: "🎉",
    idea: "💡"
  };

  // Debug logging
  useEffect(() => {
    console.log('DetailSlide received topic:', topic);
    console.log('DetailSlide received content:', content);
    console.log('DetailSlide isRefreshing:', isRefreshing);
  }, [topic, content, isRefreshing]);

  const handleRefreshContent = () => {
    // Trigger centralized refresh
    if (onRefreshContent) {
      console.log('DetailSlide: Triggering content refresh');
      onRefreshContent();
      // Reset states
      setActiveTab('overview');
      setAnswers({});
      setShowFeedback({});
    } else {
      console.warn('DetailSlide: onRefreshContent function not provided');
    }
  };

  const handleAnswerSelect = (exerciseIndex, optionIndex) => {
    if (!showFeedback[exerciseIndex]) {
      setAnswers(prev => ({
        ...prev,
        [exerciseIndex]: optionIndex
      }));
      setShowFeedback(prev => ({
        ...prev,
        [exerciseIndex]: true
      }));
    }
  };

  const resetExercise = (exerciseIndex) => {
    setAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[exerciseIndex];
      return newAnswers;
    });
    setShowFeedback(prev => {
      const newFeedback = { ...prev };
      delete newFeedback[exerciseIndex];
      return newFeedback;
    });
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: icons.overview },
    { id: 'examples', label: 'Examples', icon: icons.examples },
    { id: 'practice', label: 'Practice', icon: icons.practice }
  ];

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

  const itemVariants = {
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

  const tabContentVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        type: "spring", 
        stiffness: 100, 
        damping: 15 
      }
    },
    exit: { 
      opacity: 0, 
      x: 10,
      transition: { 
        ease: "easeInOut", 
        duration: 0.2 
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

  return (
    <SlideWrapper className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100 rounded-full filter blur-3xl opacity-20 transform -translate-x-1/2 translate-y-1/2"></div>
      
      <div className="w-full h-full p-4 sm:p-8 overflow-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6"
        >
          <motion.button
            whileHover="hover"
            whileTap="tap"
            variants={buttonVariants}
            onClick={onBack}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors
                     bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md mb-4 sm:mb-0 border border-blue-100"
          >
            <span>{icons.back}</span>
            <span>Back to Topics</span>
          </motion.button>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent flex items-center space-x-3"
          >
            <span className="text-4xl">{topic?.icon}</span>
            <span>{topic?.title}</span>
          </motion.h1>
        </motion.div>

        {/* Tab Navigation - Scrollable on mobile */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex overflow-x-auto pb-2 sm:pb-0 sm:justify-center sm:space-x-6 mb-6 no-scrollbar"
        >
          {tabs.map(tab => (
            <motion.button
              key={tab.id}
              whileHover="hover"
              whileTap="tap"
              variants={buttonVariants}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 sm:px-6 py-3 rounded-xl flex items-center space-x-2 transition-all duration-300 
                whitespace-nowrap mr-3 sm:mr-0 flex-shrink-0 font-medium
                ${activeTab === tab.id 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                  : 'bg-white text-blue-600 hover:bg-blue-50 border border-blue-100'}`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-sm sm:text-base">{tab.label}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Content Area */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 border border-indigo-100
                   h-[calc(100%-10rem)] sm:h-[calc(100%-14rem)] overflow-auto"
        >
          {isRefreshing ? (
            <div className="flex flex-col items-center justify-center h-full">
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
              <p className="text-blue-600 mt-6 font-medium">Loading content...</p>
            </div>
          ) : !content ? (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-blue-600 mb-4 text-lg">Waiting for content to load...</p>
              <motion.button
                whileHover="hover"
                whileTap="tap"
                variants={buttonVariants}
                onClick={handleRefreshContent}
                className="mt-4 bg-blue-50 hover:bg-blue-100 text-blue-600 px-6 py-3 rounded-xl shadow-md
                         transition-all font-medium flex items-center space-x-2"
              >
                <span>{icons.refresh}</span>
                <span>Try Loading Content</span>
              </motion.button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent mb-6">
                    {icons.overview} Overview
                  </h2>
                  <p className="text-lg text-blue-700 leading-relaxed mb-8">{content.overview}</p>
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                  >
                    {content.keyPoints?.map((point, index) => (
                      <motion.div 
                        key={index}
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setExpandedKeyPoint(expandedKeyPoint === index ? null : index)}
                        className={`bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl
                                  shadow-md hover:shadow-lg transition-all cursor-pointer border border-indigo-100
                                  ${expandedKeyPoint === index ? 'sm:col-span-2' : ''}`}
                      >
                        <h3 className="font-bold text-lg text-indigo-700 mb-3">{point.title}</h3>
                        <motion.p 
                          className="text-indigo-600 text-base"
                          animate={{ 
                            height: expandedKeyPoint === index ? 'auto' : 'auto',
                            opacity: 1 
                          }}
                        >
                          {point.description}
                        </motion.p>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              )}

              {activeTab === 'examples' && (
                <motion.div
                  key="examples"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent mb-6">
                    {icons.examples} Examples
                  </h2>
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-6"
                  >
                    {content.examples?.map((example, index) => (
                      <motion.div 
                        key={index}
                        variants={itemVariants}
                        whileHover={{ scale: 1.01 }}
                        className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl
                                shadow-md border border-indigo-100"
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          {/* <div className="flex items-center justify-center bg-indigo-100 text-indigo-700 rounded-full w-8 h-8 font-bold">
                            {index + 1}
                          </div> */}
                          <h3 className="font-bold text-lg text-indigo-700"> {index + 1}</h3>
                        </div>
                        <p className="text-indigo-600 text-base whitespace-pre-line">{example}</p>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              )}

              {activeTab === 'practice' && (
                <motion.div
                  key="practice"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent mb-6">
                    {icons.practice} Practice Exercises
                  </h2>
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-8"
                  >
                    {content.exercises?.map((exercise, index) => (
                      <motion.div 
                        key={index}
                        variants={itemVariants}
                        className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl shadow-md border border-indigo-100"
                      >
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="flex items-center justify-center bg-indigo-100 text-indigo-700 rounded-full w-8 h-8 font-bold">
                            Q{index + 1}
                          </div>
                          <p className="text-indigo-700 text-lg font-medium">{exercise.question}</p>
                        </div>
                        <motion.div 
                          variants={containerVariants}
                          className="space-y-3 mt-4"
                        >
                          {exercise.options.map((option, optIndex) => (
                            <motion.button
                              key={optIndex}
                              variants={itemVariants}
                              whileHover={!showFeedback[index] ? { scale: 1.02 } : {}}
                              whileTap={!showFeedback[index] ? { scale: 0.98 } : {}}
                              onClick={() => handleAnswerSelect(index, optIndex)}
                              disabled={showFeedback[index]}
                              className={`w-full p-4 text-left rounded-lg transition-all duration-300 
                                ${showFeedback[index]
                                  ? optIndex === exercise.correctAnswer
                                    ? 'bg-green-50 border-2 border-green-500 text-green-700'
                                    : optIndex === answers[index]
                                      ? 'bg-red-50 border-2 border-red-500 text-red-700'
                                      : 'bg-white border-2 border-indigo-100'
                                  : 'bg-white hover:bg-indigo-50 border-2 border-indigo-100 hover:border-indigo-300 hover:shadow-md'
                                }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <span className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 font-medium
                                        ${showFeedback[index]
                                            ? optIndex === exercise.correctAnswer
                                              ? 'bg-green-100 text-green-700'
                                              : optIndex === answers[index]
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-indigo-100 text-indigo-600'
                                            : 'bg-indigo-100 text-indigo-600'
                                        }`}>
                                    {String.fromCharCode(65 + optIndex)}
                                  </span>
                                  <span className="text-base">{option}</span>
                                </div>
                                {showFeedback[index] && (
                                  <motion.span 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                    className="flex items-center justify-center w-8 h-8 rounded-full"
                                  >
                                    {optIndex === exercise.correctAnswer && (
                                      <span className="text-green-600 text-xl">{icons.correct}</span>
                                    )}
                                    {optIndex === answers[index] && optIndex !== exercise.correctAnswer && (
                                      <span className="text-red-600 text-xl">{icons.incorrect}</span>
                                    )}
                                  </motion.span>
                                )}
                              </div>
                            </motion.button>
                          ))}
                        </motion.div>
                        
                        <AnimatePresence>
                          {showFeedback[index] && (
                            <motion.div 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              className="mt-6 space-y-4"
                            >
                              <div className={`p-4 rounded-xl text-base ${
                                answers[index] === exercise.correctAnswer
                                  ? 'bg-green-50 text-green-700 border border-green-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}>
                                <div className="flex items-center space-x-2">
                                  <span className="text-2xl">
                                    {answers[index] === exercise.correctAnswer ? icons.celebration : icons.idea}
                                  </span>
                                  <p className="font-semibold">
                                    {answers[index] === exercise.correctAnswer
                                      ? 'Correct! Well done!'
                                      : 'Keep learning! Try again.'}
                                  </p>
                                </div>
                                {exercise.explanation && (
                                  <p className="mt-2 text-sm">
                                    <span className="font-semibold">Explanation:</span> {exercise.explanation}
                                  </p>
                                )}
                              </div>
                              <motion.button
                                whileHover="hover"
                                whileTap="tap"
                                variants={buttonVariants}
                                onClick={() => resetExercise(index)}
                                className="text-blue-600 hover:text-blue-800 bg-white px-4 py-2 rounded-lg shadow-sm
                                        hover:shadow-md transition-all border border-blue-100 font-medium"
                              >
                                {icons.refresh} Try Again
                              </motion.button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </motion.div>
      </div>

      {/* Add custom styles to hide scrollbar but allow scrolling */}
      <style jsx>{`
        .no-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;  /* Chrome, Safari and Opera */
        }
      `}</style>
    </SlideWrapper>
  );
};

export default DetailSlide;