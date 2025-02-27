// Course.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import TOCSlide from './slides/TOCSlide';
import IntroSlide from './slides/IntroSlide';
import TypesSlide from './slides/TypesSlide';
import MatchingSlide from './slides/MatchingSlide';
import EquationBuilder from './slides/EquationBuilder';
import AnimatedEquationSlide from './slides/AnimatedEquationSlide';
import ProbabilitySimulatorSlide from './slides/ProbabilitySimulatorSlide';
import { 
  generateSlideContent, 
  fetchDetailContent, 
  fetchAnimatedEquation,
  fetchProbabilitySimulatorContent
} from '../services/openai';

const Course = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [courseData, setCourseData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState({
    intro: false,
    content: false,
    matching: false,
    equation: false,
    animatedEquation: false,
    toc: false,
    detail: false,
    probabilitySimulator: false
  });
  const [slideContents, setSlideContents] = useState({});
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

  // Define slides with a unique contentKey if they require async content.
  const slides = [
    { component: TOCSlide, title: 'Table of Contents', contentKey: 'toc' },
    { component: IntroSlide, title: 'Introduction', contentKey: 'intro' },
    { component: TypesSlide, title: 'Content', contentKey: 'content' },
    // { component: ProbabilitySimulatorSlide, title: 'Probability Simulator', contentKey: 'probabilitySimulator' },
    { component: MatchingSlide, title: 'Matching Exercise', contentKey: 'matching' },
    { component: EquationBuilder, title: 'Equation Builder', contentKey: 'equation' },
    { component: AnimatedEquationSlide, title: 'Animated Equations', contentKey: 'animatedEquation' }
  ];

  // Map contentKey to the type used in generateSlideContent.
  const getContentType = (contentKey) => {
    switch (contentKey) {
      case 'toc': return 'TOC';
      case 'intro': return 'INTRO';
      case 'content': return 'TYPES';
      case 'matching': return 'MATCHING';
      case 'equation': return 'EQUATION';
      case 'animatedEquation': return 'ANIMATED_EQUATION';
      case 'detail': return 'DETAIL';
      case 'probabilitySimulator': return 'PROBABILITY_SIMULATOR';
      default: return '';
    }
  };

  // Centralized function to fetch content for a slide.
  const fetchSlideContent = async (contentKey, options = {}) => {
    const type = getContentType(contentKey);
    try {
      setIsRefreshing(prev => ({ ...prev, [contentKey]: true }));
      
      // Special case for animated equation slide
      if (contentKey === 'animatedEquation') {
        const transformationType = options.transformationType || 'solve a linear equation';
        const data = await fetchAnimatedEquation(transformationType);
        setSlideContents((prev) => ({ ...prev, [contentKey]: data }));
      }
      // Special case for probability simulator slide
      else if (contentKey === 'probabilitySimulator') {
        const data = await fetchProbabilitySimulatorContent(courseData);
        setSlideContents((prev) => ({ ...prev, [contentKey]: data }));
      }  
      else {
        const data = await generateSlideContent(type, courseData, options);
        setSlideContents((prev) => ({ ...prev, [contentKey]: data }));
      }
    } catch (error) {
      console.error(`Error fetching ${contentKey} content:`, error);
    } finally {
      setIsRefreshing(prev => ({ ...prev, [contentKey]: false }));
    }
  };

  // Handle fetching detail content for TypesSlide
  const handleFetchDetailContent = async (selectedTopicIndex) => {
    try {
      // Make sure we have the basic content first
      if (!slideContents.content) {
        return;
      }

      setIsRefreshing(prev => ({ ...prev, detail: true }));
      
      // Check if we already have details for this topic
      if (slideContents.content.details && 
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

  // Handle fetching custom transformation for AnimatedEquationSlide
  const handleFetchCustomTransformation = async (transformationType) => {
    try {
      console.log("Fetching custom transformation:", transformationType);
      
      setIsRefreshing(prev => ({ ...prev, animatedEquation: true }));
      
      const data = await fetchAnimatedEquation(transformationType);
      console.log("Received transformation data:", data);
      
      // If we already have slide contents for animated equations
      if (slideContents.animatedEquation) {
        let currentExamples;
        
        // Check if it's already an array
        if (Array.isArray(slideContents.animatedEquation)) {
          currentExamples = [...slideContents.animatedEquation];
        } else {
          // Convert single object to array
          currentExamples = [slideContents.animatedEquation];
        }
        
        // Important: Make sure we're adding a new object, not modifying existing state
        setSlideContents(prev => ({
          ...prev,
          animatedEquation: [...currentExamples, data]
        }));
        
        console.log("Updated examples array:", [...currentExamples, data]);
      } else {
        // First transformation, set as array with one item
        setSlideContents(prev => ({
          ...prev,
          animatedEquation: [data]
        }));
        console.log("First example set:", [data]);
      }
    } catch (error) {
      console.error('Error fetching custom transformation:', error);
      alert('Error generating equation transformation. Please try again with a different input.');
    } finally {
      setIsRefreshing(prev => ({ ...prev, animatedEquation: false }));
    }
  };
  
  // Slide transition: fetch content for upcoming slide if needed.
  const handleNext = async () => {
    if (currentSlide < slides.length - 1) {
      const nextSlide = slides[currentSlide + 1];
      if (nextSlide.contentKey && !slideContents[nextSlide.contentKey]) {
        setIsLoading(true);
        await fetchSlideContent(nextSlide.contentKey);
        setCurrentSlide(currentSlide + 1);
        setIsLoading(false);
      } else {
        setCurrentSlide(currentSlide + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleClose = () => {
    localStorage.removeItem('courseData');
    navigate('/');
  };

  const handleRefreshContent = async (contentKey, options = {}) => {
    console.log(`Refreshing content for ${contentKey} with options:`, options);
    
    // For animated equation slide, handle custom transformations
    if (contentKey === 'animatedEquation' && options.customTransformation) {
      try {
        setIsRefreshing(prev => ({ ...prev, animatedEquation: true }));
        
        // Call fetchAnimatedEquation with the custom transformation
        const data = await fetchAnimatedEquation(options.customTransformation);
        console.log("Equation data received:", data);
        
        // Update the state
        setSlideContents(prev => {
          // Check if we already have content
          if (prev.animatedEquation) {
            // If it's already an array, add to it
            if (Array.isArray(prev.animatedEquation)) {
              return {
                ...prev,
                animatedEquation: [...prev.animatedEquation, data]
              };
            } else {
              // Convert single object to array with the new data
              return {
                ...prev,
                animatedEquation: [prev.animatedEquation, data]
              };
            }
          } else {
            // First time - initialize as an array with one item
            return {
              ...prev,
              animatedEquation: [data]
            };
          }
        });
      } catch (error) {
        console.error("Error fetching animated equation:", error);
        alert('There was an error generating the equation. Please try again with a different input.');
      } finally {
        setIsRefreshing(prev => ({ ...prev, animatedEquation: false }));
      }
    } else {
      // Handle other slide types
      await fetchSlideContent(contentKey, options);
    }
  };

  // Optionally, preload the first slide's content if needed.
  useEffect(() => {
    if (courseData && slides[0].contentKey && !slideContents[slides[0].contentKey]) {
      setIsLoading(true);
      fetchSlideContent(slides[0].contentKey).then(() => setIsLoading(false));
    }
  }, [courseData]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const CurrentSlideComponent = slides[currentSlide].component;
  const currentContentKey = slides[currentSlide].contentKey;
  const contentProp = currentContentKey ? slideContents[currentContentKey] : undefined;

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
        // Pass refresh handler and loading state to all slides
        onRefreshContent={
          currentContentKey === 'content' 
            ? (selectedTopicIndex) => handleFetchDetailContent(selectedTopicIndex)
            : currentContentKey === 'animatedEquation'
              ? (options) => handleRefreshContent(currentContentKey, options)
              : currentContentKey 
                ? (options) => handleRefreshContent(currentContentKey, options) 
                : undefined
        }
        isRefreshing={
          currentContentKey === 'content'
            ? isRefreshing.detail || isRefreshing.content
            : currentContentKey 
              ? isRefreshing[currentContentKey] 
              : false
        }
        isFirst={currentSlide === 0}
        isLast={currentSlide === slides.length - 1}
      />
    </div>
  );
};

export default Course;