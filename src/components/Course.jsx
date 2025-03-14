import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import TOCSlide from './slides/TOCSlide';
import MemoryGameSlide from './slides/MemoryGameSlide';
import DetailedQuestSlide from './slides/DetailedQuestSlide';
import WelcomeSlide from './slides/WelcomeSlide';
import SubtopicContentSlide from './slides/SubtopicContentSlide';
import CourseSummarySlide from './slides/CourseSummarySlide';
import DatabaseService from '../services/databaseService';
import AdventureNavigationBar from './common/AdventureNavigationBar';

import { 
  generateSlideContent, 
  fetchDetailContent, 
  fetchMemoryContent,
  getMemoryFallbackContent,
  fetchSubtopicContent,
  fetchWelcomeContent,
  fetchSummaryContent,
  getSummaryFallbackContent
} from '../services/openai';

// Create an object to track pending requests outside the component
const pendingRequests = {};

const Course = () => {
  // ------------------ State & Refs ------------------
  const [currentSlide, setCurrentSlide] = useState(0);  
  const [courseData, setCourseData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState({
    intro: false,
    content: false,
    toc: false,
    detail: false,
    questDetail: false,
    summary: null
  });
  const [slideContents, setSlideContents] = useState({});
  const [selectedQuestIndex, setSelectedQuestIndex] = useState(null);
  const [isShowingQuestDetail, setIsShowingQuestDetail] = useState(false);
  const [questSubtopics, setQuestSubtopics] = useState({});
  const [selectedSubtopicIndex, setSelectedSubtopicIndex] = useState(null);
  const [isShowingSubtopicContent, setIsShowingSubtopicContent] = useState(false);
  const [slides, setSlides] = useState([]);

  // State to track the sequence of quests
  const [questSequence, setQuestSequence] = useState({
    started: false,
    currentQuestIndex: 0,
    currentSubtopicIndex: 0,
    totalQuests: 0,
    mode: 'exploration'
  });

  // Navigation helpers
  const location = useLocation();
  const navigate = useNavigate();

  // Refs to avoid circular dependencies
  const refreshSlidesRef = useRef(() => {
    console.log("Initial refreshSlides called - will be replaced");
  });
  
  const handleQuestSelectRef = useRef(async (questIndex) => {
    console.log("Initial handleQuestSelect called - will be replaced");
  });
  
  const handleReturnToQuestRef = useRef(() => {
    console.log("Initial handleReturnToQuest called - will be replaced");
  });
  
  const handleSubtopicSelectRef = useRef((subtopicIndex) => {
    console.log("Initial handleSubtopicSelect called - will be replaced");
  });

  const preloadRemainingSubtopicSectionsRef = useRef(async () => {});

  const handleFetchSubtopicContentRef = useRef(async (options) => {
    console.log("Initial handleFetchSubtopicContent called - will be replaced");
    return null;
  });

  console.log("Quest Sequence State:", questSequence);

  // ------------------ Stable Wrappers ------------------
  const stableHandleSubtopicSelect = useCallback((subtopicIndex) => {
    handleSubtopicSelectRef.current(subtopicIndex);
  }, []);

  const stableHandleReturnToQuest = useCallback(() => {
    handleReturnToQuestRef.current();
  }, []);

  // ------------------ Utility Callbacks ------------------
  const getContentType = useCallback((contentKey) => {
    switch (contentKey) {
      case 'welcome': return 'WELCOME';
      case 'toc': return 'TOC';
      case 'content': return 'TYPES';
      case 'detail': return 'DETAIL';
      case 'memory': return 'MEMORY';
      default: return '';
    }
  }, []);


  const getSubtopicContent = useCallback((questIndex, subtopicIndex) => {
    if (
      !slideContents.toc || 
      !slideContents.toc.quests || 
      !slideContents.toc.quests[questIndex] ||
      !slideContents.toc.quests[questIndex].subtopics ||
      !slideContents.toc.quests[questIndex].subtopics[subtopicIndex]
    ) {
      return null;
    }
    
    return slideContents.toc.quests[questIndex].subtopics[subtopicIndex].content;
  }, [slideContents.toc]);

  const fetchSlideContent = useCallback(async (contentKey, options = {}, forceRefresh = false) => {
    // Skip if already fetching this content
    if (pendingRequests[contentKey]) {
      console.log(`Request for ${contentKey} already in progress, skipping duplicate`);
      return;
    }
    
    // First check database if we have this content
    if (!forceRefresh && courseData?.id) {
      try {
        const dbContent = await DatabaseService.getSlideContent(courseData.id, contentKey);
        if (dbContent) {
          console.log(`Using ${contentKey} content from database`);
          setSlideContents((prev) => ({ ...prev, [contentKey]: dbContent }));
          return dbContent;
        }
      } catch (err) {
        console.error(`Error fetching ${contentKey} from database:`, err);
      }
    }
    
    // Skip if we already have this content in state and not forcing a refresh
    if (!forceRefresh && slideContents[contentKey]) {
      console.log(`Using cached content for ${contentKey}`);
      return slideContents[contentKey];
    }
    
    // Mark this request as pending
    pendingRequests[contentKey] = true;
    console.log(`Starting new request for ${contentKey}${forceRefresh ? ' (forced refresh)' : ''}`);
    
    const type = getContentType(contentKey);
    try {
      setIsRefreshing(prev => ({ ...prev, [contentKey]: true }));
      
      let data;
      if (contentKey === 'welcome') {
        data = await fetchWelcomeContent(courseData);
      } else if (contentKey === 'memory') {
        data = await fetchMemoryContent(courseData);
      } else {
        console.log(`Generating content for ${contentKey} using type ${type}`);
        data = await generateSlideContent(type, courseData, options);
        console.log(`Received data for ${contentKey}:`, data);
      }
      
      // Update state
      setSlideContents((prev) => ({ ...prev, [contentKey]: data }));
      
      // Save to database
      if (courseData?.id) {
        try {
          await DatabaseService.storeSlideContent(courseData.id, contentKey, data);
          console.log(`Saved ${contentKey} to database`);
        } catch (err) {
          console.error(`Error saving ${contentKey} to database:`, err);
        }
      }
      
      return data;
    } catch (error) {
      console.error(`Error fetching ${contentKey} content:`, error);
    } finally {
      // Clear the pending request flag when done
      delete pendingRequests[contentKey];
      setIsRefreshing(prev => ({ ...prev, [contentKey]: false }));
    }
  }, [courseData, slideContents, getContentType]);

  const handleFetchDetailContent = useCallback(async (selectedTopicIndex, forceRefresh = false) => {
    try {
      // Make sure we have the basic content first
      if (!slideContents.content) {
        return;
      }

      setIsRefreshing(prev => ({ ...prev, detail: true }));
      
      // Check if we already have details for this topic and not forcing refresh
      if (
        !forceRefresh && 
        slideContents.content.details && 
        slideContents.content.details[selectedTopicIndex]
      ) {
        // We already have this detail content, no need to fetch
        setIsRefreshing(prev => ({ ...prev, detail: false }));
        return;
      }
      
      // Use the fetchDetailContent function to get details for this topic
      const updatedContent = await fetchDetailContent(
        'content',
        slideContents.content,
        selectedTopicIndex
      );
      
      // Update the content with the new details
      setSlideContents(prev => ({
        ...prev,
        content: updatedContent
      }));
    } catch (error) {
      console.error('Error fetching detail content:', error);
    } finally {
      setIsRefreshing(prev => ({ ...prev, detail: false }));
    }
  }, [slideContents.content]);

  const handleFetchSummaryContent = useCallback(async (options = {}) => {
    const forceRefresh = options.forceRefresh || false;
    
    // Skip if already fetching
    if (isRefreshing.summary && !forceRefresh) {
      console.log('Summary content fetch already in progress');
      return;
    }
    
    // Check if we already have content
    if (!forceRefresh && slideContents.summary) {
      console.log('Using existing summary content');
      return;
    }
    
    try {
      // Show loading indicator
      setIsRefreshing(prev => ({ ...prev, summary: true }));
      
      // Create enhanced course data with TOC content
      const enhancedCourseData = {
        ...courseData,
        tocContent: slideContents.toc
      };
      
      // Fetch the summary content
      const summaryContent = await fetchSummaryContent(enhancedCourseData);
      
      // Update state with new content
      setSlideContents(prev => ({
        ...prev,
        summary: summaryContent
      }));
      
      console.log('Successfully fetched summary content');
    } catch (error) {
      console.error('Error fetching summary content:', error);
      
      // Use fallback content
      const fallbackContent = getSummaryFallbackContent({
        ...courseData,
        tocContent: slideContents.toc
      });
      
      setSlideContents(prev => ({
        ...prev,
        summary: fallbackContent
      }));
    } finally {
      // Reset loading state
      setIsRefreshing(prev => ({ ...prev, summary: false }));
    }
  }, [courseData, slideContents.toc, isRefreshing.summary]);

  const handleRefreshContent = useCallback(async (contentKey, options = {}) => {
    console.log(`Refreshing content for ${contentKey} with options:`, options);
    
    // Extract the forceRefresh flag from options
    const forceRefresh = options.forceRefresh || true; // Default to true (always refresh)
    
    if (contentKey === 'summary') {
      // Handle summary content refresh
      setIsRefreshing(prev => ({ ...prev, summary: true }));
      
      try {
        // Delete the existing cached summary content
        setSlideContents(prev => {
          const newState = { ...prev };
          delete newState.summary;
          return newState;
        });
        
        // Create enhanced course data with TOC content
        const enhancedCourseData = {
          ...courseData,
          tocContent: slideContents.toc
        };
        
        // Generate new summary content
        const newSummaryContent = await fetchSummaryContent(enhancedCourseData);
        
        // Set the new content
        setSlideContents(prev => ({
          ...prev,
          summary: newSummaryContent
        }));
      } catch (error) {
        console.error("Error refreshing summary content:", error);
        
        // Use fallback content
        const fallbackContent = getSummaryFallbackContent({
          ...courseData,
          tocContent: slideContents.toc
        });
        
        setSlideContents(prev => ({
          ...prev,
          summary: fallbackContent
        }));
      } finally {
        setIsRefreshing(prev => ({ ...prev, summary: false }));
      }
    } else if (contentKey === 'memory') {
      // Always force a refresh for memory content to get new pairs
      setIsRefreshing(prev => ({ ...prev, memory: true }));
      
      try {
        // Delete the existing cached memory content
        setSlideContents(prev => {
          const newState = { ...prev };
          delete newState.memory;
          return newState;
        });
        
        // Generate new memory game content
        const newMemoryContent = await fetchMemoryContent(courseData);
        
        // Set the new content
        setSlideContents(prev => ({
          ...prev,
          memory: newMemoryContent
        }));
      } catch (error) {
        console.error("Error refreshing memory content:", error);
        
        // Use fallback content if implemented
        const fallbackContent = getMemoryFallbackContent
          ? getMemoryFallbackContent(courseData)
          : null;
        if (fallbackContent) {
          setSlideContents(prev => ({
            ...prev,
            memory: fallbackContent
          }));
        }
      } finally {
        setIsRefreshing(prev => ({ ...prev, memory: false }));
      }
    } else {
      // Handle other slide types with the forceRefresh parameter
      await fetchSlideContent(contentKey, options, forceRefresh);
    }
  }, [courseData, slideContents.toc, fetchSlideContent]);

  // ------------------ refreshSlides ------------------
  const refreshSlides = useCallback(() => {
    if (refreshSlidesRef.current) {
      refreshSlidesRef.current();
    } else {
      console.log("refreshSlidesRef.current not yet available");
    }
  }, []);

  // ------------------ handleFetchSubtopicContent ------------------
  // Moved up so it’s defined before getSlides references it
  const handleFetchSubtopicContent = useCallback(async ({
    questIndex, 
    subtopicIndex, 
    sectionType = 'overview', 
    forceRefresh = false, 
    preloadAll = false,
    skipRefresh = false,
    fromDatabase = false, 
    databaseContent = null 
  }) => {
    // Create a unique request ID to track and prevent duplicate requests
    const requestId = `${questIndex}-${subtopicIndex}-${sectionType}`;
    
    // If data is already provided from database, use it directly
    if (fromDatabase && databaseContent) {
      console.log(`Using provided database content for ${requestId}`);
      
      // Update questSubtopics with database content
      const subtopicKey = `${questIndex}-${subtopicIndex}`;
      setQuestSubtopics(prev => ({
        ...prev,
        [subtopicKey]: databaseContent
      }));
      
      // Also update TOC content
      setSlideContents(prev => {
        // Create a deep copy to ensure React detects the change
        const updatedToc = JSON.parse(JSON.stringify(prev.toc));
        
        // Check if the quest and subtopic exist
        if (updatedToc?.quests?.[questIndex]?.subtopics?.[subtopicIndex]) {
          // Make sure the content property exists
          updatedToc.quests[questIndex].subtopics[subtopicIndex].content = 
            updatedToc.quests[questIndex].subtopics[subtopicIndex].content || {};
          
          // Update with database content
          updatedToc.quests[questIndex].subtopics[subtopicIndex].content = {
            ...updatedToc.quests[questIndex].subtopics[subtopicIndex].content,
            ...databaseContent
          };
        }
        
        return {
          ...prev,
          toc: updatedToc
        };
      });
      
      // Only refresh UI if not in background mode
      if (!skipRefresh) {
        refreshSlides();
      }
      
      return databaseContent;
    }
    
    // If we're already processing this request, return a resolved promise
    if (pendingRequests[requestId] && !forceRefresh) {
      console.log(`Request for ${requestId} already in progress, skipping duplicate`);
      return pendingRequests[requestId]; // Return the existing promise
    }
    
    // Create the promise for this request
    const requestPromise = (async () => {
      try {
        // Only show loading indicator if we're loading the current visible section
        // AND we're not doing a background load (skipRefresh)
        if (!skipRefresh && (sectionType === 'overview' || selectedSubtopicIndex === subtopicIndex)) {
          setIsRefreshing(prev => ({ ...prev, questDetail: true }));
        }
        
        // Get the key for this subtopic in our state
        const subtopicKey = `${questIndex}-${subtopicIndex}`;
        
        // First check if content exists in database
        if (!forceRefresh && courseData?.id) {
          try {
            const dbContent = await DatabaseService.getSubtopicContent(courseData.id, questIndex, subtopicIndex);
            
            if (dbContent && dbContent[sectionType]) {
              console.log(`Using ${sectionType} content from database for subtopic ${subtopicKey}`);
              
              // Update state with database content
              setQuestSubtopics(prev => ({
                ...prev,
                [subtopicKey]: dbContent
              }));
              
              // Also update TOC content
              setSlideContents(prev => {
                // Create a deep copy to ensure React detects the change
                const updatedToc = JSON.parse(JSON.stringify(prev.toc));
                
                // Check if the quest and subtopic exist
                if (updatedToc.quests?.[questIndex]?.subtopics?.[subtopicIndex]) {
                  // Make sure the content property exists
                  updatedToc.quests[questIndex].subtopics[subtopicIndex].content =
                    updatedToc.quests[questIndex].subtopics[subtopicIndex].content || {};
                  
                  updatedToc.quests[questIndex].subtopics[subtopicIndex].content = {
                    ...updatedToc.quests[questIndex].subtopics[subtopicIndex].content,
                    ...dbContent
                  };
                }
                
                return {
                  ...prev,
                  toc: updatedToc
                };
              });
              
              // If preloadAll is requested and we have database content,
              // still check for missing sections
              if (preloadAll) {
                preloadRemainingSubtopicSectionsRef.current(questIndex, subtopicIndex, dbContent);
              }
              
              // Only refresh UI if not in background mode
              if (!skipRefresh) {
                refreshSlides();
              }
              
              return dbContent;
            }
          } catch (err) {
            console.error(`Error fetching subtopic content from database:`, err);
          }
        }
        
        // If not in database or forcing refresh, continue with normal flow...
        // Get existing content from questSubtopics
        const existingContent = questSubtopics[subtopicKey] || {};
        console.log(`Existing content for ${subtopicKey} in questSubtopics:`, existingContent);
        
        // Check if we already have this section's content cached and not forcing refresh
        if (
          !forceRefresh &&
          existingContent[sectionType] &&
          (
            typeof existingContent[sectionType] === 'string' ||
            (Array.isArray(existingContent[sectionType]) && existingContent[sectionType].length > 0)
          )
        ) {
          console.log(`Using cached subtopic content for section: ${sectionType}`);
          
          // If preloadAll is requested, trigger loading of other sections in the background
          if (preloadAll) {
            preloadRemainingSubtopicSectionsRef.current(questIndex, subtopicIndex, existingContent);
          }
          
          return existingContent;
        }
        
        // Get the TOC content from state
        const tocContent = slideContents.toc;
        if (!tocContent || !tocContent.quests) {
          console.error('TOC content not available', slideContents);
          return null;
        }
        
        // Make sure we have the quest and subtopic
        const quest = tocContent.quests[questIndex];
        if (!quest) {
          console.error('Quest not found', { questIndex, quests: tocContent.quests });
          return null;
        }
        
        console.log("Found quest:", quest.title);
        
        // If no subtopics yet, initialize them
        if (!quest.subtopics) {
          console.log("Initializing subtopics from objectives");
          // Create subtopics based on objectives
          const generatedSubtopics = quest.objectives.map((objective, idx) => ({
            title: `${quest.title} - Topic ${idx + 1}`,
            description: objective,
            content: null
          }));
          
          // Update the TOC content with these subtopics
          const updatedTocContent = {
            ...tocContent,
            quests: tocContent.quests.map((q, idx) => 
              idx === questIndex 
                ? { ...q, subtopics: generatedSubtopics } 
                : q
            )
          };
          
          // Save the updated TOC content
          setSlideContents(prev => ({ ...prev, toc: updatedTocContent }));
          
          // Update local reference to quest with subtopics
          quest.subtopics = generatedSubtopics;
        }
        
        // Get the current objective to pass to the API
        const objective = quest.objectives?.[subtopicIndex];
        console.log(`Objective for subtopic ${subtopicIndex}:`, objective);
        
        // Create enhanced courseData with additional context
        const enhancedCourseData = {
          ...courseData,
          tocContent: tocContent,
          currentQuest: {
            title: quest.title,
            index: questIndex
          },
          currentSubtopic: {
            description: objective,
            index: subtopicIndex
          },
          // Add any existing subtopic content to provide context to API
          subtopicContent: existingContent
        };
        
        // Fetch the content for this specific section of the subtopic
        console.log(`Calling fetchSubtopicContent API for section: ${sectionType}`);
        const sectionContent = await fetchSubtopicContent(
          enhancedCourseData,
          questIndex,
          subtopicIndex,
          sectionType
        );
        
        console.log(`Received subtopic content for section ${sectionType}:`, sectionContent);
        
        if (!sectionContent || !sectionContent[sectionType]) {
          console.error(`API returned invalid content for ${sectionType}`);
          return null;
        }
        
        // Create a new content object with the section data
        const updatedSubtopicContent = {
          ...existingContent,
          title: sectionContent.title || existingContent.title || `Topic ${subtopicIndex + 1}`,
          [sectionType]: sectionContent[sectionType]
        };
        
        console.log(`Updated content for ${sectionType}:`, updatedSubtopicContent);
        
        // Save to database
        if (courseData?.id) {
          try {
            console.log(`Saving complete subtopic content to database for course ${courseData?.id}:`, updatedSubtopicContent);
            await DatabaseService.storeSubtopicContent(
              courseData?.id, 
              questIndex, 
              subtopicIndex, 
              updatedSubtopicContent
            );
            console.log(`Successfully saved complete subtopic content to database`);
          } catch (err) {
            console.error(`Error saving subtopic content to database:`, err);
          }
        }
        
        // Create a new questSubtopics object to ensure React detects the change
        const newQuestSubtopics = {
          ...questSubtopics,
          [subtopicKey]: updatedSubtopicContent
        };
        
        // Update our quest subtopics state with the new object
        setQuestSubtopics(newQuestSubtopics);
        
        // Log the success
        console.log(`Successfully updated questSubtopics with ${sectionType} content`);
        
        // Also update the TOC content with this subtopic content
        setSlideContents(prev => {
          // Create a deep copy to ensure React detects the change
          const updatedToc = JSON.parse(JSON.stringify(prev.toc));
          
          if (updatedToc.quests?.[questIndex]?.subtopics?.[subtopicIndex]) {
            updatedToc.quests[questIndex].subtopics[subtopicIndex].content =
              updatedToc.quests[questIndex].subtopics[subtopicIndex].content || {};
            
            updatedToc.quests[questIndex].subtopics[subtopicIndex].content = {
              ...updatedToc.quests[questIndex].subtopics[subtopicIndex].content,
              title: sectionContent.title || `Topic ${subtopicIndex + 1}`,
              [sectionType]: sectionContent[sectionType]
            };
          }
          
          return {
            ...prev,
            toc: updatedToc
          };
        });
        
        console.log(`Successfully updated both state sources with ${sectionType} content`);
        
        // Force a refresh of the slides ONLY if not skipRefresh
        if (!skipRefresh) {
          refreshSlides();
        } else {
          console.log(`Skipping UI refresh for background load of ${sectionType}`);
        }
        
        // If preloadAll is true and we've just loaded overview, preload the rest of the sections
        if (preloadAll && sectionType === 'overview') {
          preloadRemainingSubtopicSectionsRef.current(questIndex, subtopicIndex, updatedSubtopicContent);
        } else {
          // Continue with your existing sequential preloading...
          if (sectionType === 'overview') {
            setTimeout(() => {
              if (!updatedSubtopicContent.keyPoints) {
                console.log("Preloading keyPoints in background...");
                handleFetchSubtopicContent({
                  questIndex,
                  subtopicIndex,
                  sectionType: 'keyPoints',
                  forceRefresh: false,
                  skipRefresh: true
                });
              }
            }, 2000);
          }
        }
        
        // Return the updated content
        return updatedSubtopicContent;
      } catch (error) {
        console.error('Error fetching subtopic content:', error);
        return null;
      } finally {
        if (!skipRefresh && (sectionType === 'overview' || selectedSubtopicIndex === subtopicIndex)) {
          setIsRefreshing(prev => ({ ...prev, questDetail: false }));
        }
      }
    })();
    
    pendingRequests[requestId] = requestPromise;
    
    requestPromise.finally(() => {
      delete pendingRequests[requestId];
    });
    
    return requestPromise;
  }, [
    courseData,
    selectedSubtopicIndex,
    slideContents,
    questSubtopics,
    refreshSlides
  ]);

  // Keep this effect so the ref always points to the newest callback
  useEffect(() => {
    handleFetchSubtopicContentRef.current = handleFetchSubtopicContent;
  }, [handleFetchSubtopicContent]);

  // ------------------ stableSubtopicRefreshHandler ------------------
  const stableSubtopicRefreshHandler = useCallback((options) => {
    const { questIndex, subtopicIndex, sectionType, forceRefresh } = options;
    const requestId = `${questIndex}-${subtopicIndex}-${sectionType}`;
    
    if (pendingRequests[requestId] && !forceRefresh) {
      console.log(`Request ${requestId} already in progress, returning cached promise`);
      return pendingRequests[requestId];
    }
    
    console.log(`Starting request for ${requestId}`);
    const requestPromise = handleFetchSubtopicContent(options)
      .finally(() => {
        delete pendingRequests[requestId];
      });
    
    pendingRequests[requestId] = requestPromise;
    
    return requestPromise;
  }, [handleFetchSubtopicContent]);

  // ------------------ preloadRemainingSubtopicSections ------------------
  const preloadRemainingSubtopicSections = useCallback(async (questIndex, subtopicIndex, existingContent) => {
    const allSectionTypes = ['keyPoints', 'examples', 'exercises', 'matchingExercises'];
    const sectionsToFetch = allSectionTypes.filter(
      type => !existingContent[type] || 
      (Array.isArray(existingContent[type]) && existingContent[type].length === 0)
    );
    
    console.log(`Preloading remaining sections for subtopic ${questIndex}-${subtopicIndex}:`, sectionsToFetch);
    
    if (courseData?.id) {
      for (const sectionType of [...sectionsToFetch]) {
        try {
          const dbContent = await DatabaseService.getSubtopicContent(courseData.id, questIndex, subtopicIndex);
          
          if (dbContent && dbContent[sectionType]) {
            console.log(`Found ${sectionType} in database for subtopic ${questIndex}-${subtopicIndex}`);
            const index = sectionsToFetch.indexOf(sectionType);
            if (index > -1) {
              sectionsToFetch.splice(index, 1);
            }
            const subtopicKey = `${questIndex}-${subtopicIndex}`;
            setQuestSubtopics(prev => ({
              ...prev,
              [subtopicKey]: {
                ...prev[subtopicKey],
                ...dbContent
              }
            }));
          }
        } catch (err) {
          console.error(`Error checking database for ${sectionType}:`, err);
        }
      }
    }
    
    sectionsToFetch.forEach((sectionType, index) => {
      setTimeout(() => {
        console.log(`Background loading ${sectionType}`);
        handleFetchSubtopicContent({
          questIndex,
          subtopicIndex,
          sectionType,
          forceRefresh: false,
          preloadAll: false,
          skipRefresh: true
        }).catch(err => console.error(`Error preloading ${sectionType}:`, err));
      }, index * 1000);
    });
  }, [courseData, handleFetchSubtopicContent]);

  useEffect(() => {
    preloadRemainingSubtopicSectionsRef.current = preloadRemainingSubtopicSections;
  }, [preloadRemainingSubtopicSections]);

  // ------------------ handleReturnToQuest ------------------
  const handleReturnToQuest = useCallback(() => {
    setIsShowingSubtopicContent(false);
    setSelectedSubtopicIndex(null);
    setCurrentSlide(2);
  }, []);

  useEffect(() => {
    handleReturnToQuestRef.current = handleReturnToQuest;
  }, [handleReturnToQuest]);

  // ------------------ getNextSequenceStep ------------------
  const getNextSequenceStep = useCallback(() => {
    if (!questSequence.started || questSequence.mode !== 'adventure') {
      return null;
    }
    
    const currentQuest = slideContents.toc?.quests?.[questSequence.currentQuestIndex];
    if (!currentQuest) return null;
    
    const totalSubtopics = currentQuest.objectives ? currentQuest.objectives.length : 0;
    
    if (questSequence.currentSubtopicIndex < totalSubtopics - 1) {
      return {
        questIndex: questSequence.currentQuestIndex,
        subtopicIndex: questSequence.currentSubtopicIndex + 1,
        isLastInSequence: false
      };
    } else {
      const nextQuestIndex = questSequence.currentQuestIndex + 1;
      if (nextQuestIndex >= questSequence.totalQuests) {
        return {
          isLastInSequence: true
        };
      }
      return {
        questIndex: nextQuestIndex,
        subtopicIndex: 0,
        isLastInSequence: false
      };
    }
  }, [questSequence, slideContents.toc]);

  // ------------------ handleQuestSelect ------------------
  const handleQuestSelect = useCallback(async (questIndex) => {
    console.log("handleQuestSelect called with index:", questIndex);
    
    setSelectedQuestIndex(questIndex);
    setIsShowingQuestDetail(true);
    
    if (questSequence.mode === 'adventure' && questSequence.started) {
      setQuestSequence(prev => ({
        ...prev,
        currentQuestIndex: questIndex,
        currentSubtopicIndex: 0
      }));
    } else {
      setQuestSequence(prev => ({
        ...prev,
        mode: 'exploration',
        currentQuestIndex: questIndex
      }));
    }
    
    console.log("Quest selection state updated");
  }, [questSequence.mode, questSequence.started]);

  useEffect(() => {
    handleQuestSelectRef.current = handleQuestSelect;
  }, [handleQuestSelect]);

  // ------------------ handleSubtopicSelect ------------------
  const handleSubtopicSelect = useCallback((subtopicIndex) => {
    console.log("handleSubtopicSelect called with index:", subtopicIndex);
    setSelectedSubtopicIndex(subtopicIndex);
    setIsShowingSubtopicContent(true);
    setCurrentSlide(3);
    
    if (questSequence.mode === 'adventure' && questSequence.started) {
      setQuestSequence(prev => ({
        ...prev,
        currentSubtopicIndex: subtopicIndex
      }));
    }
    
    handleFetchSubtopicContentRef.current({
      questIndex: selectedQuestIndex,
      subtopicIndex: subtopicIndex,
      sectionType: 'overview',
      forceRefresh: false,
      preloadAll: true
    });
  }, [selectedQuestIndex, questSequence.mode, questSequence.started]);

  useEffect(() => {
    handleSubtopicSelectRef.current = handleSubtopicSelect;
  }, [handleSubtopicSelect]);

  // ------------------ handleNextQuest ------------------
  const handleNextQuest = useCallback(async () => {
    if (!questSequence.started) return;
    
    const nextQuestIndex = questSequence.currentQuestIndex + 1;
    if (nextQuestIndex >= questSequence.totalQuests) {
      console.log("Quests complete");
      setQuestSequence(prev => ({
        ...prev,
        started: false
      }));
      setIsShowingQuestDetail(false);
      setSelectedQuestIndex(null);
      setCurrentSlide(1);
      return;
    }
    
    setQuestSequence(prev => ({
      ...prev,
      currentQuestIndex: nextQuestIndex
    }));
    
    await handleQuestSelectRef.current(nextQuestIndex);
  }, [questSequence]);

  // ------------------ handleAdvanceAdventure ------------------
  const handleAdvanceAdventure = useCallback(async () => {
    if (!questSequence.started || questSequence.mode !== 'adventure') {
      handleNext();
      return;
    }
    
    const nextStep = getNextSequenceStep();
    
    if (!nextStep) {
      handleNext();
      return;
    }
    
    if (nextStep.isLastInSequence) {
      console.log("Adventure complete");
      setQuestSequence(prev => ({
        ...prev,
        started: false,
        mode: 'exploration'
      }));
      setIsShowingQuestDetail(false);
      setIsShowingSubtopicContent(false);
      setSelectedQuestIndex(null);
      setSelectedSubtopicIndex(null);
      setCurrentSlide(4);
      return;
    }
    
    if (nextStep.questIndex !== questSequence.currentQuestIndex) {
      setIsShowingSubtopicContent(false);
      setSelectedSubtopicIndex(null);
      setQuestSequence(prev => ({
        ...prev,
        currentQuestIndex: nextStep.questIndex,
        currentSubtopicIndex: nextStep.subtopicIndex
      }));
      
      await handleQuestSelectRef.current(nextStep.questIndex);
      setTimeout(() => {
        stableHandleSubtopicSelect(nextStep.subtopicIndex);
      }, 300);
    } else {
      setQuestSequence(prev => ({
        ...prev,
        currentSubtopicIndex: nextStep.subtopicIndex
      }));
      stableHandleSubtopicSelect(nextStep.subtopicIndex);
    }
  }, [questSequence, getNextSequenceStep, stableHandleSubtopicSelect]);

  // ------------------ handleBeginAdventure ------------------
  const handleBeginAdventure = useCallback(async () => {
    console.log("Beginning adventure...");
    
    if (!slideContents.toc || !slideContents.toc.quests || slideContents.toc.quests.length === 0) {
      console.error("Cannot begin adventure: TOC content or quests not available");
      return;
    }
    
    setQuestSequence({
      started: true,
      currentQuestIndex: 0,
      currentSubtopicIndex: 0,
      totalQuests: slideContents.toc.quests.length,
      mode: 'adventure'
    });
    
    await handleQuestSelectRef.current(0);
    setTimeout(() => {
      if (
        slideContents.toc.quests[0].objectives && 
        slideContents.toc.quests[0].objectives.length > 0
      ) {
        stableHandleSubtopicSelect(0);
      }
    }, 300);
  }, [slideContents.toc, stableHandleSubtopicSelect]);

  // ------------------ handleExitAdventure ------------------
  const handleExitAdventure = useCallback(() => {
    setQuestSequence(prev => ({
      ...prev,
      started: false,
      mode: 'exploration'
    }));
    
    if (isShowingSubtopicContent) {
      setIsShowingSubtopicContent(false);
      setSelectedSubtopicIndex(null);
      setIsShowingQuestDetail(false);
      setSelectedQuestIndex(null);
      setCurrentSlide(1);
    }
  }, [isShowingSubtopicContent]);

  // ------------------ getSlides ------------------
  // Now that handleFetchSubtopicContent is declared above, we can safely reference it
  const getSlides = useCallback(() => {
    console.log(
      "getSlides called:",
      "isShowingQuestDetail =", isShowingQuestDetail, 
      "selectedQuestIndex =", selectedQuestIndex,
      "isShowingSubtopicContent =", isShowingSubtopicContent,
      "selectedSubtopicIndex =", selectedSubtopicIndex
    );
    
    const baseSlides = [
      { component: WelcomeSlide, title: 'Welcome', contentKey: 'welcome', props: { courseId: courseData?.id } },
      { component: TOCSlide, title: 'Table of Contents', contentKey: 'toc', props: { courseId: courseData?.id } },
      { component: MemoryGameSlide, title: 'Memory Matching Game', contentKey: 'memory', props: { courseId: courseData?.id } },
      { component: CourseSummarySlide, title: 'Course Summary', contentKey: 'summary', props: { courseId: courseData?.id } }
    ];
    
    if (isShowingSubtopicContent && selectedQuestIndex !== null && selectedSubtopicIndex !== null) {
      const subtopicKey = `${selectedQuestIndex}-${selectedSubtopicIndex}`;
      console.log("Content in questSubtopics:", questSubtopics[subtopicKey]);
      console.log("Content in TOC:", slideContents.toc?.quests?.[selectedQuestIndex]?.subtopics?.[selectedSubtopicIndex]?.content);

    }

    if (isShowingQuestDetail && selectedQuestIndex !== null) {
      if (isShowingSubtopicContent && selectedSubtopicIndex !== null) {
        console.log("Adding SubtopicContentSlide after DetailedQuestSlide");
        
        const subtopicKey = `${selectedQuestIndex}-${selectedSubtopicIndex}`;
        const fromQuestSubtopics = questSubtopics[subtopicKey] || {};
        const fromTocContent = slideContents.toc?.quests?.[selectedQuestIndex]?.subtopics?.[selectedSubtopicIndex]?.content || {};
        
        const subtopicContent = {
          ...fromTocContent,
          ...fromQuestSubtopics
        };
        
        console.log("Final merged subtopicContent for slide:", subtopicContent);
        
        const newSlides = [
          baseSlides[0],
          baseSlides[1],
          { 
            component: DetailedQuestSlide, 
            title: `Quest ${selectedQuestIndex + 1} Detail`, 
            contentKey: 'toc',
            props: { 
              selectedQuestIndex,
              onExitAdventure: handleExitAdventure,
              onNextQuest: handleNextQuest
            } 
          },
          {
            component: SubtopicContentSlide,
            title: `Quest ${selectedQuestIndex + 1} - Topic ${selectedSubtopicIndex + 1}`,
            contentKey: 'toc',
            props: { 
              questIndex: selectedQuestIndex,
              subtopicIndex: selectedSubtopicIndex,
              subtopicContent: subtopicContent,
              onRefreshContent: handleFetchSubtopicContent,
              courseId: courseData?.id,
              onReturnToQuest: stableHandleReturnToQuest,
              questSequence: questSequence,
              onNextInSequence: handleAdvanceAdventure,
              onExitAdventure: handleExitAdventure
            }
          },
          ...baseSlides.slice(2)
        ];
        
        return newSlides;
      }

      console.log("Adding DetailedQuestSlide after TOC, quest index =", selectedQuestIndex);
      const newSlides = [
        baseSlides[0],
        baseSlides[1],
        { 
          component: DetailedQuestSlide, 
          title: `Quest ${selectedQuestIndex + 1} Detail`, 
          contentKey: 'toc',
          props: { 
            selectedQuestIndex,
            onExitAdventure: handleExitAdventure,
            onNextQuest: handleNextQuest
          } 
        },
        ...baseSlides.slice(2)
      ];
        
      return newSlides;
    }
      
    return baseSlides;
  }, [
    isShowingQuestDetail,
    selectedQuestIndex, 
    isShowingSubtopicContent, 
    selectedSubtopicIndex, 
    questSubtopics, 
    slideContents.toc, 
    courseData?.id,
    handleFetchSubtopicContent,
    stableHandleReturnToQuest,
    questSequence,
    handleAdvanceAdventure,
    handleExitAdventure,
    handleNextQuest
  ]);

  // ------------------ refreshSlidesRef assignment ------------------
  useEffect(() => {
    refreshSlidesRef.current = () => {
      if (isShowingSubtopicContent && selectedSubtopicIndex !== null) {
        console.log("Refreshing slides to reflect content updates for visible subtopic");
        const updatedSlides = getSlides();
        setSlides(updatedSlides);
      } else {
        console.log("Content updated in background, deferring slide refresh until needed");
      }
    };
  }, [isShowingSubtopicContent, selectedSubtopicIndex, getSlides]);

  // ------------------ Sync slides when subtopic or quest changes ------------------
  useEffect(() => {
    if (isShowingQuestDetail || isShowingSubtopicContent || selectedSubtopicIndex !== null) {
      const updatedSlides = getSlides();
      setSlides(updatedSlides);
      console.log("Updated slides for subtopic:", updatedSlides.map(s => s.title));
    }
  }, [isShowingQuestDetail, isShowingSubtopicContent, selectedQuestIndex, selectedSubtopicIndex, slideContents.toc, getSlides]);

  useEffect(() => {
    const updatedSlides = getSlides();
    setSlides(updatedSlides);
    console.log("Updated slides:", updatedSlides.map(s => s.title));
  }, [isShowingQuestDetail, selectedQuestIndex, getSlides]);

  // ------------------ isShowingQuestDetail effect ------------------
  useEffect(() => {
    if (isShowingQuestDetail && selectedQuestIndex !== null) {
      console.log("EFFECT: Navigating to quest detail, quest index =", selectedQuestIndex);
      setCurrentSlide(2);
    }
  }, [isShowingQuestDetail, selectedQuestIndex]);

  // ------------------ handleNext ------------------
  const handleNext = useCallback(async () => {
    if (
      questSequence.mode === 'adventure' && 
      questSequence.started && 
      isShowingSubtopicContent && 
      currentSlide === 3
    ) {
      handleAdvanceAdventure();
      return;
    }
    
    if (isShowingQuestDetail && isShowingSubtopicContent && currentSlide === 3) {
      const quest = slideContents.toc.quests[selectedQuestIndex];
      if (quest && quest.objectives && selectedSubtopicIndex < quest.objectives.length - 1) {
        stableHandleSubtopicSelect(selectedSubtopicIndex + 1);
      } else {
        handleReturnToQuestRef.current();
      }
      return;
    }
    
    if (isShowingQuestDetail && questSequence.started && currentSlide === 2) {
      console.log("Moving to next quest in sequence");
      await handleNextQuest();
      return;
    }
    
    if (currentSlide < slides.length - 1) {
      const nextSlide = slides[currentSlide + 1];
      console.log("Navigating to next slide:", nextSlide.title, "contentKey:", nextSlide.contentKey);
      
      if (nextSlide.contentKey && !slideContents[nextSlide.contentKey]) {
        console.log("Content not available for next slide, fetching...");
        setIsLoading(true);
        await fetchSlideContent(nextSlide.contentKey);
        setCurrentSlide(currentSlide + 1);
        setIsLoading(false);
      } else {
        setCurrentSlide(currentSlide + 1);
      }
    }
  }, [
    currentSlide, 
    slides, 
    isShowingQuestDetail, 
    isShowingSubtopicContent, 
    questSequence, 
    selectedQuestIndex, 
    selectedSubtopicIndex, 
    slideContents, 
    stableHandleSubtopicSelect, 
    handleNextQuest, 
    fetchSlideContent,
    handleAdvanceAdventure
  ]);

  // ------------------ handlePrevious ------------------
  const handlePrevious = useCallback(() => {
    if (
      questSequence.mode === 'adventure' && 
      questSequence.started && 
      isShowingSubtopicContent
    ) {
      setIsShowingSubtopicContent(false);
      setSelectedSubtopicIndex(null);
      setCurrentSlide(2);
      return;
    }
  
    if (
      questSequence.mode === 'adventure' && 
      questSequence.started && 
      isShowingQuestDetail && 
      !isShowingSubtopicContent
    ) {
      if (questSequence.currentQuestIndex === 0) {
        setQuestSequence(prev => ({
          ...prev,
          started: false,
          mode: 'exploration'
        }));
        setIsShowingQuestDetail(false);
        setSelectedQuestIndex(null);
        setCurrentSlide(1);
      } else {
        const prevQuestIndex = questSequence.currentQuestIndex - 1;
        setQuestSequence(prev => ({
          ...prev,
          currentQuestIndex: prevQuestIndex,
          currentSubtopicIndex: 0
        }));
        handleQuestSelect(prevQuestIndex);
      }
      return;
    }
  
    if (isShowingQuestDetail && isShowingSubtopicContent && currentSlide === 3) {
      handleReturnToQuestRef.current();
      return;
    }
    
    if (isShowingQuestDetail && questSequence.started && currentSlide === 2) {
      if (questSequence.currentQuestIndex === 0) {
        console.log("Going back from first quest to TOC");
        setQuestSequence(prev => ({
          ...prev,
          started: false
        }));
        setIsShowingQuestDetail(false);
        setSelectedQuestIndex(null);
        setCurrentSlide(1);
      } else {
        console.log("Going to previous quest in sequence");
        setQuestSequence(prev => ({
          ...prev,
          currentQuestIndex: prev.currentQuestIndex - 1
        }));
        handleQuestSelect(questSequence.currentQuestIndex - 1);
      }
      return;
    }
    
    if (currentSlide > 0) {
      if (currentSlide === 2 && isShowingQuestDetail && !questSequence.started) {
        console.log("Going back from quest detail to TOC");
        setIsShowingQuestDetail(false);
        setSelectedQuestIndex(null);
        setCurrentSlide(1);
      } else {
        console.log("Going to previous slide");
        setCurrentSlide(currentSlide - 1);
      }
    }
  }, [
    currentSlide, 
    isShowingQuestDetail, 
    isShowingSubtopicContent, 
    questSequence, 
    handleQuestSelect 
  ]);

  // ------------------ handleClose ------------------
  const handleClose = useCallback(() => {
    localStorage.removeItem('courseData');
    navigate('/');
  }, [navigate]);

  // ------------------ useEffect: load courseData ------------------
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('courseData'));
    if (!data) {
      navigate('/');
      return;
    }
    if (!data.id) {
      data.id = Date.now().toString();
    }
    setCourseData(data);
  }, [navigate]);

  // ------------------ useEffect: initializeCourseInDb ------------------
  useEffect(() => {
    const initializeCourseInDb = async () => {
      if (!courseData?.id) return;
      try {
        await DatabaseService.initializeCourse(courseData);
        console.log('Course initialized in database');
      } catch (err) {
        console.error('Error initializing course in database:', err);
      }
    };
    initializeCourseInDb();
  }, [courseData]);

  // ------------------ useEffect: update questSequence total ------------------
  useEffect(() => {
    if (slideContents.toc && slideContents.toc.quests) {
      setQuestSequence(prev => ({
        ...prev,
        totalQuests: slideContents.toc.quests.length
      }));
    }
  }, [slideContents.toc]);
  
  // ------------------ useEffect: initial content loading ------------------
  useEffect(() => {
    const loadInitialContent = async () => {
      if (!courseData) return;
      if (!slideContents.toc) {
        await fetchSlideContent('toc');
      }
      if (slideContents.toc && !slideContents.summary) {
        handleFetchSummaryContent({ forceRefresh: false });
      }
    };
    loadInitialContent();
  }, [courseData, slideContents.toc, fetchSlideContent, handleFetchSummaryContent]);


  // Add this useEffect to monitor mode changes
useEffect(() => {
  console.log("Quest sequence mode changed:", questSequence.mode);
  console.log("Stack trace:", new Error().stack);
}, [questSequence.mode]);

  // ------------------ Render ------------------
  if (!courseData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const CurrentSlideComponent = slides[currentSlide]?.component;
  const currentContentKey = slides[currentSlide]?.contentKey;
  const contentProp = currentContentKey ? slideContents[currentContentKey] : undefined;
  const additionalProps = slides[currentSlide]?.props || {};

  if (!CurrentSlideComponent) {
    return <LoadingSpinner />;
  }

  if (CurrentSlideComponent === DetailedQuestSlide) {
    additionalProps.onSubtopicSelect = stableHandleSubtopicSelect;
    additionalProps.onRefreshContent = handleFetchSubtopicContent;
    additionalProps.onExitAdventure = handleExitAdventure;
    additionalProps.onNextQuest = handleNextQuest;
    additionalProps.questSequence = questSequence;
  }

  if (CurrentSlideComponent === SubtopicContentSlide) {
    additionalProps.onReturnToQuest = stableHandleReturnToQuest;
    additionalProps.questSequence = questSequence;
    additionalProps.onNextInSequence = handleAdvanceAdventure;
    additionalProps.onExitAdventure = handleExitAdventure;
  }

  console.log("Rendering slide:", currentSlide, 
              "Component:", CurrentSlideComponent.name || "Unknown",
              "contentKey:", currentContentKey,
              "hasContent:", !!contentProp,
              "additionalProps:", additionalProps,
              "questSequence:", questSequence);

              return (
                <div className="min-h-screen relative">
                  <button 
                    onClick={handleClose} 
                    className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="Close course"
                  >
                    <X size={24} strokeWidth={2} />
                  </button>
              
                  <CurrentSlideComponent 
                    courseData={courseData}
                    content={contentProp}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                    onQuestSelect={currentSlide === 1 ? handleQuestSelect : undefined}
                    onBeginAdventure={currentSlide === 1 ? handleBeginAdventure : undefined}
                    onRefreshContent={
                      currentContentKey === 'content' 
                        ? (selectedTopicIndex) => handleFetchDetailContent(selectedTopicIndex, true)
                        : currentContentKey === 'questDetail' || (isShowingQuestDetail && currentSlide === 2)
                          ? stableSubtopicRefreshHandler
                          : currentContentKey === 'summary'
                            ? (options) => handleFetchSummaryContent({...options, forceRefresh: true})
                            : currentContentKey 
                              ? (options) => handleRefreshContent(currentContentKey, {...options, forceRefresh: true}) 
                              : undefined
                    }
                    isRefreshing={
                      currentContentKey === 'content'
                        ? isRefreshing.detail || isRefreshing.content
                        : currentContentKey === 'questDetail' || (isShowingQuestDetail && currentSlide === 2)
                          ? isRefreshing.questDetail
                          : currentContentKey 
                            ? isRefreshing[currentContentKey] 
                            : false
                    }
                    isFirst={currentSlide === 0}
                    isLast={currentSlide === slides.length - 1}
                    {...additionalProps}
                  />
              
                  {/* Add the AdventureNavigationBar component here */}
                  <AdventureNavigationBar 
                    questSequence={questSequence}
                    slideContents={slideContents}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                    onExitAdventure={handleExitAdventure}
                  />
                </div>
              );
};

export default Course;
