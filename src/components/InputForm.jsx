import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const InputForm = () => {
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const formContainerRef = useRef(null);
  const navigate = useNavigate();

  // Ensure 16:9 aspect ratio
  useEffect(() => {
    const maintainAspectRatio = () => {
      if (formContainerRef.current) {
        const width = formContainerRef.current.offsetWidth;
        // Set height based on 16:9 ratio (width * 9/16)
        formContainerRef.current.style.height = `${width * (9/16)}px`;
      }
    };

    maintainAspectRatio();
    window.addEventListener('resize', maintainAspectRatio);
    
    return () => {
      window.removeEventListener('resize', maintainAspectRatio);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Store the form data
    localStorage.setItem('courseData', JSON.stringify({ 
      subject, 
      topic, 
      description
    }));
    
    // Simulate loading for smoother transition
    setTimeout(() => {
      setIsLoading(false);
      navigate('/course');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4 sm:p-6">
      <div 
        ref={formContainerRef}
        className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col"
        style={{ aspectRatio: '16/9', maxHeight: '85vh' }}
      >
        <div className="flex flex-col h-full">
          {/* Header Section with improved visual appeal */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 md:p-8 text-center relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              {/* Abstract pattern overlay */}
              <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
                <path d="M0,0 L100,0 L100,100 L0,100 Z" fill="none" stroke="white" strokeWidth="0.5"></path>
                <circle cx="20" cy="20" r="15" fill="none" stroke="white" strokeWidth="0.5"></circle>
                <circle cx="80" cy="80" r="15" fill="none" stroke="white" strokeWidth="0.5"></circle>
                <path d="M0,50 Q50,0 100,50 Q50,100 0,50" fill="none" stroke="white" strokeWidth="0.5"></path>
              </svg>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Course Generator</h1>
            <p className="text-blue-100 text-lg max-w-xl mx-auto">Create personalized learning experiences</p>
          </div>

          {/* Form Section with improved layout */}
          <div className="flex-1 overflow-auto p-4 md:p-6">
            <form onSubmit={handleSubmit} className="h-full flex flex-col">
              <div className="flex-1 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium text-gray-700 block">
                      Subject Area*
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        id="subject" 
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required 
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 
                                focus:border-blue-500 transition-colors bg-gray-50 hover:bg-white pl-10"
                        placeholder="e.g., Mathematics, Science, History"
                      />
                      <span className="absolute left-3 top-3 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="topic" className="text-sm font-medium text-gray-700 block">
                      Specific Topic*
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        id="topic" 
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        required 
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 
                                focus:border-blue-500 transition-colors bg-gray-50 hover:bg-white pl-10"
                        placeholder="e.g., Algebra, Biology, World War II"
                      />
                      <span className="absolute left-3 top-3 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium text-gray-700 block">
                    Course Description / Additional Details
                  </label>
                  <div className="relative">
                    <textarea 
                      id="description" 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 
                              focus:border-blue-500 transition-colors bg-gray-50 hover:bg-white min-h-[100px] pl-10"
                      placeholder="Describe the specific aspects you want to cover or any special requirements for this course..."
                    />
                    <span className="absolute left-3 top-3 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Add any learning objectives, preferred teaching styles, or specific content areas you want to focus on.</p>
                </div>
              </div>

              <div className="mt-6">
                {/* Enhanced button with better loading animation */}
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-lg font-semibold
                           hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
                           focus:ring-offset-2 transition-all disabled:opacity-70
                           transform hover:scale-[1.02] active:scale-[0.98] duration-200"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Creating Your Course...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Generate Course</span>
                    </div>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Enhanced Footer Section */}
          <div className="px-8 py-4 text-center border-t border-gray-100">
            <p className="text-sm text-gray-600">
              Powered by <span className="font-semibold text-indigo-600">edYOU</span> to create engaging learning content tailored to your needs
            </p>
            <div className="flex justify-center space-x-4 mt-3">
              <div className="flex items-center text-xs text-gray-500">
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Customizable</span>
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Research-Based</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputForm;
