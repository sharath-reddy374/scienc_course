import React, { useState, useEffect } from 'react';
import SlideWrapper from '../common/SlideWrapper';
import { motion } from 'framer-motion';

const TOCSlide = ({ courseData, content, onNext, isFirst }) => {
  const [activeQuest, setActiveQuest] = useState(null);
  const [isReady, setIsReady] = useState(false);

  // Animation sequence effect - Must be called before any conditionals
  useEffect(() => {
    setIsReady(true);
  }, []);
  
  // If content isn't available yet, render a loading state
  if (!content) {
    return (
      <SlideWrapper className="bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="w-full h-full flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-10 w-64 bg-blue-200 rounded mb-4"></div>
            <div className="h-6 w-48 bg-blue-100 rounded"></div>
          </div>
        </div>
      </SlideWrapper>
    );
  }

  // Enhanced quest interaction with selection tracking
  const handleQuestSelect = (index) => {
    setActiveQuest(activeQuest === index ? null : index);
  };

  // Progress calculation
  const totalObjectives = content.quests?.reduce(
    (total, quest) => total + (quest.objectives?.length || 0), 
    0
  ) || 0;

  return (
    <SlideWrapper className="bg-gradient-to-br from-blue-50 to-blue-200">
      <div className="w-full h-full flex flex-col items-center p-4 md:p-8 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-blue-400/10"></div>
          <div className="absolute left-10 bottom-10 w-32 h-32 rounded-full bg-blue-400/10"></div>
          <div className="absolute right-1/4 bottom-1/4 w-24 h-24 rounded-full bg-blue-400/15"></div>
        </div>

        {/* Title Section with animation */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: isReady ? 1 : 0, y: isReady ? 0 : -20 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-center mb-6 md:mb-10 mt-2 md:mt-4"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-blue-800 mb-3 md:mb-4 
                       tracking-tight leading-tight drop-shadow-sm">
            {content.title || `${courseData.subject}: ${courseData.topic}`}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-blue-700 max-w-2xl mx-auto">
            Embark on an interactive learning journey through {courseData.topic}
          </p>

          {/* Course metadata */}
          <div className="flex items-center justify-center space-x-4 mt-3">
            <div className="flex items-center text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">{content.quests?.length || 0} Quests</span>
            </div>
            <div className="flex items-center text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">{totalObjectives} Objectives</span>
            </div>
          </div>
        </motion.div>

        {/* Quests Grid - With staggered animation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 w-full max-w-5xl mb-6 md:mb-10">
          {content.quests?.map((quest, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isReady ? 1 : 0, y: isReady ? 0 : 20 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              className="group relative bg-white rounded-2xl shadow-lg overflow-hidden
                         transform transition-all duration-300 hover:shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-blue-600/20 
                              opacity-0 group-hover:opacity-70 transition-opacity"></div>
              
              <div className="p-4 md:p-6 relative">
                <div className="flex items-center mb-3 md:mb-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 flex items-center justify-center 
                               text-blue-600 font-bold text-base md:text-lg mr-3 md:mr-4">
                    {index + 1}
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-blue-800">{quest.title}</h2>
                </div>

                <ul className="space-y-2 md:space-y-3 mt-3 md:mt-4">
                  {quest.objectives?.map((objective, idx) => (
                    <motion.li 
                      key={idx}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 + idx * 0.05 }}
                      className="flex items-start text-blue-700 text-sm md:text-base"
                    >
                      <span className="text-green-500 mr-2 text-lg md:text-xl flex-shrink-0">✓</span>
                      <span>{objective}</span>
                    </motion.li>
                  ))}
                </ul>

                <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-blue-600 
                             transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Start Button with animation and pulse effect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isReady ? 1 : 0, y: isReady ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="relative"
        >
          <div className="absolute -inset-1 bg-blue-500/30 rounded-full blur-md animate-pulse"></div>
          <button
            onClick={onNext}
            className="relative bg-blue-600 text-white px-8 py-3.5 md:px-12 md:py-4 rounded-full font-semibold text-base md:text-lg
                       hover:bg-blue-700 transform hover:scale-105 transition-all duration-300
                       shadow-lg hover:shadow-xl flex items-center justify-center space-x-3 w-full sm:w-auto min-w-[200px]"
          >
            <span>Start Your Journey</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </motion.div>

        {/* Info footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: isReady ? 0.9 : 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="absolute bottom-3 left-0 right-0 flex justify-center"
        >
          {/* <div className="text-xs text-blue-600 bg-white/70 px-3 py-1 rounded-full backdrop-blur-sm">
      
          </div> */}
        </motion.div>
      </div>
    </SlideWrapper>
  );
};

export default TOCSlide;