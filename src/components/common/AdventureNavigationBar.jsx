import React from 'react';
import { motion } from 'framer-motion';

const AdventureNavigationBar = ({ 
  questSequence, 
  slideContents, 
  onNext, 
  onPrevious, 
  onExitAdventure
}) => {
  // If not in adventure mode, don't render anything
  if (!questSequence || !questSequence.started) {
    return null;
  }

  // Get total number of subtopics in the current quest
  const currentQuest = slideContents?.toc?.quests?.[questSequence.currentQuestIndex];
  const totalSubtopics = currentQuest?.objectives?.length || 0;
  
  // Calculate overall progress
  const totalQuestCount = questSequence.totalQuests;
  const totalStepsCompleted = (questSequence.currentQuestIndex * totalSubtopics) + questSequence.currentSubtopicIndex;
  
  // Estimate total subtopics across all quests
  const allSubtopicsCount = slideContents?.toc?.quests?.reduce((total, quest) => {
    return total + (quest.objectives?.length || 0);
  }, 0) || 0;
  
  // Calculate overall progress percentage
  const progressPercentage = (totalStepsCompleted / allSubtopicsCount) * 100;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-2 px-4 shadow-lg z-40"
      style={{ 
        // This ensures it stays right at the bottom of the slide container
        width: '100%',
        marginTop: 'auto' 
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Adventure status */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-white/20 rounded-lg px-3 py-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <span className="font-medium">Adventure Mode</span>
          </div>
          
          <div className="text-sm">
            Quest {questSequence.currentQuestIndex + 1} of {totalQuestCount} • 
            Topic {questSequence.currentSubtopicIndex + 1} of {totalSubtopics}
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="flex-1 mx-6">
          <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-white h-full rounded-full"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
        
        {/* Navigation controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onPrevious}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={onExitAdventure}
            className="flex items-center px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-sm"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Exit Adventure
          </button>
          
          <button
            onClick={onNext}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default AdventureNavigationBar;