// Course.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import TOCSlide from './slides/TOCSlide';
import IntroSlide from './slides/IntroSlide';
import TypesSlide from './slides/TypesSlide';
import { generateSlideContent } from '../services/openai';

const Course = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [courseData, setCourseData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
    { component: TypesSlide, title: 'Content', contentKey: 'content' }
  ];

  // Map contentKey to the type used in generateSlideContent.
  const getContentType = (contentKey) => {
    switch (contentKey) {
      case 'toc': return 'TOC';
      case 'intro': return 'INTRO';
      case 'content': return 'TYPES';
      default: return '';
    }
  };

  // Centralized function to fetch content for a slide.
  const fetchSlideContent = async (contentKey, options = {}) => {
    const type = getContentType(contentKey);
    try {
      const data = await generateSlideContent(type, courseData, options);
      setSlideContents((prev) => ({ ...prev, [contentKey]: data }));
    } catch (error) {
      console.error(`Error fetching ${contentKey} content:`, error);
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

  // Refresh handler for IntroSlide (e.g. generating a new quiz question).
  const handleRefreshIntroContent = async () => {
    setIsRefreshing(true);
    await fetchSlideContent('intro', { regenerateQuiz: true });
    setIsRefreshing(false);
  };

  // Optionally, preload the first slide’s content if needed.
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
        // For IntroSlide, pass the refresh handler and its loading state.
        onRefreshContent={currentContentKey === 'intro' ? handleRefreshIntroContent : undefined}
        isRefreshing={currentContentKey === 'intro' ? isRefreshing : false}
        isFirst={currentSlide === 0}
        isLast={currentSlide === slides.length - 1}
      />
    </div>
  );
};

export default Course;
