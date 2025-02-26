import React, { useState, useEffect, useRef } from 'react';
import SlideWrapper from '../common/SlideWrapper';
// Fixed import - using the correct function from your openai.js file
import generateSlideContent from '../../services/openai';
import './MatchingSlide.css';

const MatchingSlide = ({ courseData, content, onNext, onPrevious, onRefreshContent, isRefreshing }) => {
  // State management
  const [loading, setLoading] = useState(!content);
  const [generatingNew, setGeneratingNew] = useState(false);
  const [matches, setMatches] = useState({});
  const [score, setScore] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [terms, setTerms] = useState([]);
  const [definitions, setDefinitions] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [animatingItems, setAnimatingItems] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  // Local content state to manage refreshed content
  const [localContent, setLocalContent] = useState(content);
  
  const connectionLinesRef = useRef([]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Update local content when props content changes
  useEffect(() => {
    if (content) {
      setLocalContent(content);
    }
  }, [content]);
  
  // Process content when it changes
  useEffect(() => {
    if (!localContent) return;
    
    try {
      // Process terms and definitions from content
      const termsData = localContent.items.map((item, index) => ({
        id: `term-${index}`,
        content: item.term,
        matchId: index,
        type: 'term'
      }));

      const defsData = localContent.items.map((item, index) => ({
        id: `def-${index}`,
        content: item.definition,
        matchId: index,
        type: 'definition'
      }));

      setTerms(termsData);
      setDefinitions(shuffleArray([...defsData]));
      setLoading(false);
      setGeneratingNew(false);
    } catch (error) {
      console.error('Error processing matching content:', error);
      setLoading(false);
      setGeneratingNew(false);
    }
  }, [localContent]);

  // Draw connection lines effect
  useEffect(() => {
    const drawConnectionLine = (elem1, elem2) => {
      const rect1 = elem1.getBoundingClientRect();
      const rect2 = elem2.getBoundingClientRect();
      
      // Get positions relative to the viewport
      const x1 = rect1.right;
      const y1 = rect1.top + rect1.height / 2;
      const x2 = rect2.left;
      const y2 = rect2.top + rect2.height / 2;

      // For mobile layout (vertical arrangement)
      const isMobileLayout = window.innerWidth < 768;
      
      // Create SVG line
      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.classList.add('connection-line');
      svg.setAttribute('style', 'position: fixed; z-index: 10; pointer-events: none;');
      
      let path;
      
      if (isMobileLayout) {
        // For mobile (vertical layout), draw a curved path from bottom of term to top of definition
        const x1 = rect1.left + rect1.width / 2;
        const y1 = rect1.bottom;
        const x2 = rect2.left + rect2.width / 2;
        const y2 = rect2.top;
        
        // Set SVG size and position
        svg.setAttribute('width', Math.max(rect1.width, rect2.width) + 20);
        svg.setAttribute('height', rect2.top - rect1.bottom + 10);
        svg.style.left = (Math.min(x1, x2) - 10) + 'px';
        svg.style.top = rect1.bottom + 'px';
        
        // Create a curved path
        const midY = (y2 - y1) / 2;
        path = document.createElementNS(svgNS, "path");
        
        // Adjust coordinates to be relative to the SVG position
        const svgX1 = x1 - parseFloat(svg.style.left);
        const svgY1 = 0; // y1 is at the top of the SVG
        const svgX2 = x2 - parseFloat(svg.style.left);
        const svgY2 = y2 - y1;
        
        path.setAttribute("d", `M ${svgX1} ${svgY1} C ${svgX1} ${midY}, ${svgX2} ${midY}, ${svgX2} ${svgY2}`);
      } else {
        // For desktop (horizontal layout), draw a straight line
        // Set SVG size and position
        svg.setAttribute('width', x2 - x1 + 10);
        svg.setAttribute('height', Math.abs(y2 - y1) + 10);
        svg.style.left = (x1 - 5) + 'px';
        svg.style.top = (Math.min(y1, y2) - 5) + 'px';
        
        // Create line element
        path = document.createElementNS(svgNS, "line");
        
        // Adjust coordinates to be relative to the SVG position
        const svgX1 = 5;
        const svgY1 = y1 - parseFloat(svg.style.top);
        const svgX2 = x2 - x1 + 5;
        const svgY2 = y2 - parseFloat(svg.style.top);
        
        path.setAttribute("x1", svgX1);
        path.setAttribute("y1", svgY1);
        path.setAttribute("x2", svgX2);
        path.setAttribute("y2", svgY2);
      }
      
      // Enhanced styling for connection lines
      path.setAttribute("stroke", "#22c55e");
      path.setAttribute("stroke-width", "3");
      path.setAttribute("stroke-dasharray", "5,3");
      path.setAttribute("stroke-linecap", "round"); 
      path.setAttribute("fill", "none");
      
      svg.appendChild(path);
      document.body.appendChild(svg);
      
      // Store reference to the SVG element
      connectionLinesRef.current.push(svg);
    };

    // Clear existing lines first
    const clearLines = () => {
      const existingLines = document.querySelectorAll('.connection-line');
      existingLines.forEach(line => line.remove());
      connectionLinesRef.current = [];
    };
    
    clearLines();
    
    // Then create new lines if we have matches
    Object.entries(matches).forEach(([id1, id2]) => {
      // Only process term->definition connections (avoid duplicates)
      if (id1.startsWith('term-')) {
        const elem1 = document.getElementById(id1);
        const elem2 = document.getElementById(id2);
        
        if (elem1 && elem2) {
          drawConnectionLine(elem1, elem2);
        }
      }
    });

    // Cleanup function that will run when component unmounts or before next effect
    return clearLines;
  }, [matches]);

  // Cleanup connection lines when component unmounts
  useEffect(() => {
    return () => {
      const existingLines = document.querySelectorAll('.connection-line');
      existingLines.forEach(line => line.remove());
    };
  }, []);

  // Utility functions
  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Function to generate new questions through OpenAI
  const generateNewQuestions = async () => {
    try {
      setGeneratingNew(true);
      
      // Extract subject and topic from courseData
      const { subject, topic } = courseData;
      
      // Call the OpenAI service to generate new matching questions
      // Using default export from your openai.js file
      const response = await generateSlideContent('MATCHING', { subject, topic });
      
      // Parse the response and update local content
      setLocalContent(response);
      
      // Reset game state
      setMatches({});
      setScore(0);
      setShowCelebration(false);
      
      // Clear connection lines
      const existingLines = document.querySelectorAll('.connection-line');
      existingLines.forEach(line => line.remove());
      connectionLinesRef.current = [];
    } catch (error) {
      console.error('Error generating new questions:', error);
      setGeneratingNew(false);
      
      // If there's an error, just reset with existing content
      setMatches({});
      setScore(0);
      setDefinitions(shuffleArray([...definitions]));
      setShowCelebration(false);
    }
  };

  // Handle drag and drop functions
  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    // Set ghost image for drag
    const ghostElement = document.createElement('div');
    ghostElement.classList.add('drag-ghost');
    ghostElement.textContent = item.content;
    document.body.appendChild(ghostElement);
    e.dataTransfer.setDragImage(ghostElement, 20, 20);
    setTimeout(() => {
      document.body.removeChild(ghostElement);
    }, 0);
  };

  const handleDragOver = (e, item) => {
    e.preventDefault();
    // Only allow dropping if items are of different types and dragged item is not matched
    if (item.type !== draggedItem?.type && !Object.keys(matches).includes(draggedItem?.id)) {
      e.currentTarget.classList.add('drag-over');
    }
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (e, targetItem) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    if (!draggedItem || targetItem.type === draggedItem.type || 
        Object.keys(matches).includes(draggedItem.id)) {
      return;
    }

    // Check if this is a correct match
    const isCorrect = draggedItem.matchId === targetItem.matchId;

    if (isCorrect) {
      const newMatches = { ...matches };
      newMatches[draggedItem.id] = targetItem.id;
      newMatches[targetItem.id] = draggedItem.id;
      setMatches(newMatches);
      setScore(prev => prev + 1);

      // Play success animation
      const itemElements = [
        document.getElementById(draggedItem.id),
        document.getElementById(targetItem.id)
      ];
      
      itemElements.forEach(el => el?.classList.add('match-success'));
      
      setTimeout(() => {
        itemElements.forEach(el => el?.classList.remove('match-success'));
      }, 1000);
      
      if (Object.keys(newMatches).length / 2 === terms.length) {
        setShowCelebration(true);
      }
    } else {
      // Visual feedback for incorrect match
      setAnimatingItems([draggedItem.id, targetItem.id]);
      
      setTimeout(() => {
        setAnimatingItems([]);
      }, 600);
    }
    
    setDraggedItem(null);
  };

  // Function to handle touch events for mobile
  const handleTouchSelect = (item) => {
    if (Object.keys(matches).includes(item.id)) {
      return; // Already matched
    }

    if (!draggedItem) {
      // Select this item with a vibration feedback if available
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50); // Short vibration for tactile feedback
      }
      setDraggedItem(item);
    } else if (draggedItem.id === item.id) {
      // Deselect
      setDraggedItem(null);
    } else if (draggedItem.type === item.type) {
      // Can't match same types
      setDraggedItem(item);
    } else {
      // Try to match different types
      const isCorrect = draggedItem.matchId === item.matchId;
      
      if (isCorrect) {
        if (window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate([50, 50, 100]); // Success pattern
        }
        
        const newMatches = { ...matches };
        newMatches[draggedItem.id] = item.id;
        newMatches[item.id] = draggedItem.id;
        setMatches(newMatches);
        setScore(prev => prev + 1);
  
        // Play success animation
        const itemElements = [
          document.getElementById(draggedItem.id),
          document.getElementById(item.id)
        ];
        
        itemElements.forEach(el => el?.classList.add('match-success'));
        
        setTimeout(() => {
          itemElements.forEach(el => el?.classList.remove('match-success'));
        }, 1000);
        
        if (Object.keys(newMatches).length / 2 === terms.length) {
          setShowCelebration(true);
        }
      } else {
        // Error feedback
        if (window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate(200); // Longer vibration for error
        }
        
        // Visual feedback for incorrect match
        setAnimatingItems([draggedItem.id, item.id]);
        
        setTimeout(() => {
          setAnimatingItems([]);
        }, 600);
      }
      
      setDraggedItem(null);
    }
  };

  // Reset the matching game - UPDATED to generate new questions
  const resetMatching = () => {
    // Generate new questions on reset
    generateNewQuestions();
  };

  // Render functions for mobile and desktop views
  const renderMobileContent = () => (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-blue-700 text-center mb-3">Terms</h2>
        <div className="flex flex-col space-y-3">
          {terms.map((term) => (
            <div
              key={term.id}
              id={term.id}
              onClick={() => handleTouchSelect(term)}
              className={`matching-card term-card p-4 relative
                ${draggedItem?.id === term.id ? 'selected-card' : ''}
                ${matches[term.id] !== undefined ? 'matched-card' : ''}
                ${animatingItems.includes(term.id) ? 'shake-animation' : ''}
              `}
            >
              <div className="flex items-center">
                <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2 flex-shrink-0 text-sm font-medium text-blue-700">
                  {String.fromCharCode(65 + parseInt(term.id.split('-')[1]))}
                </span>
                <span className="text-sm sm:text-base">{term.content}</span>
                
                {matches[term.id] !== undefined && (
                  <span className="ml-auto text-green-500 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </div>
              
              {matches[term.id] !== undefined && (
                <div className="match-badge term-badge">
                  {String.fromCharCode(65 + parseInt(matches[term.id].split('-')[1]))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-purple-700 text-center mb-3">Definitions</h2>
        <div className="flex flex-col space-y-3">
          {definitions.map((def) => (
            <div
              key={def.id}
              id={def.id}
              onClick={() => handleTouchSelect(def)}
              className={`matching-card def-card p-4 relative
                ${draggedItem?.id === def.id ? 'selected-card' : ''}
                ${matches[def.id] !== undefined ? 'matched-card' : ''}
                ${animatingItems.includes(def.id) ? 'shake-animation' : ''}
              `}
            >
              <div className="flex items-center">
                <span className="text-sm sm:text-base">{def.content}</span>
                
                {matches[def.id] !== undefined && (
                  <span className="ml-auto text-green-500 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </div>
              
              {matches[def.id] !== undefined && (
                <div className="match-badge def-badge">
                  {String.fromCharCode(65 + parseInt(matches[def.id].split('-')[1]))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDesktopContent = () => (
    <div className="grid grid-cols-2 gap-x-12 gap-y-4 w-full">
      {/* Headers */}
      <h2 className="text-xl font-semibold text-blue-700 text-center">Terms</h2>
      <h2 className="text-xl font-semibold text-purple-700 text-center">Definitions</h2>
      
      {/* Content rows - terms and definitions side by side */}
      {terms.map((term, index) => {
        const def = definitions[index];
        return (
          <React.Fragment key={`row-${index}`}>
            {/* Term cell */}
            <div
              id={term.id}
              draggable={!Object.keys(matches).includes(term.id)}
              onDragStart={(e) => handleDragStart(e, term)}
              onDragOver={(e) => handleDragOver(e, term)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, term)}
              className={`matching-card term-card p-4 sm:p-6 h-full relative
                ${matches[term.id] !== undefined ? 'matched-card' : ''}
                ${animatingItems.includes(term.id) ? 'shake-animation' : ''}
              `}
            >
              <div className="flex items-center h-full">
                <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0 text-sm font-medium text-blue-700">
                  {String.fromCharCode(65 + parseInt(term.id.split('-')[1]))}
                </span>
                <span className="text-sm sm:text-base">{term.content}</span>
                
                {matches[term.id] !== undefined ? (
                  <span className="ml-auto text-green-500 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                ) : (
                  <span className="ml-auto text-blue-400 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                  </span>
                )}
              </div>
              
              {matches[term.id] !== undefined && (
                <div className="match-badge term-badge">
                  {String.fromCharCode(65 + parseInt(matches[term.id].split('-')[1]))}
                </div>
              )}
            </div>
            
            {/* Definition cell */}
            <div
              id={def.id}
              draggable={!Object.keys(matches).includes(def.id)}
              onDragStart={(e) => handleDragStart(e, def)}
              onDragOver={(e) => handleDragOver(e, def)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, def)}
              className={`matching-card def-card p-4 sm:p-6 h-full relative
                ${matches[def.id] !== undefined ? 'matched-card' : ''}
                ${animatingItems.includes(def.id) ? 'shake-animation' : ''}
              `}
            >
              <div className="flex items-center h-full">
                <span className="text-sm sm:text-base">{def.content}</span>
                
                {matches[def.id] !== undefined ? (
                  <span className="ml-auto text-green-500 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                ) : (
                  <span className="ml-auto text-blue-400 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                  </span>
                )}
              </div>
              
              {matches[def.id] !== undefined && (
                <div className="match-badge def-badge">
                  {String.fromCharCode(65 + parseInt(matches[def.id].split('-')[1]))}
                </div>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );

  // If content isn't available, don't render the slide.
  if (!content && !localContent && !loading) return null;

  // Show loading state when initially loading or generating new questions
  if (loading || (!localContent && !content) || generatingNew) {
    return (
      <SlideWrapper className="bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="fixed inset-0 z-50 flex items-center justify-center loading-container">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 loading-spinner-outer"></div>
              <div className="absolute inset-0 loading-spinner-inner animate-spin"></div>
              <div className="absolute inset-1/4 bg-blue-500 rounded-full animate-ping opacity-75"></div>
            </div>
            <div className="text-xl sm:text-2xl font-semibold text-blue-800 animate-pulse">
              {generatingNew ? "Generating New Questions..." : "Loading Next Slide..."}
            </div>
            <div className="progress-container w-56 sm:w-64">
              <div className="progress-bar animate-loading-bar"></div>
            </div>
          </div>
        </div>
      </SlideWrapper>
    );
  }

  return (
    <SlideWrapper className="bg-gradient-to-br from-blue-50 to-blue-100 relative">
      {/* Overlay spinner for refreshing only on this slide */}
      {isRefreshing && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      )}
      
      <div className="w-full h-full p-4 sm:p-8 overflow-y-auto">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-blue-800 mb-3 tracking-tight">
            Match the Concepts
          </h1>
          <p className="text-blue-600 mb-4">
            <span className="inline-block bg-blue-50 border border-blue-200 px-3 py-1 rounded-full shadow-sm text-sm sm:text-base">
              {isMobile 
                ? "Tap to select and match items" 
                : "Drag a term and drop it on its matching definition"}
            </span>
          </p>
          
          {/* Score progress bar */}
          <div className="max-w-md mx-auto mb-4">
            <div className="flex justify-between text-sm text-blue-700 mb-1 px-1">
              <span>Progress</span>
              <span>{score} of {terms.length} matched</span>
            </div>
            <div className="progress-container">
              <div 
                className="progress-bar" 
                style={{ width: `${(score / terms.length) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <button 
            onClick={resetMatching}
            className="btn btn-secondary text-blue-700 px-4 py-1 rounded-full text-sm sm:text-base flex items-center mx-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            New Questions
          </button>
        </div>

        <div className="flex justify-between mb-6 sm:mb-8">
          {isMobile ? renderMobileContent() : renderDesktopContent()}
        </div>

        {showCelebration && (
          <div className="fixed inset-0 flex items-center justify-center celebration-overlay z-50 p-4">
            <div className="relative celebration-card p-8 sm:p-10 rounded-xl text-center max-w-xs sm:max-w-md">
              <div className="confetti"></div>
              <div className="overflow-hidden">
                <div className="flex justify-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span 
                      key={i} 
                      className="text-3xl sm:text-5xl mx-1 emoji-bounce"
                      style={{
                        animationDelay: `${i * 0.1}s`
                      }}
                    >
                      {['🎉', '🏆', '🎯', '✨', '🎊'][i]}
                    </span>
                  ))}
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-green-500 mb-3 sm:mb-4">
                  Congratulations!
                </h2>
                <p className="text-lg sm:text-xl text-blue-600 mb-6 sm:mb-8">
                  You've matched all items correctly!
                </p>
                <div className="flex space-x-4 sm:space-x-6 justify-center">
                  <button
                    onClick={resetMatching}
                    className="btn btn-secondary text-blue-700 px-5 py-2 sm:px-7 sm:py-3 rounded-full text-sm sm:text-base"
                  >
                    New Questions
                  </button>
                  <button
                    onClick={onNext}
                    className="btn btn-primary text-white px-6 py-2 sm:px-8 sm:py-3 rounded-full text-sm sm:text-base"
                  >
                    Continue →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 sm:mt-10 flex justify-between">
          <button
            onClick={onPrevious}
            className="btn btn-secondary text-blue-600 px-5 py-2 sm:px-7 sm:py-2 rounded-full shadow flex items-center text-sm sm:text-base"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          <button
            onClick={onNext}
            className="btn btn-primary text-white px-5 py-2 sm:px-7 sm:py-2 rounded-full shadow flex items-center text-sm sm:text-base"
          >
            Next
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </SlideWrapper>
  );
};

export default MatchingSlide;