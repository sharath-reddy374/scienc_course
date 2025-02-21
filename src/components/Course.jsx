// src/components/Course.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TOCSlide from './slides/TOCSlide';
import IntroSlide from './slides/IntroSlide';
import TypesSlide from './slides/TypesSlide';

const Course = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [courseData, setCourseData] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Get course data from localStorage
    const data = JSON.parse(localStorage.getItem('courseData'));
    if (!data) {
      navigate('/'); // Redirect to input form if no data
      return;
    }
    setCourseData(data);
  }, [navigate]);

  const slides = [
    { component: TOCSlide, title: 'Table of Contents' },
    { component: IntroSlide, title: 'Introduction' },
    { component: TypesSlide, title: 'Content' }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  if (!courseData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const CurrentSlideComponent = slides[currentSlide].component;

  return (
    <div className="min-h-screen">
      <CurrentSlideComponent 
        courseData={courseData}
        onNext={handleNext}
        onPrevious={handlePrevious}
        isFirst={currentSlide === 0}
        isLast={currentSlide === slides.length - 1}
      />
    </div>
  );
};

export default Course;