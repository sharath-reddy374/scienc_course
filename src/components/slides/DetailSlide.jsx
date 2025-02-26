// src/components/slides/DetailSlide.jsx
import React, { useState, useEffect } from 'react';
import SlideWrapper from '../common/SlideWrapper';

const DetailSlide = ({ topic, content, onBack, courseData, isRefreshing, onRefreshContent }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [answers, setAnswers] = useState({});
  const [showFeedback, setShowFeedback] = useState({});

  // Debug logging
  useEffect(() => {
    console.log('DetailSlide received topic:', topic);
    console.log('DetailSlide received content:', content);
    console.log('DetailSlide isRefreshing:', isRefreshing);
  }, [topic, content, isRefreshing]);

  const handleRefreshContent = () => {
    // Trigger centralized refresh
    if (onRefreshContent) {
      console.log('DetailSlide: Triggering content refresh');
      onRefreshContent();
      // Reset states
      setActiveTab('overview');
      setAnswers({});
      setShowFeedback({});
    } else {
      console.warn('DetailSlide: onRefreshContent function not provided');
    }
  };

  const handleAnswerSelect = (exerciseIndex, optionIndex) => {
    if (!showFeedback[exerciseIndex]) {
      setAnswers(prev => ({
        ...prev,
        [exerciseIndex]: optionIndex
      }));
      setShowFeedback(prev => ({
        ...prev,
        [exerciseIndex]: true
      }));
    }
  };

  const resetExercise = (exerciseIndex) => {
    setAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[exerciseIndex];
      return newAnswers;
    });
    setShowFeedback(prev => {
      const newFeedback = { ...prev };
      delete newFeedback[exerciseIndex];
      return newFeedback;
    });
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📚' },
    { id: 'examples', label: 'Examples', icon: '✏️' },
    { id: 'practice', label: 'Practice', icon: '🎯' }
  ];

  return (
    <SlideWrapper className="bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="w-full h-full p-4 sm:p-8 overflow-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors mb-2 sm:mb-0"
          >
            <span>←</span>
            <span>Back to Topics</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">
            {topic?.icon} {topic?.title}
          </h1>
        </div>

        {/* Tab Navigation - Scrollable on mobile */}
        <div className="flex overflow-x-auto pb-2 sm:pb-0 sm:space-x-4 mb-4 sm:mb-8 no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg flex items-center space-x-1 sm:space-x-2 transition-all duration-300 whitespace-nowrap mr-2 sm:mr-0 flex-shrink-0
                ${activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-white text-blue-600 hover:bg-blue-50'}`}
            >
              <span>{tab.icon}</span>
              <span className="text-sm sm:text-base">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-8 h-[calc(100%-8rem)] sm:h-[calc(100%-12rem)] overflow-auto">
          {isRefreshing ? (
            <div className="flex flex-col items-center justify-center h-full">
              <svg className="w-12 h-12 text-blue-600 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <p className="text-blue-600 mt-4">Loading content...</p>
            </div>
          ) : !content ? (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-blue-600">Waiting for content to load...</p>
              <button
                onClick={handleRefreshContent}
                className="mt-4 text-blue-600 hover:text-blue-800 flex items-center text-sm bg-blue-50 px-4 py-2 rounded-lg"
              >
                <svg className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Loading Content
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-blue-800 mb-3 sm:mb-4">Overview</h2>
                  <p className="text-base sm:text-lg text-blue-700 mb-4 sm:mb-8">{content.overview}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {content.keyPoints?.map((point, index) => (
                      <div key={index} className="bg-blue-50 p-4 sm:p-6 rounded-xl hover:shadow-lg transition-shadow">
                        <h3 className="font-semibold text-blue-800 mb-2">{point.title}</h3>
                        <p className="text-blue-600 text-sm sm:text-base">{point.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'examples' && (
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-blue-800 mb-3 sm:mb-4">Examples</h2>
                  <div className="space-y-4 sm:space-y-6">
                    {content.examples?.map((example, index) => (
                      <div key={index} className="bg-blue-50 p-4 sm:p-6 rounded-xl hover:shadow-lg transition-shadow">
                        <h3 className="font-semibold text-blue-800 mb-2">Example {index + 1}</h3>
                        <p className="text-blue-600 text-sm sm:text-base">{example}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'practice' && (
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-blue-800 mb-3 sm:mb-4">Practice Exercises</h2>
                  <div className="space-y-6 sm:space-y-8">
                    {content.exercises?.map((exercise, index) => (
                      <div key={index} className="bg-blue-50 p-4 sm:p-6 rounded-xl">
                        <p className="text-blue-700 mb-3 sm:mb-4 text-base sm:text-lg">{exercise.question}</p>
                        <div className="space-y-2 sm:space-y-3">
                          {exercise.options.map((option, optIndex) => (
                            <button
                              key={optIndex}
                              onClick={() => handleAnswerSelect(index, optIndex)}
                              disabled={showFeedback[index]}
                              className={`w-full p-3 sm:p-4 text-left rounded-lg transition-all duration-300 text-sm sm:text-base
                                ${showFeedback[index]
                                  ? optIndex === exercise.correctAnswer
                                    ? 'bg-green-100 border-2 border-green-500 text-green-700'
                                    : optIndex === answers[index]
                                      ? 'bg-red-100 border-2 border-red-500 text-red-700'
                                      : 'bg-white border-2 border-gray-200'
                                  : 'bg-white hover:bg-blue-100 border-2 border-blue-100'
                                }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 sm:mr-3 text-sm">
                                    {String.fromCharCode(65 + optIndex)}
                                  </span>
                                  <span>{option}</span>
                                </div>
                                {showFeedback[index] && (
                                  <span className="ml-2">
                                    {optIndex === exercise.correctAnswer && '✓'}
                                    {optIndex === answers[index] && optIndex !== exercise.correctAnswer && '×'}
                                  </span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                        {showFeedback[index] && (
                          <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
                            <div className={`p-3 sm:p-4 rounded-lg text-sm sm:text-base ${
                              answers[index] === exercise.correctAnswer
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              <p className="font-semibold">
                                {answers[index] === exercise.correctAnswer
                                  ? '🎉 Correct! Well done!'
                                  : '💡 Keep learning! Try again.'}
                              </p>
                            </div>
                            <button
                              onClick={() => resetExercise(index)}
                              className="text-blue-600 hover:text-blue-800 underline text-sm sm:text-base"
                            >
                              Try Again
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add custom styles to hide scrollbar but allow scrolling */}
      <style jsx>{`
        .no-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;  /* Chrome, Safari and Opera */
        }
      `}</style>
    </SlideWrapper>
  );
};

export default DetailSlide;