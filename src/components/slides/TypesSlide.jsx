// src/components/slides/TypesSlide.jsx
import React, { useState } from 'react';
import SlideWrapper from '../common/SlideWrapper';

const TypesSlide = ({ courseData, content, onPrevious, isLast, onNext }) => {
  const [activeTopic, setActiveTopic] = useState(null);

  // Do not render anything if content is not yet available.
  if (!content) {
    return null;
  }

  return (
    <SlideWrapper className="bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="w-full h-full flex flex-col p-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-800 mb-2">
            {courseData.topic} - Core Concepts
          </h1>
          <p className="text-blue-600">Click on any concept to explore more</p>
        </header>

        {activeTopic === null ? (
          // Grid view when no topic is selected
          <div className="grid grid-cols-2 gap-6 flex-1">
            {content?.concepts?.map((concept, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer
                           transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
                onClick={() => setActiveTopic(index)}
              >
                <div className="p-8 h-full flex flex-col items-center justify-center text-center">
                  <div className="text-5xl mb-4 transform transition-transform duration-300">
                    {concept.icon}
                  </div>
                  <h2 className="text-2xl font-bold text-blue-800 mb-3">
                    {concept.title}
                  </h2>
                  <p className="text-blue-600 text-sm">
                    Click to discover more
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Expanded view when a topic is selected
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-xl p-8 h-full">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                  <span className="text-4xl">{content.concepts[activeTopic].icon}</span>
                  <h2 className="text-3xl font-bold text-blue-800">
                    {content.concepts[activeTopic].title}
                  </h2>
                </div>
                <button
                  onClick={() => setActiveTopic(null)}
                  className="text-blue-600 hover:text-blue-800 text-2xl w-10 h-10 rounded-full
                             flex items-center justify-center hover:bg-blue-50 transition-colors"
                >
                  ×
                </button>
              </div>
              <div className="grid grid-cols-3 gap-6 mt-4">
                {content.concepts[activeTopic].points.map((point, idx) => (
                  <div
                    key={idx}
                    className="bg-blue-50 p-6 rounded-xl transform transition-all duration-300
                               hover:translate-y-[-4px] hover:shadow-lg"
                  >
                    <h3 className="text-xl font-semibold text-blue-800 mb-3">
                      {point.title}
                    </h3>
                    <p className="text-blue-600 leading-relaxed">
                      {point.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-between">
          <button
            onClick={onPrevious}
            className="bg-white text-blue-600 px-8 py-3 rounded-full shadow-md
                       hover:bg-blue-50 transition-all duration-300 hover:scale-105"
          >
            ← Previous
          </button>
          {isLast && (
            <button
              onClick={() => alert('Course completed!')}
              className="bg-green-500 text-white px-8 py-3 rounded-full shadow-md
                       hover:bg-green-600 transition-all duration-300 hover:scale-105"
            >
              Complete Course ✓
            </button>
          )}
        </div>
      </div>
    </SlideWrapper>
  );
};

export default TypesSlide;
