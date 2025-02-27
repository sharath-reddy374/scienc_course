import React, { useState, useEffect } from 'react';
import SlideWrapper from '../common/SlideWrapper';
import { motion, AnimatePresence } from 'framer-motion';

const IntroSlide = ({ courseData, content, onNext, onPrevious, onRefreshContent, isRefreshing }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [activeSection, setActiveSection] = useState('description');
  const [animatingQuiz, setAnimatingQuiz] = useState(false);
  
  // Simple icon alternatives
  const icons = {
    book: "📚",
    quiz: "☑️",
    done: "✅",
    next: "→",
    prev: "←",
    refresh: "🔄",
    correct: "✓",
    incorrect: "✗",
    target: "🎯",
    celebration: "🎉"
  };

  // If content isn't available, don't render the slide.
  if (!content) return null;

  const handleAnswerSelect = (index) => {
    setSelectedAnswer(index);
    setShowFeedback(true);
  };

  const handleTryAnotherQuestion = () => {
    // Add animation before refreshing
    setAnimatingQuiz(true);
    setTimeout(() => {
      if (onRefreshContent) {
        onRefreshContent();
        setSelectedAnswer(null);
        setShowFeedback(false);
        setAnimatingQuiz(false);
      }
    }, 600);
  };

  const handleSectionChange = (section) => {
    if (section !== activeSection) {
      setActiveSection(section);
    }
  };

  // Card variants for animations
  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 100, 
        damping: 15 
      }
    },
    exit: { 
      opacity: 0, 
      y: -50,
      transition: { 
        ease: "easeInOut", 
        duration: 0.3 
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
      
      {/* Refreshing overlay */}
      {isRefreshing && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 backdrop-blur-sm z-10"
        >
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-b-transparent border-blue-600"></div>
            <p className="mt-4 text-blue-600 font-medium">Loading new content...</p>
          </div>
        </motion.div>
      )}
      
      <div className="w-full h-full flex flex-col p-6 md:p-8 relative z-1">
        {/* Title & Section Navigation */}
        <div className="text-center mb-6 md:mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent mb-6 md:mb-8"
          >
            Introduction to {courseData.topic}
          </motion.h1>
          
          <div className="inline-flex p-1 bg-blue-50 rounded-full shadow-md">
            <motion.button
              whileHover="hover"
              whileTap="tap"
              variants={buttonVariants}
              onClick={() => handleSectionChange('description')}
              className={`px-4 py-2 md:px-6 md:py-3 text-sm md:text-base rounded-full transition-all duration-300 ${
                activeSection === 'description'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-transparent text-blue-600 hover:bg-blue-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span>{icons.book}</span>
                <span>Overview</span>
              </div>
            </motion.button>
            <motion.button
              whileHover="hover"
              whileTap="tap"
              variants={buttonVariants}
              onClick={() => handleSectionChange('quiz')}
              className={`px-4 py-2 md:px-6 md:py-3 text-sm md:text-base rounded-full transition-all duration-300 ${
                activeSection === 'quiz'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-transparent text-blue-600 hover:bg-blue-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span>{icons.quiz}</span>
                <span>Knowledge Check</span>
              </div>
            </motion.button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex justify-center items-center">
          <AnimatePresence mode="wait">
            {activeSection === 'description' ? (
              <motion.div
                key="description"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="w-full max-w-4xl"
              >
                <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-6 md:p-8 border border-indigo-100">
                  <div className="flex flex-col md:flex-row md:items-start md:space-x-8">
                    <div className="flex-1">
                      <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent mb-4">
                        What is {courseData.topic}?
                      </h2>
                      <div className="prose prose-lg prose-blue text-blue-700 leading-relaxed max-w-none">
                        <p className="whitespace-pre-line">{content?.description}</p>
                      </div>
                      <motion.button
                        whileHover="hover"
                        whileTap="tap"
                        variants={buttonVariants}
                        onClick={() => handleSectionChange('quiz')}
                        className="mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg
                                 shadow-md transition-all font-medium"
                      >
                        <div className="flex items-center space-x-2">
                          <span>Ready for a Quick Quiz?</span>
                          <span>{icons.next}</span>
                        </div>
                      </motion.button>
                    </div>
                    
                    <div className="w-full md:w-1/3 mt-6 md:mt-0">
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 shadow-lg border border-indigo-200"
                      >
                        <div className="text-5xl md:text-6xl mb-4">{icons.target}</div>
                        <h3 className="text-lg md:text-xl font-bold text-indigo-700 mb-3">Learning Goals</h3>
                        <ul className="space-y-3 text-indigo-600">
                          <motion.li 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="flex items-center"
                          >
                            <span className="flex items-center justify-center bg-green-100 text-green-600 rounded-full w-6 h-6 mr-3">
                              <span>{icons.done}</span>
                            </span>
                            <span>Understand core concepts</span>
                          </motion.li>
                          <motion.li 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            className="flex items-center"
                          >
                            <span className="flex items-center justify-center bg-green-100 text-green-600 rounded-full w-6 h-6 mr-3">
                              <span className="material-icons-outlined text-sm">{icons.done}</span>
                            </span>
                            <span>Apply knowledge</span>
                          </motion.li>
                          <motion.li 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 }}
                            className="flex items-center"
                          >
                            <span className="flex items-center justify-center bg-green-100 text-green-600 rounded-full w-6 h-6 mr-3">
                              <span className="material-icons-outlined text-sm">{icons.done}</span>
                            </span>
                            <span>Master key principles</span>
                          </motion.li>
                        </ul>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="quiz"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="w-full max-w-4xl"
              >
                <div className={`bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-6 md:p-8 border border-indigo-100 ${animatingQuiz ? 'animate-pulse' : ''}`}>
                  <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent mb-6">
                    <div className="flex items-center space-x-3">
                      <span>{icons.quiz}</span>
                      <span>Knowledge Check</span>
                    </div>
                  </h2>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 shadow-inner border border-indigo-100">
                    <p className="text-lg md:text-xl text-indigo-700 mb-5 font-medium">
                      {content?.quiz?.question}
                    </p>
                    <div className="space-y-3 md:space-y-4">
                      {content?.quiz?.options.map((option, index) => (
                        <motion.button
                          key={index}
                          onClick={() => handleAnswerSelect(index)}
                          disabled={showFeedback}
                          whileHover={!showFeedback ? { scale: 1.02 } : {}}
                          whileTap={!showFeedback ? { scale: 0.98 } : {}}
                          className={`w-full p-4 md:p-5 text-left rounded-lg transition-all duration-300 group
                            ${
                              selectedAnswer === index
                                ? selectedAnswer === content.quiz.correctIndex
                                  ? 'bg-green-50 border-2 border-green-500 text-green-700'
                                  : 'bg-red-50 border-2 border-red-500 text-red-700'
                                : 'bg-white hover:bg-blue-50 border-2 border-blue-100 hover:border-blue-300'
                            }
                            ${showFeedback ? 'cursor-default' : 'hover:shadow-md'}`}
                        >
                          <div className="flex items-center">
                            <span className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center 
                                          mr-4 text-base md:text-lg font-medium transition-colors
                                          ${
                                            selectedAnswer === index 
                                              ? selectedAnswer === content.quiz.correctIndex
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                              : 'bg-blue-100 text-blue-600 group-hover:bg-blue-200'
                                          }`}>
                              {String.fromCharCode(65 + index)}
                            </span>
                            <span className="flex-1 text-base md:text-lg">{option}</span>
                            {showFeedback && (
                              <motion.span 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                className="ml-2 md:ml-3"
                              >
                                {index === content.quiz.correctIndex ? (
                                  <span className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full">
                                    <span>{icons.correct}</span>
                                  </span>
                                ) : selectedAnswer === index ? (
                                  <span className="flex items-center justify-center w-8 h-8 bg-red-100 text-red-600 rounded-full">
                                    <span>{icons.incorrect}</span>
                                  </span>
                                ) : null}
                              </motion.span>
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {showFeedback && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`p-5 rounded-lg text-center ${
                          selectedAnswer === content.quiz.correctIndex
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        <p className="text-lg font-semibold mb-3 flex items-center justify-center space-x-2">
                          <span>
                            {selectedAnswer === content.quiz.correctIndex ? icons.celebration : icons.quiz}
                          </span>
                          <span>
                            {selectedAnswer === content.quiz.correctIndex
                              ? 'Great job! You got it right!'
                              : 'Keep learning! Review the content and try again.'}
                          </span>
                        </p>
                        <motion.button
                          whileHover="hover"
                          whileTap="tap"
                          variants={buttonVariants}
                          onClick={handleTryAnotherQuestion}
                          className="mt-2 px-5 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all border border-blue-100"
                        >
                          <div className="flex items-center space-x-2">
                            <span>{icons.refresh}</span>
                            <span>Try Another Question</span>
                          </div>
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6 md:mt-8">
          <motion.button
            whileHover="hover"
            whileTap="tap"
            variants={buttonVariants}
            onClick={onPrevious}
            className="bg-white text-blue-600 px-4 py-2 md:px-6 md:py-3 rounded-full shadow-md
                     hover:bg-blue-50 transition-all border border-blue-100"
          >
            <div className="flex items-center space-x-1">
              <span>{icons.prev}</span>
              <span>Previous</span>
            </div>
          </motion.button>
          <motion.button
            whileHover="hover"
            whileTap="tap"
            variants={buttonVariants}
            onClick={onNext}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-full shadow-md
                     transition-all"
          >
            <div className="flex items-center space-x-1">
              <span>Next</span>
              <span>{icons.next}</span>
            </div>
          </motion.button>
        </div>
      </div>
    </SlideWrapper>
  );
};

export default IntroSlide;