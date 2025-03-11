import React, { useState, useEffect,useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import TOCSlide from './slides/TOCSlide';
import MemoryGameSlide from './slides/MemoryGameSlide';
import DetailedQuestSlide from './slides/DetailedQuestSlide';
import WelcomeSlide from './slides/WelcomeSlide';
import SubtopicContentSlide from './slides/SubtopicContentSlide';
import CourseSummarySlide from './slides/CourseSummarySlide';

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

const Course = () => {
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

  // State to track the sequence of quests
  const [questSequence, setQuestSequence] = useState({
    started: false,
    currentQuestIndex: 0,
    totalQuests: 0
  });
  const [slides, setSlides] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('courseData'));
    if (!data) {
      navigate('/');
      return;
    }
    setCourseData(data);
  }, [navigate]);



  
// Add/modify this useEffect in Course.jsx
useEffect(() => {
  // This will update slides when anything related to subtopic display changes
  if (isShowingQuestDetail || isShowingSubtopicContent || selectedSubtopicIndex !== null) {
    const updatedSlides = getSlides();
    setSlides(updatedSlides);
    console.log("Updated slides for subtopic:", updatedSlides.map(s => s.title));
  }
}, [isShowingQuestDetail, isShowingSubtopicContent, selectedQuestIndex, selectedSubtopicIndex, slideContents.toc]);


  useEffect(() => {
    if (slideContents.toc && slideContents.toc.quests) {
      setQuestSequence(prev => ({
        ...prev,
        totalQuests: slideContents.toc.quests.length
      }));
    }
  }, [slideContents.toc]);

  useEffect(() => {
    if (isShowingSubtopicContent && selectedSubtopicIndex !== null) {
      console.log("Subtopic content state changed, updating slides");
      const updatedSlides = getSlides();
      setSlides(updatedSlides);
      console.log("Updated slides for subtopic:", updatedSlides.map(s => s.title));
    }
  }, [isShowingSubtopicContent, selectedSubtopicIndex]);


  useEffect(() => {
    if (isShowingSubtopicContent && selectedSubtopicIndex !== null) {
      refreshSlides();
    }
  }, [questSubtopics, slideContents.toc]);

  const refreshSlides = () => {
    console.log("Refreshing slides to reflect content updates");
    const updatedSlides = getSlides();
    setSlides(updatedSlides);
  };


  const stableSubtopicRefreshHandler = useCallback((options) => {
    // Create a unique ID for this request
    const { questIndex, subtopicIndex, sectionType, forceRefresh } = options;
    const requestId = `${questIndex}-${subtopicIndex}-${sectionType}`;
    
    // If we have a pending request and we're not forcing a refresh, return it
    if (pendingRequests[requestId] && !forceRefresh) {
      console.log(`Request ${requestId} already in progress, returning cached promise`);
      return pendingRequests[requestId];
    }
    
    console.log(`Starting request for ${requestId}`);
    
    // Create the promise for this request
    const requestPromise = handleFetchSubtopicContent(options)
      .finally(() => {
        // Always clean up
        delete pendingRequests[requestId];
      });
    
    // Store it for deduplication
    pendingRequests[requestId] = requestPromise;
    
    return requestPromise;
  }, [/* dependencies that shouldn't change often */]);


  const getSlides = () => {
    console.log(
      "getSlides called:",
      "isShowingQuestDetail =", isShowingQuestDetail, 
      "selectedQuestIndex =", selectedQuestIndex,
      "isShowingSubtopicContent =", isShowingSubtopicContent,
      "selectedSubtopicIndex =", selectedSubtopicIndex
    );
        
   
    const baseSlides = [
      { component: WelcomeSlide, title: 'Welcome', contentKey: 'welcome' },
      { component: TOCSlide, title: 'Table of Contents', contentKey: 'toc' },
      { component: MemoryGameSlide, title: 'Memory Matching Game', contentKey: 'memory' },
      { component: CourseSummarySlide, title: 'Course Summary', contentKey: 'summary' }
    ];
      
       // In getSlides function - add these lines at the beginning to debug content sources
    if (isShowingSubtopicContent && selectedQuestIndex !== null && selectedSubtopicIndex !== null) {
      // Check all possible sources of subtopic content
      const subtopicKey = `${selectedQuestIndex}-${selectedSubtopicIndex}`;
      console.log("Content in questSubtopics:", questSubtopics[subtopicKey]);
      console.log("Content in TOC:", slideContents.toc?.quests?.[selectedQuestIndex]?.subtopics?.[selectedSubtopicIndex]?.content);
    }

    
    // If we're showing quest detail, insert it after TOC slide (which is at index 1)
    if (isShowingQuestDetail && selectedQuestIndex !== null) {
      console.log("Adding DetailedQuestSlide after TOC, quest index =", selectedQuestIndex);
        
      // If we're showing subtopic content, add that slide after DetailedQuestSlide
      if (isShowingSubtopicContent && selectedSubtopicIndex !== null) {
        console.log("Adding SubtopicContentSlide after DetailedQuestSlide");
        
        // IMPORTANT: Get the content from multiple possible sources
        // This is a key change - combining sources to ensure we get the content
        const subtopicKey = `${selectedQuestIndex}-${selectedSubtopicIndex}`;
        const fromQuestSubtopics = questSubtopics[subtopicKey] || {};
        const fromTocContent = slideContents.toc?.quests?.[selectedQuestIndex]?.subtopics?.[selectedSubtopicIndex]?.content || {};
        
        // Merge the content sources with a preference for questSubtopics (more likely to be up-to-date)
        const subtopicContent = {
          ...fromTocContent,
          ...fromQuestSubtopics
        };
        
        console.log("Final merged subtopicContent for slide:", subtopicContent);
        
        const newSlides = [
          baseSlides[0], // WelcomeSlide
          baseSlides[1], // TOCSlide
          { 
            component: DetailedQuestSlide, 
            title: `Quest ${selectedQuestIndex + 1} Detail`, 
            contentKey: 'toc', // Using TOC content for DetailedQuestSlide
            props: { selectedQuestIndex } 
          },
          {
            component: SubtopicContentSlide,
            title: `Quest ${selectedQuestIndex + 1} - Topic ${selectedSubtopicIndex + 1}`,
            contentKey: 'toc', // Using TOC content for SubtopicContentSlide
            props: { 
              questIndex: selectedQuestIndex,
              subtopicIndex: selectedSubtopicIndex,
              subtopicContent: subtopicContent, // Use the merged content
              onRefreshContent: handleFetchSubtopicContent
            }
          },
          ...baseSlides.slice(2) // All slides after TOC
        ];
        
        return newSlides;
      }
        
      // Just show the DetailedQuestSlide without the subtopic content
      const newSlides = [
        baseSlides[0], // WelcomeSlide
        baseSlides[1], // TOCSlide
        { 
          component: DetailedQuestSlide, 
          title: `Quest ${selectedQuestIndex + 1} Detail`, 
          contentKey: 'toc', // Using TOC content for DetailedQuestSlide
          props: { selectedQuestIndex } 
        },
        ...baseSlides.slice(2) // All slides after TOC
      ];
        
      return newSlides;
    }
      
    return baseSlides;
  };
  
  // Helper function to get subtopic content from the TOC content
  const getSubtopicContent = (questIndex, subtopicIndex) => {
    if (!slideContents.toc || 
        !slideContents.toc.quests || 
        !slideContents.toc.quests[questIndex] ||
        !slideContents.toc.quests[questIndex].subtopics ||
        !slideContents.toc.quests[questIndex].subtopics[subtopicIndex]) {
      return null;
    }
    
    return slideContents.toc.quests[questIndex].subtopics[subtopicIndex].content;
  };

  // Update slides state whenever relevant state changes
  useEffect(() => {
    const updatedSlides = getSlides();
    setSlides(updatedSlides);
    console.log("Updated slides:", updatedSlides.map(s => s.title));
  }, [isShowingQuestDetail, selectedQuestIndex]);

  // Effect: Handle navigation to quest detail after state updates
  useEffect(() => {
    // Only run this effect when isShowingQuestDetail changes to true
    if (isShowingQuestDetail && selectedQuestIndex !== null) {
      console.log("EFFECT: Navigating to quest detail, quest index =", selectedQuestIndex);
      
      // Navigate to the correct slide index (DetailedQuestSlide is now at index 2)
      setCurrentSlide(2);
    }
  }, [isShowingQuestDetail, selectedQuestIndex]);

  // Map contentKey to the type used in generateSlideContent.
  const getContentType = (contentKey) => {
    switch (contentKey) {
      case 'welcome': return 'WELCOME';
      case 'toc': return 'TOC';
      case 'content': return 'TYPES';
      case 'detail': return 'DETAIL';
      case 'memory': return 'MEMORY';
      default: return '';
    }
  };

  
  const fetchSlideContent = async (contentKey, options = {}, forceRefresh = false) => {
    // Skip if already fetching this content
    if (pendingRequests[contentKey]) {
      console.log(`Request for ${contentKey} already in progress, skipping duplicate`);
      return;
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
      
     if (contentKey === 'welcome') {
        const data = await fetchWelcomeContent(courseData);
        setSlideContents((prev) => ({ ...prev, [contentKey]: data }));
      }

      // In fetchSlideContent function
      else if (contentKey === 'memory') {
        const data = await fetchMemoryContent(courseData);
        setSlideContents((prev) => ({ ...prev, [contentKey]: data }));
      }

      else {
        console.log(`Generating content for ${contentKey} using type ${type}`);
        const data = await generateSlideContent(type, courseData, options);
        console.log(`Received data for ${contentKey}:`, data);
        setSlideContents((prev) => ({ ...prev, [contentKey]: data }));
      }
    } catch (error) {
      console.error(`Error fetching ${contentKey} content:`, error);
    } 
    
    finally {
      // Clear the pending request flag when done
      delete pendingRequests[contentKey];
      setIsRefreshing(prev => ({ ...prev, [contentKey]: false }));
    }
  };



  const preloadRemainingSubtopicSections = (questIndex, subtopicIndex, existingContent) => {
    // List of all section types
    const allSectionTypes = ['keyPoints', 'examples', 'exercises', 'matchingExercises'];
    
    // Filter out sections that already exist
    const sectionsToFetch = allSectionTypes.filter(
      type => !existingContent[type] || 
      (Array.isArray(existingContent[type]) && existingContent[type].length === 0)
    );
    
    console.log(`Preloading remaining sections for subtopic ${questIndex}-${subtopicIndex}:`, sectionsToFetch);
    
    // Load each section with a small delay between them
    sectionsToFetch.forEach((sectionType, index) => {
      setTimeout(() => {
        console.log(`Background loading ${sectionType}`);
        handleFetchSubtopicContent({
          questIndex,
          subtopicIndex,
          sectionType,
          forceRefresh: false,
          preloadAll: false  // Prevent cascading preloads
        }).catch(err => console.error(`Error preloading ${sectionType}:`, err));
      }, index * 1000);  // Start each fetch 1 second after the previous one
    });
  };

  // Handle fetching detail content for TypesSlide
  const handleFetchDetailContent = async (selectedTopicIndex, forceRefresh = false) => {
    try {
      // Make sure we have the basic content first
      if (!slideContents.content) {
        return;
      }

      setIsRefreshing(prev => ({ ...prev, detail: true }));
      
      // Check if we already have details for this topic and not forcing refresh
      if (!forceRefresh && 
          slideContents.content.details && 
          slideContents.content.details[selectedTopicIndex]) {
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
  };

  const handleSubtopicSelect = (subtopicIndex) => {
    console.log("handleSubtopicSelect called with index:", subtopicIndex);
    setSelectedSubtopicIndex(subtopicIndex);
    setIsShowingSubtopicContent(true);
    
    // Update the slide to the subtopic content slide
    setCurrentSlide(3);
    
    // Request content with preloadAll flag
    handleFetchSubtopicContent({
      questIndex: selectedQuestIndex,
      subtopicIndex: subtopicIndex,
      sectionType: 'overview',
      forceRefresh: false,
      preloadAll: true  // Request preloading of all other sections
    });
  };
  
  // Function to handle returning from subtopic to quest
  const handleReturnToQuest = () => {
    setIsShowingSubtopicContent(false);
    setSelectedSubtopicIndex(null);
    
    // Go back to the DetailedQuestSlide (index 2 in modified slide array)
    setCurrentSlide(2);
  };



  // Begin Adventure function to start the quest sequence
  const handleBeginAdventure = async () => {
    console.log("Beginning adventure...");
    
    // Make sure we have TOC content with quests
    if (!slideContents.toc || !slideContents.toc.quests || slideContents.toc.quests.length === 0) {
      console.error("Cannot begin adventure: TOC content or quests not available");
      return;
    }
    
    // Start the sequence with Quest 1
    setQuestSequence({
      started: true,
      currentQuestIndex: 0,
      totalQuests: slideContents.toc.quests.length
    });
    
    // Navigate to Quest 1
    await handleQuestSelect(0);
  };
  
  // handleQuestSelect function to directly set state
  const handleQuestSelect = async (questIndex) => {
    console.log("handleQuestSelect called with index:", questIndex);
    
    // Set states
    setSelectedQuestIndex(questIndex);
    setIsShowingQuestDetail(true);
    
    console.log("Quest selection state updated");
  };

  // Function to handle continuing to next quest in sequence
  const handleNextQuest = async () => {
    if (!questSequence.started) return;
    
    const nextQuestIndex = questSequence.currentQuestIndex + 1;
    
    // Check if we've reached the end of the quest sequence
    if (nextQuestIndex >= questSequence.totalQuests) {
      console.log("Quests complete");
      // End quest sequence
      setQuestSequence(prev => ({
        ...prev,
        started: false
      }));
      setIsShowingQuestDetail(false);
      setSelectedQuestIndex(null);
      
      // Navigate to the next slide after quests
      setCurrentSlide(1);
      
      return;
    }
    
    // Update the current quest in the sequence
    setQuestSequence(prev => ({
      ...prev,
      currentQuestIndex: nextQuestIndex
    }));
    
    // Navigate to the next quest
    await handleQuestSelect(nextQuestIndex);
  };

  // Enhanced handler for fetching subtopic content with more logging
  // Define pendingRequests at the module level (outside the component)
const pendingRequests = {};

const handleFetchSubtopicContent = async ({ questIndex, subtopicIndex, sectionType = 'overview', forceRefresh = false, preloadAll = false }) => {
  // Create a unique request ID to track and prevent duplicate requests
  const requestId = `${questIndex}-${subtopicIndex}-${sectionType}`;
  
  // If we're already processing this request, return a resolved promise
  if (pendingRequests[requestId] && !forceRefresh) {
    console.log(`Request for ${requestId} already in progress, skipping duplicate`);
    return pendingRequests[requestId]; // Return the existing promise
  }
  
  // Create the promise for this request
  const requestPromise = (async () => {
    try {
      // Only show loading indicator if we're loading the current visible section
      if (sectionType === 'overview' || selectedSubtopicIndex === subtopicIndex) {
        setIsRefreshing(prev => ({ ...prev, questDetail: true }));
      }
      
      // Get the key for this subtopic in our state
      const subtopicKey = `${questIndex}-${subtopicIndex}`;
      
      // Get existing content from questSubtopics
      const existingContent = questSubtopics[subtopicKey] || {};
      console.log(`Existing content for ${subtopicKey} in questSubtopics:`, existingContent);
      
      // Check if we already have this section's content cached and not forcing refresh
      if (!forceRefresh && 
          existingContent[sectionType] && 
          (typeof existingContent[sectionType] === 'string' || 
          (Array.isArray(existingContent[sectionType]) && existingContent[sectionType].length > 0))) {
        console.log(`Using cached subtopic content for section: ${sectionType}`);
        
        // If preloadAll is requested, trigger loading of other sections in the background
        if (preloadAll) {
          preloadRemainingSubtopicSections(questIndex, subtopicIndex, existingContent);
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
      // Use callback form to avoid stale state references
      setSlideContents(prev => {
        // Create a deep copy to ensure React detects the change
        const updatedToc = JSON.parse(JSON.stringify(prev.toc));
        
        // Check if the quest and subtopic exist
        if (updatedToc.quests?.[questIndex]?.subtopics?.[subtopicIndex]) {
          // Make sure the content property exists
          updatedToc.quests[questIndex].subtopics[subtopicIndex].content = updatedToc.quests[questIndex].subtopics[subtopicIndex].content || {};
          
          // Update only the relevant section
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
      
      // Force a refresh of the slides to ensure the new content is used
      refreshSlides();
      
      // If preloadAll is true and we've just loaded overview, preload the rest of the sections
      if (preloadAll && sectionType === 'overview') {
        preloadRemainingSubtopicSections(questIndex, subtopicIndex, updatedSubtopicContent);
      } else {
        // Otherwise, follow the normal sequential preloading pattern
        // Preload next section if this is the overview
        if (sectionType === 'overview') {
          setTimeout(() => {
            if (!updatedSubtopicContent.keyPoints) {
              console.log("Preloading keyPoints in background...");
              // This will be processed asynchronously, no need to await
              handleFetchSubtopicContent({
                questIndex,
                subtopicIndex,
                sectionType: 'keyPoints',
                forceRefresh: false
              });
            }
          }, 2000);
        }
        // Similarly preload examples if this is keyPoints
        else if (sectionType === 'keyPoints') {
          setTimeout(() => {
            if (!updatedSubtopicContent.examples) {
              console.log("Preloading examples in background...");
              handleFetchSubtopicContent({
                questIndex,
                subtopicIndex,
                sectionType: 'examples',
                forceRefresh: false
              });
            }
          }, 2000);
        }
        // And preload exercises if this is examples
        else if (sectionType === 'examples') {
          setTimeout(() => {
            if (!updatedSubtopicContent.exercises) {
              console.log("Preloading exercises in background...");
              handleFetchSubtopicContent({
                questIndex,
                subtopicIndex,
                sectionType: 'exercises',
                forceRefresh: false
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
      // Always clean up
      if (sectionType === 'overview' || selectedSubtopicIndex === subtopicIndex) {
        setIsRefreshing(prev => ({ ...prev, questDetail: false }));
      }
    }
  })();
  
  // Store the promise for deduplication
  pendingRequests[requestId] = requestPromise;
  
  // Clean up when done
  requestPromise.finally(() => {
    delete pendingRequests[requestId];
  });
  
  return requestPromise;
};



  // handleNext to work with quest sequence and new slide indexing
  const handleNext = async () => {
    // If we're in subtopic content view
    if (isShowingQuestDetail && isShowingSubtopicContent && currentSlide === 3) {
      // Logic to either go to the next subtopic or back to quest detail
      const quest = slideContents.toc.quests[selectedQuestIndex];
      if (quest && quest.objectives && selectedSubtopicIndex < quest.objectives.length - 1) {
        // Go to next subtopic
        handleSubtopicSelect(selectedSubtopicIndex + 1);
      } else {
        // No more subtopics, go back to quest detail
        handleReturnToQuest();
      }
      return;
    }
    
    // If we're in quest detail view and quest sequence is active
    if (isShowingQuestDetail && questSequence.started && currentSlide === 2) {
      console.log("Moving to next quest in sequence");
      await handleNextQuest();
      return;
    }
    
    // Normal slide navigation
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
  };





  const handleFetchSummaryContent = async (options = {}) => {
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
  };
  


  // handlePrevious to work with quest sequence and new slide indexing
  const handlePrevious = () => {
    // If we're in subtopic content view
    if (isShowingQuestDetail && isShowingSubtopicContent && currentSlide === 3) {
      // Go back to quest detail
      handleReturnToQuest();
      return;
    }
    
    // If we're in quest detail view and quest sequence is active
    if (isShowingQuestDetail && questSequence.started && currentSlide === 2) {
      // If we're at the first quest, go back to TOC
      if (questSequence.currentQuestIndex === 0) {
        console.log("Going back from first quest to TOC");
        setQuestSequence(prev => ({
          ...prev,
          started: false
        }));
        setIsShowingQuestDetail(false);
        setSelectedQuestIndex(null);
        setCurrentSlide(1); // Go back to TOC at index 1
      } else {
        // Otherwise go to previous quest in sequence
        console.log("Going to previous quest in sequence");
        setQuestSequence(prev => ({
          ...prev,
          currentQuestIndex: prev.currentQuestIndex - 1
        }));
        handleQuestSelect(questSequence.currentQuestIndex - 1);
      }
      return;
    }
    
    // Normal slide navigation
    if (currentSlide > 0) {
      // If we're in the quest detail slide and going back (not in sequence mode)
      if (currentSlide === 2 && isShowingQuestDetail && !questSequence.started) {
        console.log("Going back from quest detail to TOC");
        setIsShowingQuestDetail(false);
        setSelectedQuestIndex(null);
        setCurrentSlide(1); // Go back to TOC at index 1
      } else {
        console.log("Going to previous slide");
        setCurrentSlide(currentSlide - 1);
      }
    }
  };
  

  const handleClose = () => {
    localStorage.removeItem('courseData');
    navigate('/');
  };


  const handleRefreshContent = async (contentKey, options = {}) => {
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
        const fallbackContent = getMemoryFallbackContent ? getMemoryFallbackContent(courseData) : null;
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
  };

  // Replace your current useEffect for initial content loading
  useEffect(() => {
    const loadInitialContent = async () => {
      if (!courseData) return;
      
      // Load TOC content first
      if (!slideContents.toc) {
        await fetchSlideContent('toc');
      }
      
      // Then preload summary content if we have TOC
      if (slideContents.toc && !slideContents.summary) {
        handleFetchSummaryContent({ forceRefresh: false });
      }
    };
    
    loadInitialContent();
  }, [courseData, slideContents.toc]);

  if (!courseData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // Show global loading only for slide transitions.
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Get the current slide from the slides state
  const CurrentSlideComponent = slides[currentSlide]?.component;
  const currentContentKey = slides[currentSlide]?.contentKey;
  const contentProp = currentContentKey ? slideContents[currentContentKey] : undefined;
  const additionalProps = slides[currentSlide]?.props || {};

  // Handle case where slides array isn't updated yet
  if (!CurrentSlideComponent) {
    return <LoadingSpinner />;
  }

  // Pass handlers for subtopic selection
if (CurrentSlideComponent === DetailedQuestSlide) {
  additionalProps.onSubtopicSelect = handleSubtopicSelect;
  additionalProps.onRefreshContent = handleFetchSubtopicContent;
}

// Pass handler for returning to quest
if (CurrentSlideComponent === SubtopicContentSlide) {
  additionalProps.onReturnToQuest = handleReturnToQuest;
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
        // Pass both quest handlers to TOC slide (index 1)
        onQuestSelect={currentSlide === 1 ? handleQuestSelect : undefined}
        onBeginAdventure={currentSlide === 1 ? handleBeginAdventure : undefined}
        // Pass quest sequence info if we're in a quest detail slide
        questSequence={isShowingQuestDetail ? questSequence : undefined}

        // Dynamic refresh content handler based on slide type
        onRefreshContent={
          currentContentKey === 'content' 
            ? (selectedTopicIndex) => handleFetchDetailContent(selectedTopicIndex, true)
            : currentContentKey === 'questDetail' || (isShowingQuestDetail && currentSlide === 2)
              ? stableSubtopicRefreshHandler // Use the stable callback here
              : currentContentKey === 'summary'
              ? (options) => handleFetchSummaryContent({...options, forceRefresh: true})
              : currentContentKey 
                ? (options) => handleRefreshContent(currentContentKey, {...options, forceRefresh: true}) 
                : undefined
        }
        // Dynamic refreshing state
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
        // Spread any additional props
        {...additionalProps}
      />
    </div>
  );
};

export default Course;