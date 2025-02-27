import React, { useState, useEffect } from 'react';
import SlideWrapper from '../common/SlideWrapper';
import { motion, AnimatePresence } from 'framer-motion';

const TOCSlide = ({ courseData, content, onNext, isFirst }) => {
  const [hoveredQuest, setHoveredQuest] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [hoverButton, setHoverButton] = useState(false);

  // Animation sequence effect - Must be called before any conditionals
  useEffect(() => {
    // Staggered animation entrance
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);
  
  // If content isn't available yet, render a loading state
  if (!content) {
    return (
      <SlideWrapper className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="w-full h-full flex items-center justify-center">
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
              className="rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-6"
            ></motion.div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-blue-600 font-medium text-lg"
            >
              Preparing your learning adventure...
            </motion.p>
          </div>
        </div>
      </SlideWrapper>
    );
  }

  // Enhanced quest interaction with hover tracking
  const handleQuestHoverStart = (index) => {
    setHoveredQuest(index);
  };
  
  const handleQuestHoverEnd = () => {
    setHoveredQuest(null);
  };

  // Progress calculation
  const totalObjectives = content.quests?.reduce(
    (total, quest) => total + (quest.objectives?.length || 0), 
    0
  ) || 0;

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

  const questCardVariants = {
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
  
  // Determine which cards should be blurred
  const shouldBlur = hoveredQuest !== null;

  return (
    <SlideWrapper className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="w-full h-full flex flex-col items-center p-6 md:p-8 relative overflow-auto">
        {/* Title Section with animation */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: isReady ? 1 : 0, y: isReady ? 0 : -20 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-center mb-8 md:mb-10"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-700 bg-clip-text text-transparent mb-4 tracking-tight leading-tight">
            {content.title || `${courseData.subject}: ${courseData.topic}`}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-indigo-700 max-w-2xl mx-auto">
            Embark on an interactive learning journey through {courseData.topic}
          </p>

          {/* Course metadata with animated entrance */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex items-center justify-center space-x-6 mt-5"
          >
            <div className="flex items-center text-indigo-600 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
              <span className="mr-2">{content.quests?.length || 0} Quests</span>
            </div>
            <div className="flex items-center text-indigo-600 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
              <span className="mr-2">{totalObjectives} Objectives</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Quests Grid - With staggered animation */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl mb-10 relative"
        >
          {content.quests?.map((quest, index) => (
            <motion.div
              key={index}
              variants={questCardVariants}
              onHoverStart={() => handleQuestHoverStart(index)}
              onHoverEnd={handleQuestHoverEnd}
              animate={{
                scale: hoveredQuest === index ? 1.08 : 1,
                zIndex: hoveredQuest === index ? 20 : 1,
                filter: shouldBlur && hoveredQuest !== index ? 'blur(2px)' : 'blur(0px)',
                opacity: shouldBlur && hoveredQuest !== index ? 0.7 : 1,
                y: hoveredQuest === index ? -10 : 0,
                transition: {
                  type: "spring",
                  stiffness: 300, 
                  damping: 20,
                  filter: { duration: 0.2 },
                  opacity: { duration: 0.2 }
                }
              }}
              className={`group relative bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden
                         transform border border-indigo-100
                         ${hoveredQuest === index ? 'ring-2 ring-blue-500 shadow-2xl' : 'shadow-lg'}`}
            >
              <div className={`absolute top-0 left-0 w-full h-1.5 transition-all duration-500 
                             ${hoveredQuest === index ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gradient-to-r from-blue-200 to-indigo-200'}`}>
              </div>
              
              <div className="p-5 md:p-6 relative">
                <div className="flex items-center mb-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center 
                               text-white font-bold text-lg mr-4 transition-colors duration-300
                               ${hoveredQuest === index ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-blue-400 to-indigo-400'}`}>
                    {index + 1}
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
                    {quest.title}
                  </h2>
                </div>

                <p className="text-indigo-600 mb-4 text-sm md:text-base">
                  {quest.description || `Complete these learning objectives to master ${quest.title.toLowerCase()}.`}
                </p>

                <AnimatePresence>
                  {hoveredQuest === index && (
                    <motion.ul 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-3 mt-4 border-t border-indigo-100 pt-4"
                    >
                      {quest.objectives?.map((objective, idx) => (
                        <motion.li 
                          key={idx}
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 + idx * 0.05 }}
                          className="flex items-start text-indigo-700 text-sm md:text-base"
                        >
                          <span className="text-green-500 mr-2.5 text-lg flex-shrink-0">✓</span>
                          <span>{objective}</span>
                        </motion.li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>

                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="mt-4 text-center"
                >
                  {/* <p className="text-sm text-indigo-500 italic">
                    Hover to see objectives
                  </p> */}
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Start Button with animation and pulse effect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isReady ? 1 : 0, y: isReady ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="relative mb-6"
          onHoverStart={() => setHoverButton(true)}
          onHoverEnd={() => setHoverButton(false)}
        >
          <motion.div 
            animate={{ 
              scale: hoverButton ? 1.1 : 1,
              opacity: hoverButton ? 0.8 : 0.6
            }}
            className="absolute -inset-2 bg-gradient-to-r from-blue-400/40 to-indigo-500/40 rounded-full blur-md"
          ></motion.div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={onNext}
            className="relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-4 rounded-full 
                     font-bold text-lg shadow-lg hover:shadow-xl flex items-center justify-center space-x-3 
                     min-w-[250px]"
          >
            <motion.span 
              animate={{ x: hoverButton ? 5 : 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              Begin Your Adventure
            </motion.span>
            <motion.span 
              animate={{ 
                x: hoverButton ? 5 : 0,
                scale: hoverButton ? 1.2 : 1
              }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              →
            </motion.span>
          </motion.button>
        </motion.div>
      </div>
    </SlideWrapper>
  );
};

export default TOCSlide;