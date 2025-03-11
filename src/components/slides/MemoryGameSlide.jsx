import React, { useState, useEffect } from 'react';
import SlideWrapper from '../common/SlideWrapper';
import { motion, AnimatePresence } from 'framer-motion';

const MemoryGameSlide = ({ 
  courseData, 
  content, 
  onNext, 
  onPrevious, 
  onRefreshContent, 
  isRefreshing, 
  isFirst, 
  isLast 
}) => {
  // Set 16:9 aspect ratio while preserving all functionality
  const containerStyle = {
    aspectRatio: '16/9',
    maxHeight: '100vh',
    margin: '0 auto',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  };

  const [cards, setCards] = useState([]);
  const [flippedIndexes, setFlippedIndexes] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const [animatingGame, setAnimatingGame] = useState(false);
  
  // Simple icon alternatives
  const icons = {
    book: "📚",
    quiz: "☑️",
    done: "✅",
    next: "→",
    prev: "←",
    refresh: "🔄",
    correct: "✓",
    incorrect: "✗",
    target: "🎯",
    celebration: "🎉",
    trophy: "🏆",
    question: "❓",
    list: "📋",
    brain: "🧠",
    cards: "🃏",
    time: "⏱️",
    moves: "👆",
    match: "🔍",
    memory: "💭",
    magic: "✨",
    play: "▶️",
    pause: "⏸️",
    restart: "🔄"
  };
  
  // Handle content data and initialize the game
  useEffect(() => {
    if (content && content.cardPairs) {
      initializeGame();
    }
  }, [content]);
  
  // Timer effect
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);
  
  // Check for game completion
  useEffect(() => {
    // Define endGame inside the useEffect
    const endGame = () => {
      setGameComplete(true);
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    };

    if (content && content.cardPairs && matchedPairs.length === content.cardPairs.length && matchedPairs.length > 0) {
      endGame();
    }
  }, [matchedPairs, content, timerInterval]);
  
  // Logic to handle flipping cards and matching
  useEffect(() => {
    if (flippedIndexes.length === 2) {
      const [firstIndex, secondIndex] = flippedIndexes;
      
      // Only increment moves ONCE when two cards are flipped
      setMoves(prevMoves => prevMoves + 1);
      
      if (cards[firstIndex].pairId === cards[secondIndex].pairId) {
        // Match found
        setMatchedPairs(prevPairs => [...prevPairs, cards[firstIndex].pairId]);
        
        // Reset flipped cards after a short delay
        setTimeout(() => {
          setFlippedIndexes([]);
        }, 1000);
      } else {
        // No match
        setTimeout(() => {
          setFlippedIndexes([]);
        }, 1500);
      }
    }
  }, [flippedIndexes, cards]);
  
  // Normalize card pairs data structure if needed
  const getCardPairs = () => {
    if (!content) return [];
    
    if (content.cardPairs && Array.isArray(content.cardPairs)) {
      return content.cardPairs;
    } else if (content.pairs && Array.isArray(content.pairs)) {
      // Transform pairs to cardPairs structure
      return content.pairs.map(pair => ({
        term: pair.left || pair.term,
        definition: pair.right || pair.definition
      }));
    }
    
    console.error("Unexpected memory game content structure:", content);
    return [];
  };
  
  const cardPairs = getCardPairs();
  
  // Initialize the game with shuffled cards
  const initializeGame = () => {
    if (!cardPairs || cardPairs.length === 0) return;
    
    // Create pairs of cards
    const gameCards = cardPairs.flatMap((pair, index) => [
      { id: `card-${index}-a`, content: pair.term, pairId: index, type: 'term' },
      { id: `card-${index}-b`, content: pair.definition, pairId: index, type: 'definition' }
    ]);
    
    // Shuffle cards
    const shuffled = [...gameCards].sort(() => Math.random() - 0.5);
    
    setCards(shuffled);
    setFlippedIndexes([]);
    setMatchedPairs([]);
    setMoves(0);
    setGameComplete(false);
    setTimer(0);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  };
  
  // Start the game
  const startGame = () => {
    setGameStarted(true);
    
    // Start timer
    const interval = setInterval(() => {
      setTimer(prevTimer => prevTimer + 1);
    }, 1000);
    setTimerInterval(interval);
  };
  
  // End the game
  const endGame = () => {
    setGameComplete(true);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  };
  
  // Handle card click
  const handleCardClick = (index) => {
    // Don't allow clicking if game not started, already complete, or two cards already flipped
    if (!gameStarted || gameComplete || flippedIndexes.length === 2) {
      return;
    }
    
    // Don't allow clicking already matched or flipped cards
    if (
      matchedPairs.includes(cards[index].pairId) ||
      flippedIndexes.includes(index)
    ) {
      return;
    }
    
    // Flip the card
    setFlippedIndexes([...flippedIndexes, index]);
  };
  
  // Reset the game
  const handleReset = () => {
    initializeGame();
    setGameStarted(false);
    setGameComplete(false);
  };
  
  // Generate new memory game
  const handleGenerateNewGame = () => {
    setAnimatingGame(true);
    setTimeout(() => {
      onRefreshContent && onRefreshContent({ type: 'MEMORY' });
      setCards([]);
      setFlippedIndexes([]);
      setMatchedPairs([]);
      setMoves(0);
      setGameStarted(false);
      setGameComplete(false);
      setTimer(0);
      setAnimatingGame(false);
    }, 600);
  };
  
  // Format time display (mm:ss)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 100, 
        damping: 15 
      }
    },
    exit: { 
      opacity: 0, 
      y: -50,
      transition: { 
        ease: "easeInOut", 
        duration: 0.3 
      }
    }
  };

  const buttonVariants = {
    hover: { 
      scale: 1.05,
      boxShadow: "0px 6px 15px rgba(0, 0, 0, 0.1)",
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 10 
      }
    },
    tap: { scale: 0.95 }
  };
  
  // Enhanced animation variants for memory cards
  const memoryCardVariants = {
    initial: { 
      rotateY: 0,
      boxShadow: "0px 3px 5px rgba(0, 0, 0, 0.1)"
    },
    flipped: { 
      rotateY: 180,
      boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.1)",
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 15 
      }
    },
    matched: {
      scale: 1.03,
      rotateY: 180,
      boxShadow: "0px 0px 20px rgba(0, 128, 0, 0.5)",
      transition: { 
        duration: 0.5,
        type: "spring",
        stiffness: 300,
        damping: 15
      }
    }
  };

  // If no content is available yet
  if (!content || !cardPairs || cardPairs.length === 0) {
    return (
      <SlideWrapper className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
        <div style={containerStyle} className="w-full flex items-center justify-center">
          <div className="flex flex-col items-center">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-6"
            ></motion.div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-blue-600 font-medium text-lg"
            >
              {isRefreshing ? "Refreshing memory game content..." : "Preparing your memory challenge..."}
            </motion.p>
          </div>
        </div>
      </SlideWrapper>
    );
  }
  
  // Display game completion screen
  if (gameComplete) {
    // Calculate score based on number of moves and time
    const perfectMoves = cardPairs.length * 2; // Minimum number of moves possible
    const moveRatio = Math.max(0, 1 - ((moves - perfectMoves) / (cardPairs.length * 4)));
    const timePerMatch = timer / cardPairs.length;
    const timeRatio = Math.max(0, 1 - (timePerMatch / 15)); // Assume 15 seconds per match is baseline
    
    const scorePercentage = Math.round((moveRatio * 0.7 + timeRatio * 0.3) * 100);
    
    return (
      <SlideWrapper className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
        <div style={containerStyle} className="w-full flex flex-col p-6 md:p-8 relative">
          {/* Background decorative elements */}
          <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-700 bg-clip-text text-transparent mb-6 text-center"
          >
            Memory Game Complete!
          </motion.h1>
          
          <div className="flex-1 flex items-center justify-center overflow-y-auto">
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="w-full max-w-3xl mx-auto"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Results summary card */}
                <div className="bg-white rounded-xl shadow-md p-6 md:p-8 border border-indigo-100 text-center">
                  <div className="text-6xl mb-6">
                    {scorePercentage >= 90 ? icons.celebration : 
                     scorePercentage >= 70 ? icons.trophy : icons.brain}
                  </div>
                  
                  <h2 className="text-2xl font-bold text-blue-700 mb-4">Your Results</h2>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                      <div className="text-blue-600 text-xl mb-1">{icons.time}</div>
                      <div className="text-2xl font-bold text-blue-700">{formatTime(timer)}</div>
                      <div className="text-sm text-blue-500">Total Time</div>
                    </div>
                    
                    <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                      <div className="text-indigo-600 text-xl mb-1">{icons.moves}</div>
                      <div className="text-2xl font-bold text-indigo-700">{moves}</div>
                      <div className="text-sm text-indigo-500">Total Moves</div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 mb-6">
                    <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-1">
                      {scorePercentage}%
                    </div>
                    <div className="text-sm text-blue-700">Memory Score</div>
                    <div className="w-full bg-white rounded-full h-2.5 mt-2">
                      <div 
                        className={`h-2.5 rounded-full ${
                          scorePercentage >= 90 ? 'bg-green-500' : 
                          scorePercentage >= 70 ? 'bg-blue-500' : 
                          scorePercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${scorePercentage}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
                    {scorePercentage >= 90 ? (
                      <p className="text-green-600 font-medium">Impressive memory skills! You're a natural!</p>
                    ) : scorePercentage >= 70 ? (
                      <p className="text-blue-600 font-medium">Great job! You have excellent recall abilities!</p>
                    ) : scorePercentage >= 50 ? (
                      <p className="text-yellow-600 font-medium">Good effort! Keep practicing to improve your memory.</p>
                    ) : (
                      <p className="text-red-600 font-medium">Memory games take practice. Keep trying!</p>
                    )}
                  </div>
                  
                  <div className="flex flex-col space-y-3">
                    <motion.button
                      whileHover="hover"
                      whileTap="tap"
                      variants={buttonVariants}
                      onClick={handleReset}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg shadow-md font-medium"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <span>{icons.play}</span>
                        <span>Play Again</span>
                      </div>
                    </motion.button>
                    
                    <motion.button
                      whileHover="hover"
                      whileTap="tap"
                      variants={buttonVariants}
                      onClick={handleGenerateNewGame}
                      className="bg-white text-indigo-600 border border-indigo-200 px-6 py-3 rounded-lg shadow-md font-medium"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <span>{icons.refresh}</span>
                        <span>New Card Set</span>
                      </div>
                    </motion.button>
                  </div>
                </div>
                
                {/* Game stats card */}
                <div className="bg-white rounded-xl shadow-md p-6 md:p-8 border border-indigo-100">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent mb-6 flex items-center">
                    <span className="mr-2">{icons.brain}</span>
                    <span>Memory Skills Analysis</span>
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                          <span>{icons.match}</span>
                        </div>
                        <h3 className="font-semibold text-blue-700">Pattern Recognition</h3>
                      </div>
                      <div className="ml-11">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-blue-600">Performance</span>
                          <span className="text-xs font-medium text-blue-700">
                            {scorePercentage >= 80 ? 'Excellent' : 
                             scorePercentage >= 60 ? 'Good' : 
                             scorePercentage >= 40 ? 'Average' : 'Needs Practice'}
                          </span>
                        </div>
                        <div className="w-full bg-white rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${scorePercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                          <span>{icons.time}</span>
                        </div>
                        <h3 className="font-semibold text-blue-700">Processing Speed</h3>
                      </div>
                      <div className="ml-11">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-blue-600">Performance</span>
                          <span className="text-xs font-medium text-blue-700">
                            {timeRatio * 100 >= 80 ? 'Excellent' : 
                             timeRatio * 100 >= 60 ? 'Good' : 
                             timeRatio * 100 >= 40 ? 'Average' : 'Needs Practice'}
                          </span>
                        </div>
                        <div className="w-full bg-white rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${timeRatio * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                          <span>{icons.moves}</span>
                        </div>
                        <h3 className="font-semibold text-blue-700">Efficiency</h3>
                      </div>
                      <div className="ml-11">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-blue-600">Performance</span>
                          <span className="text-xs font-medium text-blue-700">
                            {moveRatio * 100 >= 80 ? 'Excellent' : 
                             moveRatio * 100 >= 60 ? 'Good' : 
                             moveRatio * 100 >= 40 ? 'Average' : 'Needs Practice'}
                          </span>
                        </div>
                        <div className="w-full bg-white rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${moveRatio * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl p-4 text-center">
                      <p className="text-indigo-700 italic">
                        "{getMemoryTip(scorePercentage)}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <motion.button
              whileHover="hover"
              whileTap="tap"
              variants={buttonVariants}
              onClick={onPrevious}
              disabled={isFirst}
              className="bg-white text-indigo-600 px-6 py-3 rounded-full shadow-md
                       hover:bg-indigo-50 transition-all border border-indigo-100 disabled:opacity-50"
            >
              <div className="flex items-center space-x-2">
                <span>{icons.prev}</span>
                <span>Previous</span>
              </div>
            </motion.button>
            
            <motion.button
              whileHover="hover"
              whileTap="tap"
              variants={buttonVariants}
              onClick={onNext}
              disabled={isLast}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-full shadow-md
                       transition-all disabled:opacity-50"
            >
              <div className="flex items-center space-x-2">
                <span>Next</span>
                <span>{icons.next}</span>
              </div>
            </motion.button>
          </div>
        </div>
      </SlideWrapper>
    );
  }
  
  // Show start screen when game is not yet started
  if (!gameStarted) {
    return (
      <SlideWrapper className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
        <div style={containerStyle} className="w-full flex flex-col p-6 md:p-8 relative">
          {/* Background decorative elements */}
          <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-700 bg-clip-text text-transparent mb-6 text-center"
          >
            {content.title || "Memory Matching Game"}
          </motion.h1>
          
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="w-full max-w-2xl"
            >
              <div className="bg-white rounded-xl shadow-md p-6 md:p-8 border border-indigo-100 text-center">
                <div className="text-7xl mb-6">{icons.brain}</div>
                <h2 className="text-2xl md:text-3xl font-bold text-blue-700 mb-4">
                  Memory Challenge
                </h2>
                <p className="text-blue-600 mb-6 text-lg">{content.description || "Match each term with its correct definition to reinforce your learning."}</p>
                
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100 mb-8">
                  <h3 className="font-bold text-blue-700 mb-3 text-xl">How to Play</h3>
                  <ul className="text-left space-y-3">
                    <motion.li 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-start"
                    >
                      <span className="flex-shrink-0 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full w-6 h-6 mr-3 mt-0.5">
                        1
                      </span>
                      <span>Click cards to flip them over and reveal what's underneath</span>
                    </motion.li>
                    <motion.li 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="flex items-start"
                    >
                      <span className="flex-shrink-0 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full w-6 h-6 mr-3 mt-0.5">
                        2
                      </span>
                      <span>Try to find matching pairs of cards (terms with their definitions)</span>
                    </motion.li>
                    <motion.li 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex items-start"
                    >
                      <span className="flex-shrink-0 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full w-6 h-6 mr-3 mt-0.5">
                        3
                      </span>
                      <span>Match all pairs with the fewest moves to get the highest score</span>
                    </motion.li>
                  </ul>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-blue-700 font-medium">
                    {cardPairs.length} pairs to match
                  </div>
                  <div className="text-blue-700 font-medium">
                    Difficulty: {cardPairs.length <= 4 ? 'Easy' : cardPairs.length <= 6 ? 'Medium' : 'Hard'}
                  </div>
                </div>
                
                <motion.button
                  whileHover="hover"
                  whileTap="tap"
                  variants={buttonVariants}
                  onClick={startGame}
                  className="mt-8 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-lg shadow-lg text-xl font-bold"
                >
                  <div className="flex items-center justify-center space-x-3">
                    <span>{icons.play}</span>
                    <span>Start Game</span>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <motion.button
              whileHover="hover"
              whileTap="tap"
              variants={buttonVariants}
              onClick={onPrevious}
              disabled={isFirst}
              className="bg-white text-indigo-600 px-6 py-3 rounded-full shadow-md
                       hover:bg-indigo-50 transition-all border border-indigo-100 disabled:opacity-50"
            >
              <div className="flex items-center space-x-2">
                <span>{icons.prev}</span>
                <span>Previous</span>
              </div>
            </motion.button>
            
            <motion.button
              whileHover="hover"
              whileTap="tap"
              variants={buttonVariants}
              onClick={handleGenerateNewGame}
              className="bg-white text-indigo-600 px-6 py-3 rounded-full shadow-md border border-indigo-200
                         hover:bg-indigo-50 transition-all"
            >
              <div className="flex items-center space-x-2">
                <span>{icons.refresh}</span>
                <span>New Cards</span>
              </div>
              </motion.button>
            
            <motion.button
              whileHover="hover"
              whileTap="tap"
              variants={buttonVariants}
              onClick={onNext}
              disabled={isLast}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-full shadow-md
                       transition-all disabled:opacity-50"
            >
              <div className="flex items-center space-x-2">
                <span>Next</span>
                <span>{icons.next}</span>
              </div>
            </motion.button>
          </div>
        </div>
      </SlideWrapper>
    );
  }
  
  // Main game interface while playing
  return (
    <SlideWrapper className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
      <div style={containerStyle} className="w-full flex flex-col p-6 md:p-8 relative">
        {/* Background decorative elements */}
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Refreshing overlay */}
        {isRefreshing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 backdrop-blur-sm z-10"
          >
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-b-transparent border-blue-600"></div>
              <p className="mt-4 text-blue-600 font-medium">Loading new memory game...</p>
            </div>
          </motion.div>
        )}
        
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-700 bg-clip-text text-transparent mb-6 text-center"
        >
          {content.title || "Memory Matching Game"}
        </motion.h1>
        
        {/* Game stats bar */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-indigo-100">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm text-blue-600 mb-1">Time</div>
              <div className="text-xl font-bold text-blue-700">{formatTime(timer)}</div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-blue-600 mb-1">Moves</div>
              <div className="text-xl font-bold text-blue-700">{moves}</div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-blue-600 mb-1">Matched</div>
              <div className="text-xl font-bold text-blue-700">{matchedPairs.length} / {cardPairs.length}</div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {/* Memory card grid */}
          <div className={`grid ${getGridColumns(cards.length)} gap-3 sm:gap-4 max-w-4xl mx-auto ${animatingGame ? 'animate-pulse' : ''}`}>
            <AnimatePresence>
              {cards.map((card, index) => {
                const isFlipped = flippedIndexes.includes(index);
                const isMatched = matchedPairs.includes(card.pairId);
                
                return (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1,
                      transition: { 
                        delay: index * 0.05,
                        duration: 0.3 
                      }
                    }}
                    className="aspect-square relative"
                    onClick={() => handleCardClick(index)}
                  >
                    <motion.div
                      className="w-full h-full rounded-lg relative preserve-3d cursor-pointer"
                      variants={memoryCardVariants}
                      initial="initial"
                      animate={isMatched ? "matched" : isFlipped ? "flipped" : "initial"}
                    >
                      {/* Card front (hidden) */}
                      <div className="absolute inset-0 backface-hidden">
                        <div className="w-full h-full rounded-lg shadow-md overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center p-2 border-2 border-white">
                          <div className="text-white text-3xl">{icons.magic}</div>
                        </div>
                      </div>
                      
                      {/* Card back (content) */}
                      <div className="absolute inset-0 backface-hidden rotate-y-180">
                        <div className={`w-full h-full rounded-lg shadow-md overflow-hidden p-2 flex items-center justify-center text-center ${
                          isMatched 
                            ? (card.type === 'term' 
                                ? 'bg-green-100 text-green-800 border-2 border-green-400' 
                                : 'bg-green-100 text-green-800 border-2 border-green-400')
                            : (card.type === 'term' 
                                ? 'bg-blue-100 text-blue-800 border-2 border-blue-300' 
                                : 'bg-indigo-100 text-indigo-800 border-2 border-indigo-300')
                        }`}>
                          <div className={`text-sm font-medium overflow-auto ${isMatched ? 'text-green-800' : ''}`}>
                            {card.content}
                            {isMatched && (
                              <div className="text-green-600 text-lg mt-1">
                                {icons.correct}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Game controls */}
        <div className="mt-6 flex justify-center space-x-4">
          <motion.button
            whileHover="hover"
            whileTap="tap"
            variants={buttonVariants}
            onClick={handleReset}
            className="px-4 py-2 bg-white text-indigo-600 rounded-lg shadow-md border border-indigo-200"
          >
            <div className="flex items-center space-x-2">
              <span>{icons.restart}</span>
              <span>Restart</span>
            </div>
          </motion.button>
          
          <motion.button
            whileHover="hover"
            whileTap="tap"
            variants={buttonVariants}
            onClick={handleGenerateNewGame}
            className="px-4 py-2 bg-white text-indigo-600 rounded-lg shadow-md border border-indigo-200"
          >
            <div className="flex items-center space-x-2">
              <span>{icons.refresh}</span>
              <span>New Cards</span>
            </div>
          </motion.button>
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <motion.button
            whileHover="hover"
            whileTap="tap"
            variants={buttonVariants}
            onClick={onPrevious}
            disabled={isFirst}
            className="bg-white text-indigo-600 px-6 py-3 rounded-full shadow-md
                     hover:bg-indigo-50 transition-all border border-indigo-100 disabled:opacity-50"
          >
            <div className="flex items-center space-x-2">
              <span>{icons.prev}</span>
              <span>Previous</span>
            </div>
          </motion.button>
          
          <motion.button
            whileHover="hover"
            whileTap="tap"
            variants={buttonVariants}
            onClick={onNext}
            disabled={isLast}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-full shadow-md
                     transition-all disabled:opacity-50"
          >
            <div className="flex items-center space-x-2">
              <span>Next</span>
              <span>{icons.next}</span>
            </div>
          </motion.button>
        </div>
      </div>
    </SlideWrapper>
  );
};

// Helper function to get appropriate grid columns based on number of cards
const getGridColumns = (cardCount) => {
  if (cardCount <= 8) return 'grid-cols-2 sm:grid-cols-4';
  if (cardCount <= 12) return 'grid-cols-3 sm:grid-cols-4';
  if (cardCount <= 16) return 'grid-cols-4';
  return 'grid-cols-4 sm:grid-cols-5 md:grid-cols-6';
};

// Helper function for memory tips based on score
const getMemoryTip = (score) => {
  const tips = [
    "Try associating terms with visual images to improve recall.",
    "Focus on a few cards at a time rather than trying to remember all at once.",
    "Say the card content out loud when you see it to engage multiple senses.",
    "Look for patterns or create stories between related terms.",
    "Take brief breaks if you feel overwhelmed. A fresh perspective helps.",
    "Group similar cards mentally to create organizational patterns.",
    "Use the positions of cards as memory cues.",
    "Pay attention to which cards other players flip (in multiplayer memory games)."
  ];
  
  // Return a tip based on score range
  if (score >= 90) return tips[0];
  if (score >= 75) return tips[1];
  if (score >= 60) return tips[2];
  if (score >= 45) return tips[3];
  if (score >= 30) return tips[4];
  if (score >= 15) return tips[5];
  return tips[6];
};

export default MemoryGameSlide;