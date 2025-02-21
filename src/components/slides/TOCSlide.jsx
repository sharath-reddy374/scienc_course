// src/components/slides/TOCSlide.jsx
import React, { useState, useEffect } from 'react';
import { generateSlideContent } from '../../services/openai';
import SlideWrapper from '../common/SlideWrapper';

const TOCSlide = ({ courseData, onNext, isFirst }) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeQuest, setActiveQuest] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const data = await generateSlideContent('TOC', courseData);
        setContent(data);
      } catch (error) {
        console.error('Error fetching TOC content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [courseData]);

  if (loading) {
    return (
      <SlideWrapper className="bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
      </SlideWrapper>
    );
  }

  return (
    <SlideWrapper className="bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="w-full h-full flex flex-col items-center p-8">
        {/* Title Section */}
        <div className="text-center mb-12 mt-4">
          <h1 className="text-5xl md:text-6xl font-extrabold text-blue-800 mb-4 
                       tracking-tight leading-tight drop-shadow-sm">
            {content?.title || `${courseData.subject}: ${courseData.topic}`}
          </h1>
          <p className="text-xl text-blue-600 max-w-2xl mx-auto">
            Embark on an interactive learning journey through {courseData.topic}
          </p>
        </div>

        {/* Quests Grid */}
        <div className="grid grid-cols-2 gap-8 w-full max-w-5xl mb-12">
          {content?.quests?.map((quest, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-2xl shadow-lg overflow-hidden
                       transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
              onMouseEnter={() => setActiveQuest(index)}
              onMouseLeave={() => setActiveQuest(null)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-blue-600/20 
                           group-hover:opacity-100 transition-opacity"></div>
              
              <div className="p-6 relative">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center 
                               text-blue-600 font-bold text-lg mr-4">
                    {index + 1}
                  </div>
                  <h2 className="text-2xl font-bold text-blue-800">{quest.title}</h2>
                </div>

                <ul className="space-y-3 mt-4">
                  {quest.objectives?.map((objective, idx) => (
                    <li 
                      key={idx} 
                      className="flex items-start text-blue-700 opacity-90
                               transform transition-transform duration-300
                               translate-y-0 group-hover:translate-y-0"
                    >
                      <span className="text-green-500 mr-2 text-xl">✓</span>
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
          className="bg-blue-600 text-white px-10 py-4 rounded-full font-semibold text-lg
                   hover:bg-blue-700 transform hover:scale-105 transition-all duration-300
                   shadow-lg hover:shadow-xl flex items-center space-x-2"
        >
          <span>Start Your Journey</span>
          <span className="text-xl">→</span>
        </button>
      </div>
    </SlideWrapper>
  );
};

export default TOCSlide;