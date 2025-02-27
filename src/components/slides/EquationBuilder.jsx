import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { MathJaxContext, MathJax } from 'better-react-mathjax';
import { generateSlideContent } from '../../services/openai';
import SlideWrapper from '../common/SlideWrapper';

const TOKEN_TYPE = 'TOKEN';

// Challenge generation through OpenAI API with improved handling
const generateChallenge = async (difficulty = 'medium') => {
  try {
    console.log(`Generating new ${difficulty} challenge...`);
    
    // Add timestamp and random seed for uniqueness
    const timestamp = new Date().getTime();
    const randomSeed = Math.floor(Math.random() * 10000);
    
    // Generate a challenge with more specific parameters
    const data = await generateSlideContent('EQUATION_CHALLENGE', {
      difficulty,
      subject: 'mathematics',
      timestamp,
      seed: randomSeed,
      forceNew: true,
      // More specific challenge types for better question generation
      challengeTypes: difficulty === 'easy' 
        ? ['basic_arithmetic', 'simple_equations', 'basic_algebra', 'number_patterns']
        : difficulty === 'medium'
          ? ['intermediate_algebra', 'basic_geometry', 'trigonometric_identities', 'basic_calculus', 'logarithms']
          : ['advanced_calculus', 'formal_logic', 'set_theory', 'complex_algebra', 'differential_equations']
    });
    
    console.log('Challenge generated:', data);
    
    // Validate the generated challenge structure
    if (!data || !data.question || !data.target) {
      throw new Error('Invalid challenge format returned');
    }
    
    return data;
  } catch (error) {
    console.error('Error generating challenge:', error);
    
    // More varied fallback challenges
    const fallbackChallenges = {
      easy: [
        { type: 'arithmetic', question: 'Create an expression that equals 25', target: '25' },
        { type: 'arithmetic', question: 'Form an equation using addition that equals 42', target: '42' },
        { type: 'basic_algebra', question: 'Create a linear equation with x where x equals 10', target: 'x = 10' },
        { type: 'number_patterns', question: 'Write the next number in the sequence: 2, 4, 8, 16, ...', target: '32' }
      ],
      medium: [
        { type: 'algebra', question: 'Create a quadratic equation with roots at x = 2 and x = -3', target: 'x² + x - 6 = 0' },
        { type: 'geometry', question: 'Write the formula for the area of a circle with radius r', target: 'πr²' },
        { type: 'trigonometry', question: 'Write an expression for sin²(x) + cos²(x)', target: '1' },
        { type: 'logarithms', question: 'Express log(xy) using separate logarithms', target: 'log(x) + log(y)' }
      ],
      hard: [
        { type: 'calculus', question: 'Write the derivative of sin(x²) with respect to x', target: '2x·cos(x²)' },
        { type: 'logic', question: 'Express: for all x, if x is positive then x² is positive', target: '∀x(x>0→x²>0)' },
        { type: 'sets', question: 'Write an expression for the set of all elements in A but not in B', target: 'A\\B' },
        { type: 'differential_equations', question: 'Write a first-order linear differential equation', target: 'dy/dx + P(x)y = Q(x)' }
      ]
    };
    
    // Select a random fallback challenge from the appropriate difficulty
    const fallbacks = fallbackChallenges[difficulty];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
};

// Function to validate expression using OpenAI
const validateWithOpenAI = async (userExpression, challenge) => {
  try {
    console.log('Validating with OpenAI:', userExpression, 'against target:', challenge.target);
    
    // Custom prompt for validation through OpenAI
    const validationResponse = await generateSlideContent('EQUATION_VALIDATION', {
      userExpression,
      target: challenge.target,
      question: challenge.question,
      type: challenge.type,
      seed: Math.floor(Math.random() * 10000) // Add randomness
    });
    
    console.log('Validation response:', validationResponse);
    
    // Return the validation result from OpenAI
    return validationResponse;
  } catch (error) {
    console.error('OpenAI validation error:', error);
    // Fallback to a basic validation result in case of API failure
    return {
      isValid: false,
      explanation: 'Could not validate your answer. Please try again.',
      hints: ['Check your expression syntax', 'Make sure all terms are correctly placed']
    };
  }
};

// Update the DraggableToken component with improved styling
const DraggableToken = ({ token, category }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: TOKEN_TYPE,
    item: { token },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  // Determine token style based on category - improved visual differentiation
  const getTokenStyle = () => {
    const styles = {
      numbers: "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200",
      variables: "bg-green-100 text-green-800 hover:bg-green-200 border-green-200",
      operators: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200",
      functions: "bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200 font-medium",
      specials: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-indigo-200",
      logic: "bg-red-100 text-red-800 hover:bg-red-200 border-red-200",
      sets: "bg-teal-100 text-teal-800 hover:bg-teal-200 border-teal-200"
    };
    
    const baseClasses = "flex items-center justify-center rounded-md m-1 cursor-move select-none transition-all shadow-sm border";
    const sizeClasses = category === 'functions' || category === 'specials' 
      ? "min-w-[2.5rem] h-10 px-2 text-sm" 
      : "w-10 h-10 text-base";
    
    return `${baseClasses} ${styles[category] || "bg-gray-100 text-gray-800 border-gray-200"} ${sizeClasses} ${isDragging ? 'opacity-50 scale-105' : 'opacity-100'}`;
  };

  return (
    <div
      ref={drag}
      className={getTokenStyle()}
    >
      {token}
    </div>
  );
};

const DroppedToken = ({ token, onRemove }) => {
  // Safely display tokens with special handling for operators
  const displayToken = token => {
    // Handle special cases that might cause rendering issues
    if (token === '^') return <span>^</span>;
    return token;
  };

  return (
    <div className="inline-flex items-center bg-blue-50 border border-blue-200 text-blue-800 rounded-md px-2 py-1 m-0.5 shadow-sm font-mono text-base relative group">
      {displayToken(token)}
      <button
        className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-red-500 text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm"
        onClick={onRemove}
      >
        ×
      </button>
    </div>
  );
};

// TokenCategory component with improved layout
const TokenCategory = ({ title, tokens, category }) => (
  <div className="mb-2">
    <h3 className="text-sm font-semibold mb-1 text-gray-700">{title}</h3>
    <div className="flex flex-wrap">
      {tokens.map((token, index) => (
        <DraggableToken key={index} token={token} category={category} />
      ))}
    </div>
  </div>
);

const DropZone = ({ onDrop, tokens, removeToken, challenge }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: TOKEN_TYPE,
    drop: (item) => onDrop(item.token),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  // Prepare the equation string for MathJax rendering, with special handling
  const prepareEquationForMathJax = (tokens) => {
    // Create a properly formatted LaTeX expression
    let result = '';
    let i = 0;
    let numberBuffer = '';
    
    while (i < tokens.length) {
      const token = tokens[i];
      
      // Check if it's a digit or part of a number
      if (/[0-9]/.test(token)) {
        // Start or continue a number buffer
        numberBuffer += token;
        i++;
        continue;
      } else if (numberBuffer) {
        // We've reached a non-digit after collecting digits
        result += numberBuffer + ' ';
        numberBuffer = '';
      }
      
      // Handle power (^) operator specially
      if (token === '^' && i < tokens.length - 1) {
        // Add the power operator and the next token as a superscript
        result += `^{${tokens[i+1]}}`;
        i += 2; // Skip the next token since we've processed it
      } else {
        // Handle other special symbols
        if (token === '×') result += '\\times ';
        else if (token === '÷') result += '\\div ';
        else if (token === 'π') result += '\\pi ';
        else if (token === 'θ') result += '\\theta ';
        else if (token === 'α') result += '\\alpha ';
        else if (token === 'β') result += '\\beta ';
        else if (token === 'i') result += 'i '; // Imaginary unit
        else result += `${token} `;
        
        i++;
      }
    }
    
    // Add any remaining digits from the buffer
    if (numberBuffer) {
      result += numberBuffer;
    }
    
    return result.trim();
  };

  const equationStr = prepareEquationForMathJax(tokens);

  return (
    <div className="mb-4">
      <div className="bg-blue-50 p-4 rounded-lg mb-3 shadow-sm border border-blue-100 flex justify-between items-start">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
          </svg>
          <div>
            <h3 className="text-base font-semibold text-blue-800">Challenge</h3>
            <p className="text-blue-700 text-lg font-medium">{challenge.question}</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-white rounded-md text-sm text-blue-600 border border-blue-100 shadow-sm">
          Type: <span className="font-semibold">{challenge.type.replace(/_/g, ' ')}</span>
        </div>
      </div>
      
      <div
        ref={drop}
        className={`
          min-h-[100px] 
          p-4 rounded-lg border-2
          transition-colors duration-300 
          ${isOver ? 'border-blue-500 bg-blue-50' : 'border-dashed border-blue-300 bg-white'}
          ${tokens.length === 0 && 'flex items-center justify-center'}
          shadow-sm mb-3
        `}
      >
        {tokens.length === 0 ? (
          <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-blue-300 mb-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <p className="text-blue-500 text-base">
              Drag and drop tokens to build your expression
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap">
            {tokens.map((token, index) => (
              <DroppedToken
                key={index}
                token={token}
                onRemove={() => removeToken(index)}
              />
            ))}
          </div>
        )}
      </div>

      {tokens.length > 0 && (
        <div className="mb-3">
          <div className="bg-white border border-blue-200 rounded-lg p-3 shadow-sm flex items-center justify-center h-14">
            <MathJax inline dynamic className="text-xl">{`\\(${equationStr}\\)`}</MathJax>
          </div>
        </div>
      )}
    </div>
  );
};

// Improved token panel with better layout for better usability
const TokenPanel = ({ activeTokens }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100 mb-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          {activeTokens.numbers && (
            <TokenCategory
              title="Numbers"
              tokens={activeTokens.numbers}
              category="numbers"
            />
          )}
          
          {activeTokens.variables && (
            <TokenCategory
              title="Variables"
              tokens={activeTokens.variables}
              category="variables"
            />
          )}
        </div>
        
        <div>
          {activeTokens.operators && (
            <TokenCategory
              title="Operators"
              tokens={activeTokens.operators}
              category="operators"
            />
          )}
          
          {activeTokens.functions && (
            <TokenCategory
              title="Functions"
              tokens={activeTokens.functions}
              category="functions"
            />
          )}
          
          <div className="grid grid-cols-3 gap-2">
            <div>
              {activeTokens.specials && (
                <TokenCategory
                  title="Special"
                  tokens={activeTokens.specials}
                  category="specials"
                />
              )}
            </div>
            <div>
              {activeTokens.logic && (
                <TokenCategory
                  title="Logic"
                  tokens={activeTokens.logic}
                  category="logic"
                />
              )}
            </div>
            <div>
              {activeTokens.sets && (
                <TokenCategory
                  title="Sets"
                  tokens={activeTokens.sets}
                  category="sets"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EquationBuilder = ({ courseData, onNext, onPrevious, isLast }) => {
  const [equationTokens, setEquationTokens] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [challenge, setChallenge] = useState(null);
  const [showHint, setShowHint] = useState(false);

  const tokenSets = {
    basic: {
      numbers: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'π'],
      operators: ['+', '-', '×', '÷', '=', '(', ')'],
    },
    advanced: {
      numbers: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'π', 'e'],
      variables: ['x', 'y', 'z', 'n', 'α', 'β', 'θ', 'i'],
      operators: ['+', '-', '×', '÷', '=', '≠', '≤', '≥', '<', '>', '(', ')'],
      functions: ['sin', 'cos', 'tan', 'log', '√', '∫', '∑', 'lim'],
      specials: ['^', 'dx', 'dy', 'd', '∂', '→', '⟹'],
      logic: ['∀', '∃', '→', '∧', '∨', '¬', '⊢', '⊥', '⊤'],
      sets: ['∈', '⊂', '⊆', '∪', '∩', '∅', '\\']
    }
  };

  useEffect(() => {
    const fetchNewChallenge = async () => {
      setLoading(true);
      try {
        const newChallenge = await generateChallenge(difficulty);
        setChallenge(newChallenge);
      } catch (error) {
        console.error('Failed to generate challenge:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNewChallenge();
  }, [difficulty]);

  // Function to add service to OpenAI.js
  const addValidationServiceToOpenAI = () => {
    // This would be added to the OpenAI.js file's getSlidePrompt function
    const validationPrompt = `case 'EQUATION_VALIDATION':
      return \`You are an expert mathematics tutor. Validate whether the user's mathematical expression is equivalent to or correctly solves the given challenge.
      
      Challenge question: \${context.question}
      Expected target: \${context.target}
      Challenge type: \${context.type}
      User's expression: \${context.userExpression}
      
      Return your evaluation in the following JSON format:
      {
        "isValid": boolean,       // true if the user's expression is valid/equivalent, false otherwise
        "explanation": string,    // detailed explanation of why the answer is valid or invalid
        "hints": [string],        // array of helpful hints if the answer is incorrect (empty array if answer is correct)
        "alternativeSolutions": [string]  // other valid approaches if the answer is correct (empty array if incorrect)
      }
      
      Consider all mathematically equivalent forms. Validate based on:
      1. Mathematical equivalence to the target
      2. Correctness of notation and syntax
      3. Appropriateness for the given challenge type
      
      Think deeply about mathematical equivalence. For example, "x^2 + 2x + 1", "(x+1)^2", and "x^2 + 2x + 1 = 0" are all different expressions.
      
      When validating, remember to properly interpret power operations (using the ^ symbol) and ensure exponents are correctly processed.
      For complex number problems, 'i' represents the imaginary unit where i² = -1.
      
      Evaluate strictly but fairly. If the user's expression is close but has minor errors, explain precisely what is wrong.
      \`;`;
    
    console.log("Add this case to the getSlidePrompt function in your OpenAI service:", validationPrompt);
  };

  // Call this once to log the additional service needed
  useEffect(() => {
    addValidationServiceToOpenAI();
  }, []);

  const handleDrop = (token) => {
    setEquationTokens(prev => [...prev, token]);
    setResult(null);
  };

  const removeToken = (index) => {
    setEquationTokens(prev => {
      const newTokens = [...prev];
      newTokens.splice(index, 1);
      return newTokens;
    });
    setResult(null);
  };

  const resetEquation = () => {
    setEquationTokens([]);
    setResult(null);
    setShowHint(false);
  };

  const validateExpression = async () => {
    setLoading(true);
    try {
      // Format the equation properly, handling exponents and combining digits
      let processedTokens = [];
      let i = 0;
      let numberBuffer = '';
      
      while (i < equationTokens.length) {
        const token = equationTokens[i];
        
        // Check if it's a digit or part of a number
        if (/[0-9]/.test(token)) {
          // Start or continue a number buffer
          numberBuffer += token;
          i++;
          continue;
        } else if (numberBuffer) {
          // We've reached a non-digit after collecting digits
          processedTokens.push(numberBuffer);
          numberBuffer = '';
        }
        
        if (token === '^' && i > 0 && i < equationTokens.length - 1) {
          // Format power notation properly for validation
          processedTokens[processedTokens.length - 1] += `^${equationTokens[i+1]}`;
          i += 2; // Skip the next token as we've incorporated it
        } else {
          processedTokens.push(token);
          i++;
        }
      }
      
      // Add any remaining digits from the buffer
      if (numberBuffer) {
        processedTokens.push(numberBuffer);
      }
      
      const userEquation = processedTokens.join(' ');
      
      // Basic validation - check if equation is empty
      if (equationTokens.length === 0) {
        setResult({
          isValid: false,
          explanation: 'Please build an expression before checking your answer.',
          hints: []
        });
        setLoading(false);
        return;
      }
      
      console.log('Sending for validation:', userEquation);
      
      // Use OpenAI to validate the expression
      const validationResult = await validateWithOpenAI(userEquation, challenge);
      
      setResult(validationResult);
    } catch (error) {
      console.error('Validation error:', error);
      
      // Show a helpful error message
      setResult({
        isValid: false,
        explanation: `Error validating your expression. Please try again. ${error.message || 'Unknown error'}`,
        hints: ['Check your expression syntax', 'Try a different approach']
      });
    } finally {
      setLoading(false);
    }
  };

  const getActiveTokens = () => {
    if (difficulty === 'easy') return tokenSets.basic;
    return tokenSets.advanced;
  };

  const toggleHint = () => {
    setShowHint(prev => !prev);
  };

  const newChallenge = async () => {
    setLoading(true);
    resetEquation();
    
    try {
      const newChallenge = await generateChallenge(difficulty);
      setChallenge(newChallenge);
    } catch (error) {
      console.error('Failed to generate new challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  // Redesigned layout with solution area at the bottom
  return (
    <DndProvider backend={HTML5Backend}>
      <MathJaxContext>
        <SlideWrapper className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="w-full h-full flex flex-col p-4">
            {/* Header with title and difficulty controls */}
            <header className="flex justify-between items-center mb-4 pb-2 border-b border-blue-100">
              <div>
                <h1 className="text-xl font-bold text-blue-800">
                  {courseData?.topic || 'Equation Builder Challenge'}
                </h1>
                <p className="text-sm text-blue-600">Master mathematical expressions with interactive challenges</p>
              </div>
              
              <div className="flex gap-2">
                {['easy', 'medium', 'hard'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`
                      px-4 py-2 rounded-md text-sm font-semibold transition-colors
                      ${difficulty === level 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'bg-white text-blue-600 hover:bg-blue-50 border border-blue-200'}
                    `}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </header>
            
            {/* Main content area */}
            <div className="flex-grow flex flex-col overflow-auto">
              {loading && !challenge ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-blue-600 text-lg">Loading challenge...</span>
                </div>
              ) : challenge ? (
                <>
                  {/* Challenge drop zone */}
                  <DropZone
                    tokens={equationTokens}
                    onDrop={handleDrop}
                    removeToken={removeToken}
                    challenge={challenge}
                  />
                  
                  {/* Token panel */}
                  <TokenPanel activeTokens={getActiveTokens()} />
                  
                  {/* Action buttons */}
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    <button
                      onClick={validateExpression}
                      className="
                        col-span-1
                        bg-blue-600 text-white px-4 py-2 rounded-lg
                        hover:bg-blue-700 transition-colors
                        shadow-sm font-semibold text-base flex items-center justify-center
                      "
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
                          Checking...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Check Answer
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={resetEquation}
                      className="
                        col-span-1
                        bg-white text-blue-600 px-4 py-2 rounded-lg
                        hover:bg-blue-50 transition-colors
                        shadow-sm font-semibold text-base flex items-center justify-center
                        border border-blue-200
                      "
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                      Reset
                    </button>
                    
                    <button
                      onClick={newChallenge}
                      className="
                        col-span-1
                        bg-green-500 text-white px-4 py-2 rounded-lg
                        hover:bg-green-600 transition-colors
                        shadow-sm font-semibold text-base flex items-center justify-center
                      "
                      disabled={loading}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      New Challenge
                    </button>
                    
                    {challenge && challenge.target && (
                      <button
                        onClick={toggleHint}
                        className="
                          col-span-1
                          bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg
                          hover:bg-yellow-500 transition-colors
                          shadow-sm font-semibold text-base flex items-center justify-center
                        "
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1v-3a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {showHint ? 'Hide Hint' : 'Show Hint'}
                      </button>
                    )}
                  </div>
                  
                  {/* Results or hint display area at the bottom */}
                  {(result || showHint) && (
                    <div className={`rounded-lg shadow-md border mb-4 ${result ? 'bg-white' : 'bg-yellow-50 border-yellow-200'}`}>
                      {showHint && !result && (
                        <div className="p-4">
                          <h3 className="text-base font-semibold text-yellow-800 mb-2 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                            </svg>
                            Hint
                          </h3>
                          <div className="bg-white p-3 rounded-md border border-yellow-100">
                            <p className="text-yellow-800 text-base">Try constructing:</p>
                            <div className="mt-1 flex justify-center">
                              <MathJax inline dynamic className="text-lg font-medium">
                                {`\\(${challenge.target}\\)`}
                              </MathJax>
                            </div>
                          </div>
                        </div>
                      )}

                      {result && (
                        <div className="p-4">
                          <h3 className="text-base font-semibold mb-2 text-blue-800 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1v-3a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Result
                          </h3>
                          
                          <div className="space-y-3">
                            {result.isValid ? (
                              <div className="bg-green-50 border border-green-200 rounded-md p-3 text-green-800 flex items-center">
                                <svg className="w-6 h-6 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <span className="font-semibold text-base">Correct! Your solution works perfectly.</span>
                              </div>
                            ) : (
                              <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-800 flex items-center">
                                <svg className="w-6 h-6 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <span className="font-semibold text-base">Not quite right yet. Keep trying!</span>
                              </div>
                            )}
                            
                            {result.explanation && (
                              <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                                <p className="text-blue-800 text-base">
                                  {result.explanation
                                    .replace(/The user's/g, "Your")
                                    .replace(/the user's/g, "your")
                                    .replace(/The user /g, "You ")
                                    .replace(/the user /g, "you ")
                                    .replace(/user/g, "you")}
                                </p>
                              </div>
                            )}
                            
                            {result.hints && result.hints.length > 0 && (
                              <div className="mt-2">
                                <h4 className="text-sm font-semibold text-gray-700 mb-1">Helpful hints:</h4>
                                <ul className="space-y-1 pl-5 list-disc">
                                  {result.hints.map((hint, index) => (
                                    <li key={index} className="text-blue-700 text-base">
                                      {hint
                                        .replace(/The user should/g, "You should")
                                        .replace(/the user should/g, "you should")}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {result.alternativeSolutions && result.alternativeSolutions.length > 0 && (
                              <div className="mt-2">
                                <h4 className="text-sm font-semibold text-gray-700 mb-1">Alternative approaches:</h4>
                                <ul className="space-y-1 pl-5 list-disc">
                                  {result.alternativeSolutions.map((solution, index) => (
                                    <li key={index} className="text-blue-700 text-base">
                                      {solution}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full bg-red-50 rounded-lg border border-red-200 p-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-red-700 text-lg font-medium">Failed to load challenge. Please try again.</span>
                </div>
              )}
            </div>
            
            {/* Bottom navigation */}
            <div className="mt-auto flex justify-between pt-2 border-t border-blue-100">
              <button
                onClick={onPrevious}
                className="
                  bg-white text-blue-600 px-6 py-3 rounded-lg shadow-sm
                  hover:bg-blue-50 transition-colors font-semibold text-base
                  border border-blue-200 flex items-center
                "
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Previous
              </button>
              
              {isLast ? (
                <button
                  onClick={() => alert('Course completed!')}
                  className="
                    bg-gradient-to-r from-green-500 to-emerald-600 text-white 
                    px-6 py-3 rounded-lg shadow-sm font-semibold text-base
                    hover:from-green-600 hover:to-emerald-700 transition-colors
                    flex items-center
                  "
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Complete Course
                </button>
              ) : (
                <button
                  onClick={onNext}
                  className="
                    bg-gradient-to-r from-blue-500 to-indigo-600 text-white 
                    px-6 py-3 rounded-lg shadow-sm font-semibold text-base
                    hover:from-blue-600 hover:to-indigo-700 transition-colors
                    flex items-center
                  "
                >
                  Next
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </SlideWrapper>
      </MathJaxContext>
    </DndProvider>
  );
};

export default EquationBuilder;