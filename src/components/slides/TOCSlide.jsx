import React, { useState } from 'react';
import SlideWrapper from '../common/SlideWrapper';

const TOCSlide = ({ courseData, content, onNext, isFirst }) => {
  const [activeQuest, setActiveQuest] = useState(null);

  // If content isn't available yet, render nothing (or a fallback if desired)
  if (!content) return null;

  return (
    <SlideWrapper className="bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="w-full h-full flex flex-col items-center p-4 md:p-8">
        {/* Title Section */}
        <div className="text-center mb-6 md:mb-12 mt-2 md:mt-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-blue-800 mb-3 md:mb-4 
                       tracking-tight leading-tight drop-shadow-sm">
            {content.title || `${courseData.subject}: ${courseData.topic}`}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-blue-600 max-w-2xl mx-auto">
            Embark on an interactive learning journey through {courseData.topic}
          </p>
        </div>

        {/* Quests Grid - Changes to single column on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8 w-full max-w-5xl mb-6 md:mb-12">
          {content.quests?.map((quest, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-2xl shadow-lg overflow-hidden
                         transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
              onMouseEnter={() => setActiveQuest(index)}
              onMouseLeave={() => setActiveQuest(null)}
              onClick={() => setActiveQuest(activeQuest === index ? null : index)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-blue-600/20 
                              group-hover:opacity-100 transition-opacity"></div>
              
              <div className="p-4 md:p-6 relative">
                <div className="flex items-center mb-3 md:mb-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 flex items-center justify-center 
                               text-blue-600 font-bold text-base md:text-lg mr-3 md:mr-4">
                    {index + 1}
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-blue-800">{quest.title}</h2>
                </div>

                <ul className="space-y-2 md:space-y-3 mt-3 md:mt-4">
                  {quest.objectives?.map((objective, idx) => (
                    <li 
                      key={idx} 
                      className="flex items-start text-blue-700 opacity-90
                                 transform transition-transform duration-300
                                 translate-y-0 group-hover:translate-y-0 text-sm md:text-base"
                    >
                      <span className="text-green-500 mr-2 text-lg md:text-xl flex-shrink-0">✓</span>
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>

                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600 
                             transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Start Button */}
        <button
          onClick={onNext}
          className="bg-blue-600 text-white px-6 py-3 md:px-10 md:py-4 rounded-full font-semibold text-base md:text-lg
                     hover:bg-blue-700 transform hover:scale-105 transition-all duration-300
                     shadow-lg hover:shadow-xl flex items-center space-x-2 w-full sm:w-auto max-w-xs"
        >
          <span>Start Your Journey</span>
          <span className="text-lg md:text-xl">→</span>
        </button>
      </div>
    </SlideWrapper>
  );
};

export default TOCSlide;