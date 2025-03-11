import React from 'react';
import SlideWrapper from '../common/SlideWrapper';
import LoadingSpinner from '../LoadingSpinner';

const CourseSummarySlide = ({ 
  courseData, 
  content, 
  onNext, 
  onPrevious, 
  onRefreshContent, 
  isRefreshing 
}) => {
  // Extract key information from content
  const courseTitle = content?.title || courseData?.title || "Course Summary";
  const overview = content?.overview || `This course covered key concepts in ${courseData?.topic || "the subject"}.`;
  const quests = content?.quests || [];
  const keyLearnings = content?.keyLearnings || [];
  
  if (isRefreshing) {
    return (
      <SlideWrapper className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
        <div className="w-full h-full flex items-center justify-center">
          <div className="flex flex-col items-center">
            <LoadingSpinner />
            <p className="mt-4 text-indigo-700 font-medium">Generating course summary...</p>
          </div>
        </div>
      </SlideWrapper>
    );
  }
  
  return (
    <SlideWrapper className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
      <div className="w-full h-full flex items-center justify-center px-2">
        {/* Main container with 16:9 aspect ratio */}
        <div className="w-full max-w-7xl aspect-video bg-white/90 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden flex flex-col">
          {/* Background decorative elements */}
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none"></div>
          
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 px-6">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold">Course Summary</h1>
              <button
                onClick={() => onRefreshContent({ forceRefresh: true })}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                disabled={isRefreshing}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Course title */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 py-4 px-6 border-b border-indigo-100 shadow-sm">
            <h2 className="text-2xl md:text-3xl font-bold text-center bg-gradient-to-r from-indigo-700 via-blue-600 to-indigo-700 bg-clip-text text-transparent">
              {courseTitle}
            </h2>
            <p className="text-center text-gray-600 mt-2">
              Congratulations on completing this course!
            </p>
            <div className="flex justify-center mt-2">
              <div className="bg-indigo-100 text-indigo-700 rounded-full px-4 py-1 text-sm font-medium flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Main content area - designed for narration */}
          <div className="flex-1 overflow-auto p-6">
            {/* Course overview - prime spot for narration */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
              <h3 className="text-xl font-bold text-indigo-700 mb-3">Course Overview</h3>
              <p className="text-gray-700 leading-relaxed">
                {overview}
              </p>
            </div>
            
            {/* Key accomplishments - visual with good narration points */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-indigo-700 mb-3">Your Accomplishments</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-lg shadow-md p-5 text-white">
                  <div className="text-3xl font-bold">{quests.length}</div>
                  <div className="text-lg">Quests Completed</div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md p-5 text-white">
                  <div className="text-3xl font-bold">
                    {quests.reduce((count, quest) => count + (quest.objectives?.length || 0), 0)}
                  </div>
                  <div className="text-lg">Topics Mastered</div>
                </div>
              </div>
            </div>
            
            {/* Key concepts - sequential for easy narration */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
              <h3 className="text-xl font-bold text-indigo-700 mb-3">Key Concepts You've Mastered</h3>
              <div className="space-y-3">
                {(keyLearnings.length > 0 ? keyLearnings : generateDefaultLearnings(quests)).map((point, idx) => (
                  <div 
                    key={idx} 
                    className="bg-gradient-to-r from-indigo-50 to-blue-50 p-3 rounded-lg border-l-4 border-indigo-500 shadow-sm"
                  >
                    <h4 className="font-semibold text-indigo-800 flex items-center">
                      <span className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center mr-3 shadow-sm">
                        {idx + 1}
                      </span>
                      {typeof point === 'object' ? point.title : point}
                    </h4>
                    {typeof point === 'object' && point.description && (
                      <p className="text-gray-700 ml-10 mt-1">
                        {point.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Journey summary - perfect for concluding narration */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg shadow-md p-5 text-white">
              <h3 className="text-xl font-bold mb-3">Your Learning Journey</h3>
              <p className="mb-3">
                Throughout this course, you've explored {quests.length} key areas:
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {quests.map((quest, idx) => (
                  <div key={idx} className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mr-2 flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="text-sm font-medium">{quest.title}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Footer with navigation */}
          <div className="border-t border-gray-200 px-6 py-3 flex justify-between items-center bg-gray-50">
            <button
              onClick={onPrevious}
              className="flex items-center px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-100 text-sm"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            
            <button
              onClick={onNext}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-sm transition-colors text-sm"
            >
              Finish Course
              <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
};

// Helper function to generate default learning points
const generateDefaultLearnings = (quests) => {
  return quests.map((quest, idx) => {
    const objective = quest.objectives && quest.objectives.length > 0 
      ? quest.objectives[0]
      : null;
    
    return {
      title: quest.title,
      description: objective || `Understanding the core concepts of ${quest.title}`
    };
  });
};

export default CourseSummarySlide;