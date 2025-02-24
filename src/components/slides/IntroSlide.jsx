import React, { useState } from 'react';
import SlideWrapper from '../common/SlideWrapper';

const IntroSlide = ({ courseData, content, onNext, onPrevious, onRefreshContent, isRefreshing }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [activeSection, setActiveSection] = useState('description'); // 'description' or 'quiz'

  // If content isn't available, don't render the slide.
  if (!content) return null;

  const handleAnswerSelect = (index) => {
    setSelectedAnswer(index);
    setShowFeedback(true);
  };

  const handleTryAnotherQuestion = () => {
    // Trigger centralized refresh.
    if (onRefreshContent) {
      onRefreshContent();
      // Optionally, reset quiz-related states here if needed.
      setSelectedAnswer(null);
      setShowFeedback(false);
    }
  };

  return (
    <SlideWrapper className="bg-gradient-to-br from-blue-50 to-blue-100 relative">
      {/* Overlay spinner for refreshing only on this slide */}
      {isRefreshing && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      )}
      <div className="w-full h-full flex flex-col p-4 md:p-8">
        {/* Title & Navigation */}
        <div className="text-center mb-4 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-blue-800 mb-3 md:mb-4">
            Introduction to {courseData.topic}
          </h1>
          <div className="flex justify-center space-x-2 md:space-x-4">
            <button
              onClick={() => setActiveSection('description')}
              className={`px-3 py-1 md:px-6 md:py-2 text-sm md:text-base rounded-full transition-all duration-300 ${
                activeSection === 'description'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-blue-600 hover:bg-blue-50'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveSection('quiz')}
              className={`px-3 py-1 md:px-6 md:py-2 text-sm md:text-base rounded-full transition-all duration-300 ${
                activeSection === 'quiz'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-blue-600 hover:bg-blue-50'
              }`}
            >
              Knowledge Check
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex justify-center items-center">
          <div className="w-full max-w-4xl">
            {activeSection === 'description' ? (
              // Description Section
              <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8 transform transition-all duration-500">
                <div className="flex flex-col md:flex-row md:items-start md:space-x-6">
                  <div className="flex-1">
                    <h2 className="text-xl md:text-2xl font-semibold text-blue-800 mb-3 md:mb-4">
                      What is {courseData.topic}?
                    </h2>
                    <p className="text-blue-700 text-base md:text-lg leading-relaxed whitespace-pre-line">
                      {content?.description}
                    </p>
                    <button
                      onClick={() => setActiveSection('quiz')}
                      className="mt-6 md:mt-8 bg-blue-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg
                               hover:bg-blue-700 transition-colors transform hover:scale-105 w-full md:w-auto"
                    >
                      Ready for a Quick Quiz? →
                    </button>
                  </div>
                  <div className="w-full md:w-1/3 mt-4 md:mt-0">
                    <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl p-4 md:p-6 shadow-inner">
                      <div className="text-4xl md:text-6xl mb-2 md:mb-4">🎯</div>
                      <h3 className="text-base md:text-lg font-semibold text-blue-800 mb-2">Learning Goals</h3>
                      <ul className="space-y-1 md:space-y-2 text-blue-700 text-sm md:text-base">
                        <li className="flex items-center">
                          <span className="text-green-500 mr-2">✓</span>
                          Understand core concepts
                        </li>
                        <li className="flex items-center">
                          <span className="text-green-500 mr-2">✓</span>
                          Apply knowledge
                        </li>
                        <li className="flex items-center">
                          <span className="text-green-500 mr-2">✓</span>
                          Master key principles
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Quiz Section
              <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8 transform transition-all duration-500">
                <h2 className="text-xl md:text-2xl font-semibold text-blue-800 mb-4 md:mb-6">
                  Knowledge Check
                </h2>
                <div className="bg-blue-50 rounded-xl p-4 md:p-6 mb-4 md:mb-6">
                  <p className="text-base md:text-lg text-blue-700 mb-3 md:mb-4">
                    {content?.quiz?.question}
                  </p>
                  <div className="space-y-2 md:space-y-3">
                    {content?.quiz?.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(index)}
                        disabled={showFeedback}
                        className={`w-full p-3 md:p-4 text-left rounded-lg transition-all duration-300 text-sm md:text-base
                          ${
                            selectedAnswer === index
                              ? selectedAnswer === content.quiz.correctIndex
                                ? 'bg-green-100 border-2 border-green-500 text-green-700'
                                : 'bg-red-100 border-2 border-red-500 text-red-700'
                              : 'bg-white hover:bg-blue-50 border-2 border-blue-100'
                          }
                          ${showFeedback ? 'cursor-default' : 'hover:scale-102'}`}
                      >
                        <div className="flex items-center">
                          <span className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 md:mr-3 text-sm md:text-base">
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span className="flex-1">{option}</span>
                          {showFeedback && index === content.quiz.correctIndex && (
                            <span className="ml-1 text-green-500">✓</span>
                          )}
                          {showFeedback && selectedAnswer === index && index !== content.quiz.correctIndex && (
                            <span className="ml-1 text-red-500">✗</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                {showFeedback && (
                  <div className={`text-center p-3 md:p-4 rounded-lg text-sm md:text-base ${
                    selectedAnswer === content.quiz.correctIndex
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    <p className="font-semibold mb-2">
                      {selectedAnswer === content.quiz.correctIndex
                        ? '🎉 Great job! You got it right!'
                        : '📚 Keep learning! Review the content and try again.'}
                    </p>
                    <button
                      onClick={handleTryAnotherQuestion}
                      className="mt-2 px-3 py-1 md:px-4 md:py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                    >
                      Try Another Question
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-4 md:mt-8">
          <button
            onClick={onPrevious}
            className="bg-white text-blue-600 px-3 py-2 md:px-6 md:py-2 rounded-full shadow-md
                     hover:bg-blue-50 transition-all duration-300 hover:scale-105 text-sm md:text-base"
          >
            ← Prev
          </button>
          <button
            onClick={onNext}
            className="bg-blue-600 text-white px-3 py-2 md:px-6 md:py-2 rounded-full shadow-md
                     hover:bg-blue-700 transition-all duration-300 hover:scale-105 text-sm md:text-base"
          >
            Next →
          </button>
        </div>
      </div>
    </SlideWrapper>
  );
};

export default IntroSlide;