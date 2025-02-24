// src/components/slides/TypesSlide.jsx
import React, { useState, useEffect } from 'react';
import SlideWrapper from '../common/SlideWrapper';
import DetailSlide from './DetailSlide';

const TypesSlide = ({ courseData, content, onNext, onPrevious, onRefreshContent, isRefreshing }) => {
  const [selectedTopic, setSelectedTopic] = useState(null);
  
  // Debug logging
  useEffect(() => {
    console.log('TypesSlide received content:', content);
    console.log('TypesSlide isRefreshing:', isRefreshing);
  }, [content, isRefreshing]);
  
  useEffect(() => {
    console.log('TypesSlide selectedTopic changed to:', selectedTopic);
  }, [selectedTopic]);

  // If content isn't available, don't render the slide
  if (!content) {
    console.log('TypesSlide: No content available');
    return (
      <SlideWrapper className="bg-gradient-to-br from-blue-50 to-blue-100 relative">
        <div className="flex flex-col items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-blue-600">Loading content...</p>
        </div>
      </SlideWrapper>
    );
  }

  // When a topic is selected, fetch the details if needed
  const handleTopicSelect = (index) => {
    console.log('TypesSlide: Topic selected:', index);
    setSelectedTopic(index);
    
    // If we have a refresh handler and we're selecting a topic, fetch its details
    if (onRefreshContent) {
      console.log('TypesSlide: Calling onRefreshContent for topic:', index);
      onRefreshContent(index);
    } else {
      console.warn('TypesSlide: onRefreshContent function not provided');
    }
  };

  const handleBackFromDetail = () => {
    console.log('TypesSlide: Back from detail');
    setSelectedTopic(null);
  };

  // If a topic is selected and we have detail content, show the DetailSlide
  if (selectedTopic !== null && content.concepts) {
    const detailContent = content.details && content.details[selectedTopic];
    console.log('TypesSlide: Showing DetailSlide with content:', detailContent);
    
    return (
      <DetailSlide 
        topic={content.concepts[selectedTopic]} 
        content={detailContent}
        onBack={handleBackFromDetail} 
        courseData={courseData}
        isRefreshing={isRefreshing}
        onRefreshContent={() => {
          console.log('DetailSlide requested refresh for topic:', selectedTopic);
          if (onRefreshContent) {
            onRefreshContent(selectedTopic);
          }
        }}
      />
    );
  }

  // Main Grid View
  return (
    <SlideWrapper className="bg-gradient-to-br from-blue-50 to-blue-100 relative">
      {/* Overlay spinner for refreshing */}
      {isRefreshing && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      )}
      <div className="w-full h-full p-4 sm:p-8 overflow-auto">
        <header className="text-center mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-blue-800 mb-2">
            {courseData.topic} - Core Concepts
          </h1>
          <p className="text-sm sm:text-base text-blue-600">Click on any concept to explore more</p>
          <button
            onClick={() => {
              console.log('TypesSlide: Requesting content refresh');
              if (onRefreshContent) {
                onRefreshContent();
              }
            }}
            className="mt-2 text-blue-600 hover:text-blue-800 flex items-center mx-auto text-sm"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Concepts
          </button>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {content?.concepts?.map((concept, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer
                       transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
              onClick={() => handleTopicSelect(index)}
            >
              <div className="p-4 sm:p-8 h-full flex flex-col items-center justify-center text-center">
                <div className="text-4xl sm:text-5xl mb-3 sm:mb-4 transform transition-transform duration-300">
                  {concept.icon}
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-blue-800 mb-2 sm:mb-3">
                  {concept.title}
                </h2>
                <p className="text-blue-600 text-xs sm:text-sm">
                  Click to discover more
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 sm:mt-8 flex justify-between">
          <button
            onClick={onPrevious}
            className="bg-white text-blue-600 px-4 sm:px-6 py-2 rounded-full shadow-md
                     hover:bg-blue-50 transition-all duration-300 hover:scale-105 text-sm sm:text-base"
          >
            ← Previous
          </button>
          <button
            onClick={onNext}
            className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-full shadow-md
                     hover:bg-blue-700 transition-all duration-300 hover:scale-105 text-sm sm:text-base"
          >
            Next →
          </button>
        </div>
      </div>
    </SlideWrapper>
  );
};

export default TypesSlide;