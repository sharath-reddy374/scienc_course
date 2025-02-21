// src/components/InputForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const InputForm = () => {
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Store the form data
    localStorage.setItem('courseData', JSON.stringify({ subject, topic }));
    
    // Simulate loading for smoother transition
    setTimeout(() => {
      setIsLoading(false);
      navigate('/course');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Course Generator</h1>
            <p className="text-blue-100">Create personalized learning experiences</p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium text-gray-700 block">
                Subject Area
              </label>
              <input 
                type="text" 
                id="subject" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required 
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 
                         focus:border-blue-500 transition-colors bg-gray-50 hover:bg-white"
                placeholder="e.g., Mathematics, Science, History"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="topic" className="text-sm font-medium text-gray-700 block">
                Specific Topic
              </label>
              <input 
                type="text" 
                id="topic" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required 
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 
                         focus:border-blue-500 transition-colors bg-gray-50 hover:bg-white"
                placeholder="e.g., Algebra, Biology, World War II"
              />
            </div>
            
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold
                       hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
                       focus:ring-offset-2 transition-colors disabled:opacity-70
                       transform hover:scale-[1.02] active:scale-[0.98] duration-200"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                  <span>Generating...</span>
                </div>
              ) : (
                'Generate Course'
              )}
            </button>
          </form>

          {/* Footer Section */}
          <div className="px-8 pb-8 text-center text-sm text-gray-500">
            Powered by advanced AI to create engaging learning content
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputForm;