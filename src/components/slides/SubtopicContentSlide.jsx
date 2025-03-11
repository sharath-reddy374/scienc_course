import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SlideWrapper from '../common/SlideWrapper';
import LoadingSpinner from '../LoadingSpinner';

const SubtopicContentSlide = React.memo(({
  courseData,
  content,
  questIndex,
  subtopicIndex,
  subtopicContent,
  onNext,
  onPrevious,
  onReturnToQuest,
  onRefreshContent,
  isRefreshing
}) => {
  // State for section navigation
  const [currentSection, setCurrentSection] = useState(0); // 0: Overview, 1: Key Points, 2: Examples, 3: Practice Exercises, 4: Matching Exercises
  
  // Track content fetch attempts to avoid repeated requests
  const contentFetchAttemptedRef = useRef({
    overview: false,
    keyPoints: false,
    examples: false,
    exercises: false,
    matchingExercises: false
  });
  
  // Section loading states
  const [isLoadingSectionContent, setIsLoadingSectionContent] = useState({
    overview: false,
    keyPoints: false,
    examples: false,
    exercises: false,
    matchingExercises: false
  });
  
  // Interactive exercise states
  const [userAnswers, setUserAnswers] = useState({});
  const [submittedQuestions, setSubmittedQuestions] = useState({});

  // API call tracking
  const apiCallTimeoutsRef = useRef({});
  const apiCallInProgressRef = useRef({});
  
  // Matching exercise states
  const [matchingAnswers, setMatchingAnswers] = useState({});
  const [submittedMatchingExercises, setSubmittedMatchingExercises] = useState({});
  const [selectedLeftItem, setSelectedLeftItem] = useState(null);

  // Define the sections in order
  const sections = ['Overview', 'Key Points', 'Examples', 'Practice Exercises', 'Matching Exercises'];
  const contentLoadedRef = useRef({});
  const fetchingRef = useRef(false);

  const __DEV__ = process.env.NODE_ENV !== 'production';
  const hasRenderedRef = useRef(false);
  
  // Map section indices to their data properties
  const sectionToDataMap = {
    0: 'overview',
    1: 'keyPoints',
    2: 'examples',
    3: 'exercises',
    4: 'matchingExercises'
  };

  const isMountedRef = useRef(true);
  
  // Run once when component mounts/unmounts
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Create a stable reference for onRefreshContent
  const onRefreshContentRef = useRef(onRefreshContent);
  useEffect(() => {
    onRefreshContentRef.current = onRefreshContent;
  }, [onRefreshContent]);

  // Topic identifier for tracking topic changes
  const topicIdentifierRef = useRef(null);

  // Mark existing content as loaded on initial render
  useEffect(() => {
    if (!subtopicContent || questIndex === null || subtopicIndex === null) {
      return;
    }
    
    // Check all sections in the current subtopic content
    Object.keys(sectionToDataMap).forEach(sectionIndex => {
      const sectionType = sectionToDataMap[sectionIndex];
      
      // If we have content for this section, mark it as loaded
      if (subtopicContent[sectionType]) {
        const sectionKey = `${questIndex}-${subtopicIndex}-${sectionType}`;
        
        if (!contentLoadedRef.current[sectionKey]) {
          contentLoadedRef.current[sectionKey] = true;
          if (__DEV__) console.log(`Marking existing content as loaded: ${sectionKey}`);
        }
      }
    });
  }, [subtopicContent, questIndex, subtopicIndex]);

  // Function to safely call the API with debouncing - IMPROVED
  const debouncedApiCall = useCallback((params) => {
    const { questIndex, subtopicIndex, sectionType, forceRefresh } = params;
    if (questIndex === null || subtopicIndex === null) return Promise.resolve();
    
    const callId = `${questIndex}-${subtopicIndex}-${sectionType}`;
    
    // Clear any existing timeout for this call
    if (apiCallTimeoutsRef.current[callId]) {
      clearTimeout(apiCallTimeoutsRef.current[callId]);
      delete apiCallTimeoutsRef.current[callId];
    }
    
    // If this call is already in progress and not forced, skip
    if (apiCallInProgressRef.current[callId] && !forceRefresh) {
      if (__DEV__) console.log(`API call ${callId} already in progress, skipping duplicate`);
      return Promise.resolve();
    }
    
    // Set loading state only for the current section to minimize UI updates
    if (sectionType === sectionToDataMap[currentSection]) {
      setIsLoadingSectionContent(prev => ({
        ...prev,
        [sectionType]: true
      }));
    }
    
    // Return a new promise that will be resolved when the API call completes
    return new Promise((resolve, reject) => {
      // Schedule the actual API call with a small delay to prevent rapid consecutive calls
      apiCallTimeoutsRef.current[callId] = setTimeout(() => {
        // Mark this call as in progress
        apiCallInProgressRef.current[callId] = true;
        fetchingRef.current = true;
        
        // Make the actual API call
        onRefreshContentRef.current(params)
          .then(result => {
            // Mark the section as loaded on success
            if (isMountedRef.current) {
              const sectionKey = `${questIndex}-${subtopicIndex}-${sectionType}`;
              contentLoadedRef.current[sectionKey] = true;
              resolve(result);
            }
          })
          .catch(error => {
            console.error(`Error in API call ${callId}:`, error);
            // Reset fetch attempt flag on failure
            if (isMountedRef.current) {
              contentFetchAttemptedRef.current[sectionType] = false;
              reject(error);
            }
          })
          .finally(() => {
            // Clean up regardless of outcome
            if (isMountedRef.current) {
              delete apiCallInProgressRef.current[callId];
              fetchingRef.current = false;
              
              // Only update loading state for current section to avoid unnecessary re-renders
              if (sectionType === sectionToDataMap[currentSection]) {
                setIsLoadingSectionContent(prev => ({
                  ...prev,
                  [sectionType]: false
                }));
              }
            }
          });
      }, 100); // 100ms debounce delay
    });
  }, [currentSection]); // Only depend on currentSection

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      // Clear all pending timeouts
      Object.values(apiCallTimeoutsRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
      apiCallTimeoutsRef.current = {};
      apiCallInProgressRef.current = {};
      fetchingRef.current = false;
    };
  }, []);

  // Handle topic change
  useEffect(() => {
    // Skip if questIndex or subtopicIndex is null
    if (questIndex === null || subtopicIndex === null) return;
    
    // Create a stable identifier for the current topic
    const topicIdentifier = `${questIndex}-${subtopicIndex}`;
    
    // Skip if no change
    if (!topicIdentifier || topicIdentifier === topicIdentifierRef.current) {
      return;
    }
    
    if (__DEV__) console.log(`Topic changed to: ${topicIdentifier}, resetting state`);
    topicIdentifierRef.current = topicIdentifier;
    
    // Reset all states
    setUserAnswers({});
    setSubmittedQuestions({});
    setMatchingAnswers({});
    setSubmittedMatchingExercises({});
    setSelectedLeftItem(null);
    setCurrentSection(0);
    
    // Reset loading indicators explicitly to avoid stuck loading states
    setIsLoadingSectionContent({
      overview: false,
      keyPoints: false,
      examples: false,
      exercises: false,
      matchingExercises: false
    });
    
    // Reset tracking refs
    contentFetchAttemptedRef.current = {
      overview: false,
      keyPoints: false,
      examples: false,
      exercises: false,
      matchingExercises: false
    };
    contentLoadedRef.current = {};
    fetchingRef.current = false;
    
    // If we already have content, mark overview as loaded
    if (subtopicContent?.overview) {
      contentLoadedRef.current[`${questIndex}-${subtopicIndex}-overview`] = true;
    }
  }, [questIndex, subtopicIndex]);

  // Add this effect for cleanup
  useEffect(() => {
    return () => {
      // Clear fetching flags when component unmounts
      fetchingRef.current = false;
      contentFetchAttemptedRef.current = {
        overview: false,
        keyPoints: false,
        examples: false,
        exercises: false,
        matchingExercises: false
      };
      contentLoadedRef.current = {};
    };
  }, []);

  // IMPROVED: Preload content in the background - more efficient with less re-renders
  const preloadAllSectionContent = useCallback(() => {
    if (questIndex === null || subtopicIndex === null || !onRefreshContentRef.current || fetchingRef.current) {
      return;
    }
    
    if (__DEV__) console.log("Preloading all section content at once");
    
    // Store which sections we need to fetch BEFORE modifying any state
    const sectionsToFetch = [];
    
    // Define all the sections we want to load
    ['overview', 'keyPoints', 'examples', 'exercises', 'matchingExercises'].forEach(sectionType => {
      const sectionKey = `${questIndex}-${subtopicIndex}-${sectionType}`;
      
      // Skip if already loaded
      if (contentLoadedRef.current[sectionKey]) {
        if (__DEV__) console.log(`Section ${sectionType} already loaded, skipping`);
        return;
      }
      
      // Skip if already being fetched
      if (contentFetchAttemptedRef.current[sectionType]) {
        if (__DEV__) console.log(`Section ${sectionType} fetch already attempted, skipping`);
        return;
      }
      
      // Skip if content already exists
      if (subtopicContent && subtopicContent[sectionType]) {
        contentLoadedRef.current[sectionKey] = true;
        if (__DEV__) console.log(`Content for ${sectionType} exists, marking as loaded`);
        return;
      }
      
      // If we got here, we need to fetch this section
      sectionsToFetch.push(sectionType);
    });
    
    // If nothing to fetch, we're done
    if (sectionsToFetch.length === 0) {
      if (__DEV__) console.log("All sections already loaded");
      return;
    }
    
    if (__DEV__) console.log(`Preloading these sections: ${sectionsToFetch.join(', ')}`);
    
    // Critical change: Mark ALL sections as being fetched BEFORE starting any fetches
    // This prevents the cascade of state updates triggering re-renders
    sectionsToFetch.forEach(sectionType => {
      contentFetchAttemptedRef.current[sectionType] = true;
    });
    
    // Only update loading state for the current section to avoid re-renders
    const currentSectionType = sectionToDataMap[currentSection];
    if (sectionsToFetch.includes(currentSectionType)) {
      setIsLoadingSectionContent(prev => ({
        ...prev,
        [currentSectionType]: true
      }));
    }
    
    // Use a worker function that doesn't trigger state updates during processing
    const loadSections = async () => {
      for (let i = 0; i < sectionsToFetch.length; i++) {
        if (!isMountedRef.current) break;
        
        const sectionType = sectionsToFetch[i];
        if (__DEV__) console.log(`Starting to load section: ${sectionType}`);
        
        try {
          await onRefreshContentRef.current({
            questIndex,
            subtopicIndex,
            sectionType,
            forceRefresh: false
          });
          
          if (isMountedRef.current) {
            // Mark as loaded on success without triggering a re-render
            contentLoadedRef.current[`${questIndex}-${subtopicIndex}-${sectionType}`] = true;
            if (__DEV__) console.log(`Successfully loaded section: ${sectionType}`);
          }
        } catch (error) {
          console.error(`Error fetching ${sectionType}:`, error);
          // Reset attempted flag so we can try again
          if (isMountedRef.current) {
            contentFetchAttemptedRef.current[sectionType] = false;
          }
        }
        
        // Add a small delay between requests to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Only update loading state at the end of all loading
      if (isMountedRef.current) {
        setIsLoadingSectionContent(prev => {
          const newState = {...prev};
          sectionsToFetch.forEach(sectionType => {
            newState[sectionType] = false;
          });
          return newState;
        });
      }
    };
    
    // Start the loading process
    loadSections();
  }, [questIndex, subtopicIndex, currentSection, subtopicContent, sectionToDataMap]);


  
  // Loading effect for current section content
  useEffect(() => {
    // Skip if invalid indices
    if (questIndex === null || subtopicIndex === null) {
      return;
    }
    
    // Important: Use this pattern to avoid nested state updates
    let timer = null;
    
    // Wait until the component is fully mounted before triggering background loads
    const raf = requestAnimationFrame(() => {
      timer = setTimeout(() => {
        if (isMountedRef.current) {
          preloadAllSectionContent();
        }
      }, 500);
    });
    
    return () => {
      cancelAnimationFrame(raf);
      if (timer) clearTimeout(timer);
    };
  }, [questIndex, subtopicIndex, preloadAllSectionContent]);




  // Update loading state when content becomes available - OPTIMIZED
  useEffect(() => {
    if (!subtopicContent) return;
    
    const currentSectionType = sectionToDataMap[currentSection];
    
    // Only update loading state for the current section to avoid unnecessary re-renders
    if (subtopicContent[currentSectionType] && 
        (!Array.isArray(subtopicContent[currentSectionType]) || 
         subtopicContent[currentSectionType].length > 0)) {
      setIsLoadingSectionContent(prev => {
        // Only update if the current state is different to avoid unnecessary re-renders
        if (prev[currentSectionType]) {
          return {
            ...prev,
            [currentSectionType]: false
          };
        }
        return prev;
      });
    }
  }, [subtopicContent, currentSection]);

  // Trigger preloading with a small delay to avoid UI jank
  useEffect(() => {
    // Skip if invalid indices
    if (questIndex === null || subtopicIndex === null) {
      return;
    }
    
    // Use a small delay to avoid causing render issues
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        preloadAllSectionContent();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [questIndex, subtopicIndex, preloadAllSectionContent]);

  // Section navigation with improved loading logic
  const goToNextSection = useCallback(() => {
    if (currentSection < sections.length - 1) {
      const nextSection = currentSection + 1;
      
      // Check if we already have content for the next section
      const nextSectionType = sectionToDataMap[nextSection];
      const nextSectionKey = `${questIndex}-${subtopicIndex}-${nextSectionType}`;
      const hasNextSectionContent = 
        (subtopicContent && subtopicContent[nextSectionType]) || 
        contentLoadedRef.current[nextSectionKey];
      
      // If we don't have content, preload it before navigating
      if (!hasNextSectionContent && !contentFetchAttemptedRef.current[nextSectionType] && onRefreshContentRef.current) {
        // Show loading state only for the next section
        setIsLoadingSectionContent(prev => ({
          ...prev,
          [nextSectionType]: true
        }));
        
        contentFetchAttemptedRef.current[nextSectionType] = true;
        
        // Fetch content for next section
        onRefreshContentRef.current({
          questIndex,
          subtopicIndex,
          sectionType: nextSectionType,
          forceRefresh: false
        })
        .finally(() => {
          if (isMountedRef.current) {
            // Reset loading state
            setIsLoadingSectionContent(prev => ({
              ...prev,
              [nextSectionType]: false
            }));
            
            // Update section after content is loaded
            setCurrentSection(nextSection);
          }
        });
      } else {
        // We already have content or it's being fetched, just navigate
        setCurrentSection(nextSection);
      }
    } else {
      // If at last section, reset to overview before navigating to next topic
      setCurrentSection(0);
      onNext();
    }
  }, [currentSection, questIndex, subtopicIndex, subtopicContent, onNext, sections.length]);

  // Go to previous section
  const goToPreviousSection = useCallback(() => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    } else {
      onReturnToQuest();
    }
  }, [currentSection, onReturnToQuest]);

  // Force refresh current section content - OPTIMIZED
   const handleForceRefreshCurrentSection = useCallback(() => {
    if (fetchingRef.current) {
      console.log("Refresh already in progress, skipping duplicate request");
      return;
    }
    
    const currentSectionType = sectionToDataMap[currentSection];
    
    // Reset state to trigger a fetch
    contentFetchAttemptedRef.current[currentSectionType] = false;
    delete contentLoadedRef.current[`${questIndex}-${subtopicIndex}-${currentSectionType}`];
    
    // Set single loading state update
    setIsLoadingSectionContent(prev => ({
      ...prev,
      [currentSectionType]: true
    }));
    
    // Set fetching flag to prevent duplicate requests
    fetchingRef.current = true;
    
    // Execute the API call
    onRefreshContentRef.current({
      questIndex,
      subtopicIndex,
      sectionType: currentSectionType,
      forceRefresh: true
    })
    .finally(() => {
      if (isMountedRef.current) {
        fetchingRef.current = false;
        setIsLoadingSectionContent(prev => ({
          ...prev,
          [currentSectionType]: false
        }));
      }
    });
  }, [currentSection, questIndex, subtopicIndex, sectionToDataMap]);


  // Interactive exercise handlers
  const handleSelectAnswer = useCallback((exerciseIdx, optionIdx) => {
    if (submittedQuestions[exerciseIdx]) return;
    setUserAnswers(prev => ({
      ...prev,
      [exerciseIdx]: optionIdx
    }));
  }, [submittedQuestions]);

  const handleSubmitAnswer = useCallback((exerciseIdx) => {
    setSubmittedQuestions(prev => ({
      ...prev,
      [exerciseIdx]: true
    }));
  }, []);
  
  // Matching exercise handlers
  const handleSelectLeftItem = useCallback((exerciseIdx, leftIdx) => {
    if (matchingAnswers[exerciseIdx]?.[leftIdx] !== undefined) return;
    setSelectedLeftItem({ exerciseIdx, leftIdx });
  }, [matchingAnswers]);

  const handleSelectRightItem = useCallback((exerciseIdx, rightIdx) => {
    if (!selectedLeftItem || selectedLeftItem.exerciseIdx !== exerciseIdx) return;
    if (Object.values(matchingAnswers[exerciseIdx] || {}).includes(rightIdx)) return;
    setMatchingAnswers(prev => {
      const exerciseAnswers = prev[exerciseIdx] || {};
      return {
        ...prev,
        [exerciseIdx]: {
          ...exerciseAnswers,
          [selectedLeftItem.leftIdx]: rightIdx
        }
      };
    });
    setSelectedLeftItem(null);
  }, [selectedLeftItem, matchingAnswers]);

  const handleRemoveMatch = useCallback((exerciseIdx, leftIdx) => {
    setMatchingAnswers(prev => {
      const exerciseAnswers = { ...prev[exerciseIdx] || {} };
      delete exerciseAnswers[leftIdx];
      return {
        ...prev,
        [exerciseIdx]: exerciseAnswers
      };
    });
  }, []);
  
  const handleSubmitMatching = useCallback((exerciseIdx) => {
    setSubmittedMatchingExercises(prev => ({
      ...prev,
      [exerciseIdx]: true
    }));
  }, []);
  
  const isMatchingComplete = useCallback((exerciseIdx) => {
    const matchingExercise = subtopicContent?.matchingExercises?.[exerciseIdx];
    const regularMatchingExercises = subtopicContent?.exercises?.filter(ex => ex.type === 'matching');
    const regularMatchingExercise = regularMatchingExercises?.[exerciseIdx];
    const exercise = matchingExercise || regularMatchingExercise;
    const answers = matchingAnswers[exerciseIdx] || {};
    if (!exercise || !exercise.leftItems) return false;
    return exercise.leftItems.every((_, idx) => answers[idx] !== undefined);
  }, [subtopicContent, matchingAnswers]);
  
  const isMatchCorrect = useCallback((exerciseIdx, leftIdx, rightIdx) => {
    const matchingExercise = subtopicContent?.matchingExercises?.[exerciseIdx];
    const regularMatchingExercises = subtopicContent?.exercises?.filter(ex => ex.type === 'matching');
    const regularMatchingExercise = regularMatchingExercises?.[exerciseIdx];
    const exercise = matchingExercise || regularMatchingExercise;
    if (!exercise || !exercise.correctPairs) return false;
    return exercise.correctPairs.some(pair => pair.left === leftIdx && pair.right === rightIdx);
  }, [subtopicContent]);

  // Format overview content
  const formatOverview = useCallback((overviewText) => {
    if (!overviewText) return null;
    const sections = overviewText.split("---SECTION---");
    return (
      <div className="space-y-6">
        {sections.map((section, index) => {
          const trimmedSection = section.trim();
          const colonIndex = trimmedSection.indexOf(':');
          if (colonIndex > 0) {
            const title = trimmedSection.substring(0, colonIndex);
            const content = trimmedSection.substring(colonIndex + 1).trim();
            const paragraphs = content.split(/(?<=\. )(?=[A-Z])/g);
            return (
              <div key={index} className="mb-4">
                <h3 className="font-bold text-indigo-700 mb-2 pb-1 border-b border-indigo-100">{title}:</h3>
                <div className="ml-0">
                  {paragraphs.map((paragraph, pIdx) => (
                    <p key={pIdx} className="text-gray-700 mb-2">{paragraph.trim()}</p>
                  ))}
                </div>
              </div>
            );
          }
          return <p key={index} className="text-gray-700">{trimmedSection}</p>;
        })}
      </div>
    );
  }, []);

  // Render section refresh button
  const renderSectionRefreshButton = useCallback(() => {
    return (
      <button
        onClick={handleForceRefreshCurrentSection}
        className="ml-2 p-1 text-indigo-500 hover:bg-indigo-100 rounded-full"
        title={`Regenerate ${sections[currentSection]}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    );
  }, [handleForceRefreshCurrentSection, currentSection, sections]);

  // RenderMatchingExercise component with memoization
  const RenderMatchingExercise = useCallback(({ 
    exercise, 
    idx, 
    matchingAnswers,
    submittedMatchingExercises,
    handleSelectLeftItem,
    handleSelectRightItem,
    handleRemoveMatch,
    handleSubmitMatching,
    isMatchingComplete,
    isMatchCorrect,
    gradientColors
  }) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-white to-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm"
      >
        <h4 className="font-medium text-gray-800 mb-3 text-base border-b border-gray-100 pb-2 flex items-center">
          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center mr-3 shadow-sm text-sm">
            Q{idx + 1}
          </span>
          {exercise?.instructions || "Match the items on the left with their definitions on the right."}
        </h4>
        <div className="mb-3 text-sm text-gray-500 italic">
          Click to match items.
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-indigo-600 mb-2">Items</h5>
            {exercise?.leftItems?.map((item, leftIdx) => (
              <div
                key={leftIdx}
                onClick={() => !submittedMatchingExercises[idx] && handleSelectLeftItem(idx, leftIdx)}
                className={`p-3 rounded-lg border text-base cursor-pointer flex items-center ${
                  submittedMatchingExercises[idx]
                    ? isMatchCorrect(idx, leftIdx, matchingAnswers[idx]?.[leftIdx])
                      ? 'bg-green-100 border-green-300 border'
                      : 'bg-red-100 border-red-300 border'
                    : selectedLeftItem?.exerciseIdx === idx && selectedLeftItem?.leftIdx === leftIdx
                      ? 'bg-indigo-200 border-indigo-400 border shadow-md'
                      : matchingAnswers[idx]?.[leftIdx] !== undefined
                        ? 'bg-blue-100 border-blue-300 border'
                        : 'bg-white border-indigo-200 border hover:bg-indigo-50 hover:border-indigo-300'
                }`}
              >
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium mr-3 shadow-sm ${
                  submittedMatchingExercises[idx]
                    ? isMatchCorrect(idx, leftIdx, matchingAnswers[idx]?.[leftIdx])
                      ? 'bg-green-500 text-white'
                      : 'bg-red-500 text-white'
                    : selectedLeftItem?.exerciseIdx === idx && selectedLeftItem?.leftIdx === leftIdx
                      ? 'bg-indigo-600 text-white'
                      : matchingAnswers[idx]?.[leftIdx] !== undefined
                        ? 'bg-blue-500 text-white'
                        : 'bg-indigo-500 text-white'
                }`}>
                  {leftIdx + 1}
                </div>
                <span className="flex-1">{item || ""}</span>
                {matchingAnswers[idx]?.[leftIdx] !== undefined && !submittedMatchingExercises[idx] && (
// Continuing from where your code left off

                <div className="bg-blue-100 text-blue-800 text-sm font-semibold rounded-full h-6 w-6 flex items-center justify-center ml-2">
                  {String.fromCharCode(65 + matchingAnswers[idx][leftIdx])}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <h5 className="text-sm font-medium text-indigo-600 mb-2">Definitions</h5>
          {exercise?.rightItems?.map((item, rightIdx) => (
            <div
              key={rightIdx}
              onClick={() => selectedLeftItem && !submittedMatchingExercises[idx] && handleSelectRightItem(idx, rightIdx)}
              className={`p-3 rounded-lg border text-base flex items-center ${
                submittedMatchingExercises[idx]
                  ? Object.entries(matchingAnswers[idx] || {}).some(
                      ([leftIdx, rIdx]) => 
                        parseInt(rIdx) === rightIdx && 
                        isMatchCorrect(idx, parseInt(leftIdx), rightIdx)
                    )
                    ? 'bg-green-100 border-green-300 border'
                    : Object.values(matchingAnswers[idx] || {}).includes(rightIdx)
                      ? 'bg-red-100 border-red-300 border'
                      : 'bg-white border-gray-200'
                  : Object.values(matchingAnswers[idx] || {}).includes(rightIdx)
                    ? 'bg-blue-100 border-blue-300 border'
                    : selectedLeftItem?.exerciseIdx === idx
                      ? 'bg-gray-50 border-dashed border-indigo-300 border-2 hover:bg-indigo-50 cursor-pointer'
                      : 'bg-gray-50 border-dashed border-gray-300 border-2 hover:border-indigo-300'
              }`}
            >
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium mr-3 shadow-sm ${
                Object.values(matchingAnswers[idx] || {}).includes(rightIdx)
                  ? submittedMatchingExercises[idx]
                    ? Object.entries(matchingAnswers[idx] || {}).some(
                        ([leftIdx, rIdx]) => 
                          parseInt(rIdx) === rightIdx && 
                          isMatchCorrect(idx, parseInt(leftIdx), rightIdx)
                      )
                      ? 'bg-green-500 text-white'
                      : 'bg-red-500 text-white'
                    : 'bg-blue-500 text-white'
                  : 'bg-gray-300 text-gray-600'
              }`}>
                {String.fromCharCode(65 + rightIdx)}
              </div>
              <span className="flex-1">{item || ""}</span>
              {Object.entries(matchingAnswers[idx] || {}).find(([leftIdx, rIdx]) => parseInt(rIdx) === rightIdx) && !submittedMatchingExercises[idx] && (
                <div className="bg-blue-100 text-blue-800 text-sm font-semibold rounded-full h-6 w-6 flex items-center justify-center ml-2">
                  {Object.entries(matchingAnswers[idx] || {}).find(([leftIdx, rIdx]) => parseInt(rIdx) === rightIdx)?.[0] !== undefined 
                    ? parseInt(Object.entries(matchingAnswers[idx] || {}).find(([leftIdx, rIdx]) => parseInt(rIdx) === rightIdx)[0]) + 1
                    : ""}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {!submittedMatchingExercises[idx] && Object.entries(matchingAnswers[idx] || {}).length > 0 && (
        <div className="border-t border-dashed border-indigo-200 pt-3 mb-3">
          <h5 className="text-sm font-medium text-indigo-600 mb-2">Your Matches:</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(matchingAnswers[idx] || {}).map(([leftIdx, rightIdx]) => (
              <div key={leftIdx} className="text-sm text-gray-600 bg-indigo-50 p-2 rounded flex justify-between items-center group">
                <div className="flex items-center">
                  <span className="font-medium">{parseInt(leftIdx) + 1}</span>
                  <span className="mx-1">→</span>
                  <span className="font-medium">{String.fromCharCode(65 + parseInt(rightIdx))}</span>
                </div>
                <button 
                  onClick={() => handleRemoveMatch(idx, parseInt(leftIdx))}
                  className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove this match"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex justify-end space-x-2 mt-4">
        {Object.keys(matchingAnswers[idx] || {}).length > 0 && !submittedMatchingExercises[idx] && (
          <button
            onClick={() => {
              setMatchingAnswers(prev => ({
                ...prev,
                [idx]: {}
              }));
              setSelectedLeftItem(null);
            }}
            className="px-4 py-2 text-gray-600 rounded-lg text-sm border border-gray-300 hover:bg-gray-100 transition-all"
          >
            Reset
          </button>
        )}
        {isMatchingComplete(idx) && !submittedMatchingExercises[idx] && (
          <button
            onClick={() => handleSubmitMatching(idx)}
            className={`px-4 py-2 text-white rounded-lg text-sm bg-gradient-to-r ${gradientColors} hover:shadow-md transition-all transform hover:scale-105`}
          >
            Submit
          </button>
        )}
      </div>
      {submittedMatchingExercises[idx] && (
        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 mt-4">
          <h5 className="text-sm font-medium text-indigo-700 mb-2">Solution:</h5>
          <div className="grid grid-cols-1 gap-2 mb-3">
            {exercise?.correctPairs?.map((pair, pairIdx) => (
              <div key={pairIdx} className="text-sm text-indigo-600 flex">
                <span className="font-medium">{pair.left + 1}. {exercise.leftItems[pair.left]}</span>
                <span className="mx-2">⟶</span>
                <span className="font-medium">{String.fromCharCode(65 + pair.right)}. {exercise.rightItems[pair.right]}</span>
              </div>
            ))}
          </div>
          {exercise?.explanations?.map((explanation, expIdx) => (
            <p key={expIdx} className="text-sm text-gray-700 mt-2">
              <span className="font-medium">• </span>{explanation}
            </p>
          ))}
        </div>
      )}
    </motion.div>
  );
}, [selectedLeftItem]);

  // Helper function to check if content exists and is valid
  const hasValidContent = useCallback((content, sectionType) => {
    if (!content || !content[sectionType]) {
      return false;
    }
    
    const sectionContent = content[sectionType];
    
    // Check based on content type
    if (typeof sectionContent === 'string') {
      return sectionContent.trim().length > 0;
    } else if (Array.isArray(sectionContent)) {
      return sectionContent.length > 0;
    } else if (typeof sectionContent === 'object' && sectionContent !== null) {
      return Object.keys(sectionContent).length > 0;
    }
    
    return false;
  }, []);

  // Memoized renderSectionContent function
  const renderSectionContent = useCallback(() => {
    const currentSectionType = sectionToDataMap[currentSection];
  
    // Check if we have content for the current section
    const hasContent = subtopicContent && subtopicContent[currentSectionType];
    
    // If no content, show appropriate placeholder
    if (!hasContent) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-4">
          <p className="text-gray-500 text-center">
            Content is being loaded for this section. Please wait...
          </p>
        </div>
      );
    }

    // Define gradient colors based on quest index
    const gradientColors = questIndex % 2 === 0 
      ? 'from-blue-500 to-indigo-600' 
      : 'from-indigo-500 to-purple-600';

    switch (currentSection) {
      case 0: // Overview
        return (
          <div className="h-full flex flex-col">
            <h2 className="text-lg font-bold text-gray-800 mb-3 pb-1 border-b border-indigo-100 flex items-center justify-between">
              <div className="flex items-center">
                <span className={`w-5 h-5 flex items-center justify-center rounded-full bg-gradient-to-r ${gradientColors} text-white mr-2 shadow-md text-xs`}>
                  {currentSection + 1}
                </span>
                {sections[currentSection]}
              </div>
              {renderSectionRefreshButton()}
            </h2>
            <div className="prose prose-sm prose-indigo max-w-none p-4 bg-gradient-to-br from-indigo-50/50 to-blue-50/50 rounded-lg shadow-sm border border-blue-100 flex-1 overflow-auto">
              {formatOverview(subtopicContent?.overview) || 
                <p className="text-base leading-relaxed">No overview content available.</p>
              }
            </div>
          </div>
        );
        
      case 1: // Key Points
        return (
          <div className="h-full flex flex-col">
            <h2 className="text-lg font-bold text-gray-800 mb-2 pb-1 border-b border-indigo-100 flex items-center justify-between">
              <div className="flex items-center">
                <span className={`w-5 h-5 flex items-center justify-center rounded-full bg-gradient-to-r ${gradientColors} text-white mr-2 shadow-md text-xs`}>
                  {currentSection + 1}
                </span>
                {sections[currentSection]}
              </div>
              {renderSectionRefreshButton()}
            </h2>
            <div className="space-y-2 overflow-auto flex-1 pr-1">
              {subtopicContent?.keyPoints?.map((point, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-gradient-to-r from-indigo-50 to-blue-50 p-3 rounded-lg border-l-4 border-indigo-500 shadow-sm transform hover:scale-105 transition-all hover:shadow-md"
                >
                  <h4 className="font-semibold text-indigo-800 mb-1 text-sm flex items-center">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center mr-2 shadow-sm text-xs">
                      {idx + 1}
                    </span>
                    {point?.title || `Key Point ${idx+1}`}
                  </h4>
                  <p className="text-gray-700 pl-7 text-sm">{point?.description || ""}</p>
                </motion.div>
              )) || <p className="text-gray-500">No key points available.</p>}
            </div>
          </div>
        );
        
      case 2: // Examples
        return (
          <div className="h-full flex flex-col">
            <h2 className="text-lg font-bold text-gray-800 mb-2 pb-1 border-b border-indigo-100 flex items-center justify-between">
              <div className="flex items-center">
                <span className={`w-5 h-5 flex items-center justify-center rounded-full bg-gradient-to-r ${gradientColors} text-white mr-2 shadow-md text-xs`}>
                  {currentSection + 1}
                </span>
                {sections[currentSection]}
              </div>
              {renderSectionRefreshButton()}
            </h2>
            <div className="space-y-2 overflow-auto flex-1 pr-1">
              {Array.isArray(subtopicContent?.examples) ? (
                subtopicContent.examples.map((example, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-3 border border-blue-100 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50/50 shadow-sm hover:shadow-md transition-all transform hover:scale-105"
                  >
                    {typeof example === 'object' && example !== null ? (
                      <div className="space-y-2">
                        {example.title && (
                          <h4 className="font-semibold text-indigo-800 text-sm flex items-center">
                            <div className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold mr-2 flex-shrink-0 mt-0.5 shadow-sm text-xs">
                              {idx + 1}
                            </div>
                            {example.title}
                          </h4>
                        )}
                        {example.scenario && (
                          <p className="text-gray-700 text-sm pl-7">{example.scenario}</p>
                        )}
                        {example.analysis && (
                          <div className="bg-blue-50 p-2 rounded-md mt-2 text-sm text-gray-600 pl-7">
                            <span className="font-medium text-indigo-600">Analysis: </span>
                            {example.analysis}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-start">
                        <div className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold mr-2 flex-shrink-0 mt-0.5 shadow-sm text-xs">
                          {idx + 1}
                        </div>
                        <p className="text-gray-700 text-sm">{example || ""}</p>
                      </div>
                    )}
                  </motion.div>
                ))
              ) : (
                <p className="text-gray-500">No examples available.</p>
              )}
            </div>
          </div>
        );
        
      case 3: // Practice Exercises
        return (
          <div className="h-full flex flex-col">
            <h2 className="text-lg font-bold text-gray-800 mb-2 pb-1 border-b border-indigo-100 flex items-center justify-between">
              <div className="flex items-center">
                <span className={`w-5 h-5 flex items-center justify-center rounded-full bg-gradient-to-r ${gradientColors} text-white mr-2 shadow-md text-xs`}>
                  {currentSection + 1}
                </span>
                {sections[currentSection]}
              </div>
              {renderSectionRefreshButton()}
            </h2>
            <div className="overflow-auto flex-1 pr-1">
              {subtopicContent?.exercises && subtopicContent.exercises.length > 0 ? (
                <div className="space-y-3">
                  {subtopicContent.exercises
                    .filter(exercise => exercise.type !== 'matching')
                    .map((exercise, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-white to-gray-50 p-3 rounded-lg border border-gray-200 shadow-sm"
                      >
                        <h4 className="font-medium text-gray-800 mb-2 text-sm border-b border-gray-100 pb-1 flex items-center">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center mr-2 shadow-sm text-xs">
                            Q{idx + 1}
                          </span>
                          {exercise?.question || `Exercise ${idx+1}`}
                        </h4>
                        <div className="space-y-1 mb-2">
                          {exercise?.options?.map((option, optIdx) => (
                            <div
                              key={optIdx}
                              onClick={() => handleSelectAnswer(idx, optIdx)}
                              className={`p-2 rounded-lg cursor-pointer transition-all hover:shadow-md text-sm ${
                                submittedQuestions[idx]
                                  ? optIdx === exercise.correctAnswer
                                    ? 'bg-green-100 border-green-300 border'
                                    : userAnswers[idx] === optIdx
                                      ? 'bg-red-100 border-red-300 border'
                                      : 'bg-white border border-gray-200'
                                  : userAnswers[idx] === optIdx
                                    ? 'bg-indigo-100 border-indigo-300 border'
                                    : 'bg-white border border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-start">
                                <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium mr-2 shadow-sm ${
                                  submittedQuestions[idx]
                                    ? optIdx === exercise.correctAnswer
                                      ? 'bg-green-500 text-white'
                                      : userAnswers[idx] === optIdx
                                        ? 'bg-red-500 text-white'
                                        : 'bg-gray-200 text-gray-700'
                                    : userAnswers[idx] === optIdx
                                      ? 'bg-indigo-500 text-white'
                                      : 'bg-gray-200 text-gray-700'
                                }`}>
                                  {String.fromCharCode(65 + optIdx)}
                                </div>
                                <span className="flex-1">{option || ""}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        {!submittedQuestions[idx] && userAnswers[idx] !== undefined && (
                          <div className="flex justify-end mb-2">
                            <button
                              onClick={() => handleSubmitAnswer(idx)}
                              className={`px-3 py-1 text-white rounded-lg text-xs bg-gradient-to-r ${gradientColors} hover:shadow-md transition-all transform hover:scale-105`}
                            >
                              Submit
                            </button>
                          </div>
                        )}
                        {submittedQuestions[idx] && (
                          <div className="bg-green-50 p-2 rounded-lg border border-green-100">
                            <p className="text-green-800 text-xs">
                              <span className="font-medium text-green-700">Explanation: </span>
                              {exercise?.explanation || "No explanation provided."}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500">No practice exercises available.</p>
              )}
            </div>
          </div>
        );
        
      case 4: // Matching Exercises
        return (
          <div className="h-full flex flex-col">
            <h2 className="text-lg font-bold text-gray-800 mb-2 pb-1 border-b border-indigo-100 flex items-center justify-between">
              <div className="flex items-center">
                <span className={`w-5 h-5 flex items-center justify-center rounded-full bg-gradient-to-r ${gradientColors} text-white mr-2 shadow-md text-xs`}>
                  {currentSection + 1}
                </span>
                {sections[currentSection]}
              </div>
              {renderSectionRefreshButton()}
            </h2>
            <div className="overflow-auto flex-1 pr-1">
              {subtopicContent?.matchingExercises && subtopicContent.matchingExercises.length > 0 ? (
                <div className="space-y-3">
                  {subtopicContent.matchingExercises.map((exercise, idx) => (
                    <RenderMatchingExercise 
                      key={idx} 
                      exercise={exercise} 
                      idx={idx} 
                      matchingAnswers={matchingAnswers}
                      submittedMatchingExercises={submittedMatchingExercises}
                      handleSelectLeftItem={handleSelectLeftItem}
                      handleSelectRightItem={handleSelectRightItem}
                      handleRemoveMatch={handleRemoveMatch}
                      handleSubmitMatching={handleSubmitMatching}
                      isMatchingComplete={isMatchingComplete}
                      isMatchCorrect={isMatchCorrect}
                      gradientColors={gradientColors}
                      selectedLeftItem={selectedLeftItem}
                    />
                  ))}
                </div>
              ) : (
                subtopicContent?.exercises && subtopicContent.exercises.some(ex => ex.type === 'matching') ? (
                  <div className="space-y-3">
                    {subtopicContent.exercises
                      .filter(ex => ex.type === 'matching')
                      .map((exercise, idx) => (
                        <RenderMatchingExercise 
                          key={idx} 
                          exercise={exercise} 
                          idx={idx} 
                          matchingAnswers={matchingAnswers}
                          submittedMatchingExercises={submittedMatchingExercises}
                          handleSelectLeftItem={handleSelectLeftItem}
                          handleSelectRightItem={handleSelectRightItem}
                          handleRemoveMatch={handleRemoveMatch}
                          handleSubmitMatching={handleSubmitMatching}
                          isMatchingComplete={isMatchingComplete}
                          isMatchCorrect={isMatchCorrect}
                          gradientColors={gradientColors}
                          selectedLeftItem={selectedLeftItem}
                        />
                      ))
                    }
                  </div>
                ) : (
                  <p className="text-gray-500">No matching exercises available.</p>
                )
              )}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  }, [
    currentSection, subtopicContent, questIndex, sections, renderSectionRefreshButton, 
    formatOverview, handleSelectAnswer, handleSubmitAnswer, userAnswers, submittedQuestions,
    RenderMatchingExercise, matchingAnswers, submittedMatchingExercises, selectedLeftItem,
    handleSelectLeftItem, handleSelectRightItem, handleRemoveMatch, handleSubmitMatching,
    isMatchingComplete, isMatchCorrect
  ]);

  const gradientColors = questIndex % 2 === 0 
    ? 'from-blue-500 to-indigo-600' 
    : 'from-indigo-500 to-purple-600';

  const gradientTextColors = questIndex % 2 === 0 
    ? 'from-blue-700 via-indigo-600 to-blue-700' 
    : 'from-indigo-700 via-purple-600 to-indigo-700';

  const slideVariants = {
    enter: { opacity: 0, x: 50 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  const totalSections = sections.length;
  const progressPercentage = ((currentSection + 1) / totalSections) * 100;
  const currentSectionType = sectionToDataMap[currentSection];
  const isCurrentSectionLoading = isRefreshing || isLoadingSectionContent[sectionToDataMap[currentSection]];

  // Loading state - show spinner only for the current section
  if (isCurrentSectionLoading) {
    return (
      <SlideWrapper className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
        <div className="w-full h-full flex items-center justify-center">
          <div className="flex flex-col items-center">
            <LoadingSpinner />
            <p className="mt-4 text-indigo-700 font-medium">
              Generating {sections[currentSection]} content...
            </p>
            <p className="mt-2 text-gray-500 text-sm">
              This may take a few moments. All sections will be loaded in the background.
            </p>
          </div>
        </div>
      </SlideWrapper>
    );
  }

  // No content case
  if (!subtopicContent) {
    return (
      <SlideWrapper className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center max-w-lg p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-indigo-100">
            <h3 className="text-xl font-bold text-indigo-800 mb-3">Content Not Generated Yet</h3>
            <p className="text-gray-600 mb-4">This subtopic content hasn't been generated yet. Click the button below to create interactive learning content.</p>
            <button
              onClick={() => {
                setIsLoadingSectionContent(prev => ({
                  ...prev,
                  overview: true
                }));
                contentFetchAttemptedRef.current.overview = false;
                onRefreshContentRef.current({
                  questIndex,
                  subtopicIndex,
                  sectionType: 'overview',
                  forceRefresh: true
                });
              }}
              className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              Generate Content
            </button>
          </div>
        </div>
      </SlideWrapper>
    );
  }

  // Missing current section content
  if (!subtopicContent[currentSectionType] || 
    (Array.isArray(subtopicContent[currentSectionType]) && subtopicContent[currentSectionType].length === 0)) {
    return (
      <SlideWrapper className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center max-w-lg p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-indigo-100">
            <h3 className="text-xl font-bold text-indigo-800 mb-3">{sections[currentSection]} Content Missing</h3>
            <p className="text-gray-600 mb-4">This {sections[currentSection].toLowerCase()} content hasn't been generated yet. Click the button below to create it.</p>
            <button
              onClick={() => {
                setIsLoadingSectionContent(prev => ({
                  ...prev,
                  [currentSectionType]: true
                }));
                contentFetchAttemptedRef.current[currentSectionType] = false;
                onRefreshContentRef.current({
                  questIndex,
                  subtopicIndex,
                  sectionType: currentSectionType,
                  forceRefresh: true
                });
              }}
              className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              Generate {sections[currentSection]}
            </button>
          </div>
        </div>
      </SlideWrapper>
    );
  }

  // Required data missing
  if (!content || !content.quests || questIndex === undefined || questIndex === null || subtopicIndex === undefined || subtopicIndex === null) {
    return (
      <SlideWrapper className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-xl text-red-600 mb-4">Required content data not found</h3>
            <button
              onClick={onPrevious}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Back to Course
            </button>
          </div>
        </div>
      </SlideWrapper>
    );
  }

  // Main render
// Main render (continuing from where your code left off)
return (
  <SlideWrapper className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
    <div className="w-full h-full flex items-center justify-center px-2">
      <div className="w-full max-w-7xl aspect-video bg-white/90 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden flex flex-col">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-2 px-4 flex items-center justify-between shadow-md relative z-10">
          <button 
            onClick={onReturnToQuest}
            className="flex items-center hover:bg-white/20 px-2 py-1 rounded-lg transition-colors font-medium text-xs"
          >
            <svg
              className="mr-1 w-4 h-4"
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
            Back to Topics
          </button>
          
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded-md bg-white/20 text-xs font-semibold">
              Quest {questIndex + 1}
            </span>
            <span>•</span>
            <span className="px-2 py-0.5 rounded-md bg-white/10 text-xs font-medium">
              Topic {subtopicIndex + 1}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium">{currentSection + 1}/{sections.length}</span>
            <div className="w-16 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 py-2 px-4 border-b border-indigo-100 shadow-sm">
          <motion.h1
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`text-lg md:text-xl font-bold bg-gradient-to-r ${gradientTextColors} bg-clip-text text-transparent tracking-tight text-center`}
          >
            {subtopicContent?.title || (content?.quests?.[questIndex]?.objectives?.[subtopicIndex] || "Topic Content")}
          </motion.h1>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          <div className="w-40 bg-gradient-to-b from-gray-50 to-indigo-50 py-4 px-2 border-r border-indigo-100 flex flex-col">
            {sections.map((section, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSection(idx)}
                className={`py-2.5 px-3 mb-3 rounded-lg text-left transition-all flex items-center text-xs ${
                  currentSection === idx 
                    ? `bg-gradient-to-r ${gradientColors} text-white shadow-md` 
                    : 'text-gray-600 hover:bg-indigo-100/50'
                }`}
              >
                <span className={`w-5 h-5 flex items-center justify-center rounded-full mr-2 text-xs ${
                  currentSection === idx 
                    ? 'bg-white/20 text-white' 
                    : 'bg-indigo-100 text-indigo-600'
                }`}>
                  {idx + 1}
                </span>
                <span className="font-medium">{section}</span>
              </button>
            ))}

            <div className="flex-1"></div>

            <div className="md:hidden mt-2 flex justify-between">
              <button
                onClick={goToPreviousSection}
                disabled={currentSection === 0}
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentSection === 0 
                    ? 'bg-gray-200 text-gray-400' 
                    : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                }`}
              >
                <svg
                  className="w-4 h-4"
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
              </button>
              
              <button
                onClick={goToNextSection}
                className={`flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r ${gradientColors} text-white hover:shadow-md`}
              >
                <svg
                  className="w-4 h-4"
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
              </button>
            </div>
          </div>
          
          <div className="flex-1 p-3 md:p-4 overflow-hidden flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-hidden flex flex-col"
              >
                {renderSectionContent()}
              </motion.div>
            </AnimatePresence>
            
            <div className="hidden md:flex justify-between mt-3 pt-2 border-t border-indigo-100">
              <button
                onClick={goToPreviousSection}
                className="flex items-center px-3 py-1 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-100 text-xs"
              >
                <svg
                  className="mr-1 w-3 h-3"
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
                {currentSection === 0 ? 'Back to Topics' : 'Previous'}
              </button>

              <button
                onClick={goToNextSection}
                className={`flex items-center px-3 py-1 text-white rounded-lg bg-gradient-to-r ${gradientColors} hover:shadow-md transition-all transform hover:scale-105 text-xs`}
              >
                {currentSection < sections.length - 1 ? 'Next' : 'Complete'}
                <svg
                  className="ml-1 w-3 h-3"
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
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </SlideWrapper>
);
});

export default SubtopicContentSlide;