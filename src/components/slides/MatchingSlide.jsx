import React, { useState, useEffect, useRef } from 'react';
import SlideWrapper from '../common/SlideWrapper';

const MatchingSlide = ({ courseData, content, onNext, onPrevious, onRefreshContent, isRefreshing }) => {
  // All state hooks must be at the top level, never conditional
  const [loading, setLoading] = useState(!content);
  const [matches, setMatches] = useState({});
  const [score, setScore] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [terms, setTerms] = useState([]);
  const [definitions, setDefinitions] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [animatingItems, setAnimatingItems] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  
  // Use refs for elements that need to be tracked but don't trigger re-renders
  const connectionLinesRef = useRef([]);

  // Check if the device is mobile based on screen width
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Add resize listener
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Process content when it changes
  useEffect(() => {
    if (!content) return;
    
    try {
      // Process terms and definitions from content
      const termsData = content.items.map((item, index) => ({
        id: `term-${index}`,
        content: item.term,
        matchId: index,
        type: 'term'
      }));

      const defsData = content.items.map((item, index) => ({
        id: `def-${index}`,
        content: item.definition,
        matchId: index,
        type: 'definition'
      }));

      setTerms(termsData);
      setDefinitions(shuffleArray([...defsData]));
      setLoading(false);
    } catch (error) {
      console.error('Error processing matching content:', error);
    }
  }, [content]);

  // Draw connection lines - always runs when matches change
  useEffect(() => {
    // Helper function to draw a connection line, defined inside useEffect to avoid conditional hook issues
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
      
      // Style the path or line
      path.setAttribute("stroke", "#22c55e");
      path.setAttribute("stroke-width", "2");
      path.setAttribute("stroke-dasharray", "4,2");
      path.setAttribute("fill", "none");
      
      svg.appendChild(path);
      document.body.appendChild(svg);
      
      // Store reference to the SVG element
      connectionLinesRef.current.push(svg);
    };

    // Clear existing lines first (always do this unconditionally)
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

  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

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
    const draggedIndex = parseInt(draggedItem.id.split('-')[1]);
    const targetIndex = parseInt(targetItem.id.split('-')[1]);
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
      // Select this item
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
        // Visual feedback for incorrect match
        setAnimatingItems([draggedItem.id, item.id]);
        
        setTimeout(() => {
          setAnimatingItems([]);
        }, 600);
      }
      
      setDraggedItem(null);
    }
  };

  const resetMatching = () => {
    // Clear all connection lines
    const existingLines = document.querySelectorAll('.connection-line');
    existingLines.forEach(line => line.remove());
    connectionLinesRef.current = [];
    
    setMatches({});
    setScore(0);
    setDefinitions(shuffleArray([...definitions]));
    setShowCelebration(false);
    
    // Optionally refresh content from parent
    if (onRefreshContent) {
      onRefreshContent();
    }
  };

  // Extract rendering functions outside the main render tree
  // This helps avoid conditional hook issues
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
              className={`p-4 rounded-lg transition-all duration-300 relative
                ${draggedItem?.id === term.id 
                  ? 'bg-blue-200 border-2 border-blue-500 ring-2 ring-blue-300'
                  : matches[term.id] !== undefined 
                    ? 'bg-green-100 border-2 border-green-500 cursor-default'
                    : 'bg-white hover:bg-blue-50 border-2 border-blue-100 hover:shadow-md cursor-pointer active:bg-blue-100'
                }
                ${animatingItems.includes(term.id) ? 'shake-animation' : ''}
              `}
            >
              <div className="flex items-center">
                <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2 flex-shrink-0 text-sm">
                  {String.fromCharCode(65 + parseInt(term.id.split('-')[1]))}
                </span>
                <span className="text-sm sm:text-base">{term.content}</span>
                
                {/* Visual indicator for matched items */}
                {matches[term.id] !== undefined && (
                  <span className="ml-auto text-green-500 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-blue-700 text-center mb-3">Definitions</h2>
        <div className="flex flex-col space-y-3">
          {definitions.map((def) => (
            <div
              key={def.id}
              id={def.id}
              onClick={() => handleTouchSelect(def)}
              className={`p-4 rounded-lg transition-all duration-300 relative
                ${draggedItem?.id === def.id 
                  ? 'bg-blue-200 border-2 border-blue-500 ring-2 ring-blue-300'
                  : matches[def.id] !== undefined 
                    ? 'bg-green-100 border-2 border-green-500 cursor-default'
                    : 'bg-white hover:bg-blue-50 border-2 border-blue-100 hover:shadow-md cursor-pointer active:bg-blue-100'
                }
                ${animatingItems.includes(def.id) ? 'shake-animation' : ''}
              `}
            >
              <div className="flex items-center">
                <span className="text-sm sm:text-base">{def.content}</span>
                
                {/* Visual indicator for matched items */}
                {matches[def.id] !== undefined && (
                  <span className="ml-auto text-green-500 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </div>
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
      <h2 className="text-xl font-semibold text-blue-700 text-center">Definitions</h2>
      
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
              className={`p-4 sm:p-6 rounded-lg transition-all duration-300 h-full relative
                ${matches[term.id] !== undefined 
                  ? 'bg-green-100 border-2 border-green-500 cursor-default'
                  : 'bg-white hover:bg-blue-50 border-2 border-blue-100 hover:shadow-md cursor-grab active:cursor-grabbing'
                }
                ${animatingItems.includes(term.id) ? 'shake-animation' : ''}
              `}
            >
              <div className="flex items-center h-full">
                <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0 text-sm">
                  {String.fromCharCode(65 + parseInt(term.id.split('-')[1]))}
                </span>
                <span className="text-sm sm:text-base">{term.content}</span>
                
                {/* Show different icons based on match status */}
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
              
              {/* Add a match indicator that shows the letter of the matching item */}
              {matches[term.id] !== undefined && (
                <div className="absolute right-0 top-0 transform translate-x-1/2 -translate-y-1/2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md">
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
              className={`p-4 sm:p-6 rounded-lg transition-all duration-300 h-full relative
                ${matches[def.id] !== undefined
                  ? 'bg-green-100 border-2 border-green-500 cursor-default'
                  : 'bg-white hover:bg-blue-50 border-2 border-blue-100 hover:shadow-md cursor-grab active:cursor-grabbing'
                }
                ${animatingItems.includes(def.id) ? 'shake-animation' : ''}
              `}
            >
              <div className="flex items-center h-full">
                <span className="text-sm sm:text-base">{def.content}</span>
                
                {/* Show different icons based on match status */}
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
              
              {/* Add a match indicator that shows the letter of the matching item */}
              {matches[def.id] !== undefined && (
                <div className="absolute left-0 top-0 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md">
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
  if (!content && !loading) return null;

  // Show loading state
  if (loading || !content) {
    return (
      <SlideWrapper className="bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 border-8 border-blue-100 rounded-full"></div>
              <div className="absolute inset-0 border-8 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-1/4 bg-blue-500 rounded-full animate-ping"></div>
            </div>
            <div className="text-xl sm:text-2xl font-semibold text-blue-800 animate-pulse">
              Loading Next Slide...
            </div>
            <div className="w-56 sm:w-64 h-2 bg-blue-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 transform animate-loading-bar"></div>
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
        <div className="text-center mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-blue-800 mb-2">Match the Concepts</h1>
          <p className="text-blue-600 mb-2">
            <span className="inline-block border-2 border-dashed border-blue-300 px-2 py-1 rounded mr-2 text-sm sm:text-base">
              {isMobile 
                ? "Tap to select and match items" 
                : "Drag a term and drop it on its matching definition"}
            </span>
          </p>
          <div className="flex justify-center items-center space-x-4 sm:space-x-8">
            <p className="text-blue-600 text-lg sm:text-xl">Score: {score} / {terms.length}</p>
            <button 
              onClick={resetMatching}
              className="bg-blue-100 text-blue-700 px-3 py-1 sm:px-4 sm:py-1 rounded-full hover:bg-blue-200 transition-colors text-sm sm:text-base"
            >
              Reset ↺
            </button>
          </div>
        </div>

        <div className="flex justify-between mb-4 sm:mb-6">
          {isMobile ? renderMobileContent() : renderDesktopContent()}
        </div>

        {showCelebration && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
            <div className="relative bg-white p-6 sm:p-8 rounded-xl text-center max-w-xs sm:max-w-md">
              <div className="celebration-confetti"></div>
              <div className="overflow-hidden">
                <div className="flex justify-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <span 
                      key={i} 
                      className="text-2xl sm:text-4xl mx-1"
                      style={{
                        animation: `bounce-in 0.6s ${i * 0.1}s forwards`,
                        opacity: 0,
                        transform: 'translateY(20px)'
                      }}
                    >
                      {['🎉', '🎊', '🏆', '🎯', '✨'][i]}
                    </span>
                  ))}
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-blue-800 mb-3 sm:mb-4">Congratulations!</h2>
                <p className="text-lg sm:text-xl text-blue-600 mb-4 sm:mb-6">You've matched all items correctly!</p>
                <div className="flex space-x-3 sm:space-x-4 justify-center">
                  <button
                    onClick={resetMatching}
                    className="bg-blue-100 text-blue-700 px-4 py-2 sm:px-6 sm:py-3 rounded-full hover:bg-blue-200 transition-colors text-sm sm:text-base"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={onNext}
                    className="bg-blue-600 text-white px-5 py-2 sm:px-8 sm:py-3 rounded-full hover:bg-blue-700 transition-colors text-sm sm:text-base"
                  >
                    Continue →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 sm:mt-8 flex justify-between">
          <button
            onClick={onPrevious}
            className="bg-white text-blue-600 px-4 py-2 sm:px-6 sm:py-2 rounded-full shadow-md
                     hover:bg-blue-50 transition-all duration-300 hover:scale-105 text-sm sm:text-base"
          >
            ← Previous
          </button>
          <button
            onClick={onNext}
            className="bg-blue-600 text-white px-4 py-2 sm:px-6 sm:py-2 rounded-full shadow-md
                     hover:bg-blue-700 transition-all duration-300 hover:scale-105 text-sm sm:text-base"
          >
            Next →
          </button>
        </div>
      </div>

      <style jsx>{`
        .shake-animation {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
          background-color: #fee2e2 !important;
          border-color: #ef4444 !important;
        }

        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }

        .match-success {
          animation: pulse 1s ease-in-out;
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); box-shadow: 0 0 15px rgba(34, 197, 94, 0.5); }
          100% { transform: scale(1); }
        }

        .drag-over {
          background-color: #dbeafe !important;
          transform: scale(1.03);
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }

        .drag-ghost {
          position: absolute;
          top: -1000px;
          background-color: #dbeafe;
          padding: 8px;
          border-radius: 8px;
          max-width: 200px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          opacity: 0.8;
        }

        .celebration-confetti {
          position: relative;
          height: 0;
        }

        .celebration-confetti::before,
        .celebration-confetti::after {
          content: '';
          position: absolute;
          top: -60px;
          left: -100px;
          width: 500px;
          height: 10px;
          z-index: 10;
        }

        .celebration-confetti::before {
          background: 
            radial-gradient(circle, #ff0000 2px, transparent 3px) 0 0 / 12px 12px,
            radial-gradient(circle, #00ff00 2px, transparent 3px) 6px 6px / 12px 12px;
          animation: confetti-fall-1 1.5s ease-out forwards;
        }
        
        .celebration-confetti::after {
          background: 
            radial-gradient(circle, #0000ff 2px, transparent 3px) 3px 3px / 12px 12px,
            radial-gradient(circle, #ffff00 2px, transparent 3px) 9px 9px / 12px 12px;
          animation: confetti-fall-2 1.8s ease-out forwards;
        }

        @keyframes confetti-fall-1 {
          0% { transform: translateY(-50px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(200px) rotate(10deg); opacity: 0; }
        }
        
        @keyframes confetti-fall-2 {
          0% { transform: translateY(-30px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(180px) rotate(-5deg); opacity: 0; }
        }

        /* Animation for loading bar */
        @keyframes loading-bar {
          0% { width: 0; }
          100% { width: 100%; }
        }

        .animate-loading-bar {
          animation: loading-bar 3s ease-in-out infinite;
        }
        
        /* Animation for celebration emojis */
        @keyframes bounce-in {
          0% { transform: translateY(20px); opacity: 0; }
          50% { transform: translateY(-10px); opacity: 1; }
          70% { transform: translateY(5px); opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </SlideWrapper>
  );
};

export default MatchingSlide;