import React, { createContext, useContext, useState, useEffect } from 'react';

// Create a context for adventure mode state
const AdventureContext = createContext();

export const AdventureProvider = ({ children }) => {
  const [adventureState, setAdventureState] = useState({
    isActive: false,
    currentQuestIndex: 0,
    currentTopicIndex: 0,
    totalQuests: 0,
    completedTopics: {},
    lastActivity: null,
  });

  // Load adventure state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('adventureState');
    if (savedState) {
      try {
        setAdventureState(JSON.parse(savedState));
      } catch (e) {
        console.error('Error parsing saved adventure state', e);
      }
    }
  }, []);

  // Save adventure state to localStorage whenever it changes
  useEffect(() => {
    if (adventureState.isActive) {
      localStorage.setItem('adventureState', JSON.stringify(adventureState));
    }
  }, [adventureState]);

  // Start adventure mode
  const beginAdventure = (totalQuests) => {
    setAdventureState({
      isActive: true,
      currentQuestIndex: 0,
      currentTopicIndex: 0,
      totalQuests,
      completedTopics: {},
      lastActivity: new Date().toISOString(),
    });
  };

  // Exit adventure mode
  const exitAdventure = () => {
    setAdventureState(prev => ({
      ...prev,
      isActive: false,
    }));
    // Optional: Could clear localStorage here if you want to reset progress
  };

  // Move to next topic
  const advanceToNextTopic = (questTopics) => {
    setAdventureState(prev => {
      // Mark current topic as completed
      const newCompletedTopics = {
        ...prev.completedTopics,
        [`${prev.currentQuestIndex}-${prev.currentTopicIndex}`]: true
      };

      // Calculate next position
      let nextQuestIndex = prev.currentQuestIndex;
      let nextTopicIndex = prev.currentTopicIndex + 1;
      
      // If we've reached the end of topics in this quest, move to next quest
      const currentQuestTopicCount = questTopics?.[prev.currentQuestIndex]?.length || 0;
      if (nextTopicIndex >= currentQuestTopicCount) {
        nextQuestIndex += 1;
        nextTopicIndex = 0;
      }
      
      // Check if adventure is complete
      const isComplete = nextQuestIndex >= prev.totalQuests;
      
      return {
        ...prev,
        currentQuestIndex: isComplete ? prev.currentQuestIndex : nextQuestIndex,
        currentTopicIndex: isComplete ? prev.currentTopicIndex : nextTopicIndex,
        completedTopics: newCompletedTopics,
        isActive: !isComplete, // Set to false if adventure is complete
        lastActivity: new Date().toISOString(),
      };
    });
  };

  // Move to previous topic
  const goToPreviousTopic = (questTopics) => {
    setAdventureState(prev => {
      // Calculate previous position
      let prevQuestIndex = prev.currentQuestIndex;
      let prevTopicIndex = prev.currentTopicIndex - 1;
      
      // If we're at the first topic of a quest, go to previous quest
      if (prevTopicIndex < 0) {
        prevQuestIndex -= 1;
        
        // Can't go before first quest
        if (prevQuestIndex < 0) {
          return prev;
        }
        
        // Set topic index to last topic of previous quest
        prevTopicIndex = (questTopics?.[prevQuestIndex]?.length || 1) - 1;
      }
      
      return {
        ...prev,
        currentQuestIndex: prevQuestIndex,
        currentTopicIndex: prevTopicIndex,
        lastActivity: new Date().toISOString(),
      };
    });
  };

  // Jump to specific quest and topic
  const jumpTo = (questIndex, topicIndex) => {
    setAdventureState(prev => ({
      ...prev,
      currentQuestIndex: questIndex,
      currentTopicIndex: topicIndex,
      lastActivity: new Date().toISOString(),
    }));
  };

  // Calculate overall progress
  const calculateProgress = (questTopics) => {
    if (!adventureState.isActive || !questTopics) return 0;
    
    const totalTopics = questTopics.reduce((sum, quest) => sum + quest.length, 0);
    const completedCount = Object.keys(adventureState.completedTopics).length;
    
    return totalTopics > 0 ? (completedCount / totalTopics) * 100 : 0;
  };

  // Check if a specific topic is completed
  const isTopicCompleted = (questIndex, topicIndex) => {
    return !!adventureState.completedTopics[`${questIndex}-${topicIndex}`];
  };

  // Adventure state and methods to expose
  const value = {
    ...adventureState,
    beginAdventure,
    exitAdventure,
    advanceToNextTopic,
    goToPreviousTopic,
    jumpTo,
    calculateProgress,
    isTopicCompleted,
  };

  return (
    <AdventureContext.Provider value={value}>
      {children}
    </AdventureContext.Provider>
  );
};

// Custom hook to use adventure context
export const useAdventure = () => {
  const context = useContext(AdventureContext);
  if (context === undefined) {
    throw new Error('useAdventure must be used within an AdventureProvider');
  }
  return context;
};
