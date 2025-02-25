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

// Update the DraggableToken component to be more compact
const DraggableToken = ({ token, category }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: TOKEN_TYPE,
    item: { token },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  // Determine token size and styling based on token type
  const getTokenStyle = () => {
    if (category === 'numbers') {
      return 'w-7 h-7 bg-blue-100 text-blue-800';
    } else if (category === 'variables') {
      return 'w-7 h-7 bg-green-100 text-green-800';
    } else if (category === 'operators') {
      return 'w-7 h-7 bg-yellow-100 text-yellow-800';
    } else if (category === 'functions') {
      return 'min-w-[2rem] h-7 px-1 bg-purple-100 text-purple-800';
    } else if (category === 'specials') {
      return 'min-w-[1.75rem] h-7 px-1 bg-indigo-100 text-indigo-800';
    } else if (category === 'logic') {
      return 'w-7 h-7 bg-red-100 text-red-800';
    } else if (category === 'sets') {
      return 'w-7 h-7 bg-teal-100 text-teal-800';
    }
    return 'w-7 h-7 bg-gray-100 text-gray-800';
  };

  return (
    <div
      ref={drag}
      className={`
        flex items-center justify-center 
        ${getTokenStyle()}
        m-0.5 
        border border-current border-opacity-20
        font-mono text-sm
        cursor-move select-none
        transition-all duration-200
        hover:brightness-95 hover:shadow-sm
        rounded-md
        ${isDragging ? 'opacity-50' : 'opacity-100'}
      `}
    >
      {token}
    </div>
  );
};

const DroppedToken = ({ token, onRemove }) => {
  // Safely display tokens with special handling for operators that might interfere with rendering
  const displayToken = token => {
    // Handle special cases that might cause rendering issues
    if (token === '^') return <span>^</span>;
    return token;
  };

  return (
    <div
      className="
        flex items-center 
        bg-blue-50 border border-blue-200 
        text-blue-800 rounded-md
        px-2 py-1 m-0.5 
        shadow-sm
        relative
        font-mono text-sm
      "
    >
      {displayToken(token)}
      <button
        className="
          absolute -top-1 -right-1 
          w-4 h-4 flex items-center justify-center 
          bg-red-500 text-white text-xs rounded-full 
          hover:bg-red-600
          shadow-sm
        "
        onClick={onRemove}
      >
        ×
      </button>
    </div>
  );
};

// Let's update the TokenCategory component for a more compact, tiled design
const TokenCategory = ({ title, tokens, category }) => (
  <div className="mb-2">
    <h3 className="text-sm font-semibold mb-1 text-blue-800">{title}</h3>
    <div className={`flex flex-wrap gap-0.5`}>
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
      <div className="bg-blue-100 p-3 rounded-md mb-2 shadow-sm">
        <h3 className="text-base font-semibold text-blue-800 mb-1">Challenge</h3>
        <p className="text-blue-700 text-sm">{challenge.question}</p>
        <div className="mt-1 text-blue-600 text-xs">
          <span className="font-semibold">Type:</span> {challenge.type.replace(/_/g, ' ')}
        </div>
      </div>
      
      <div
        ref={drop}
        className={`
          min-h-[80px] 
          p-3 rounded-md border-2 border-dashed
          transition-colors duration-300 
          ${isOver ? 'border-blue-500 bg-blue-50' : 'border-blue-300 bg-white'}
          ${tokens.length === 0 && 'flex items-center justify-center'}
          shadow-sm mb-2
        `}
      >
        {tokens.length === 0 ? (
          <p className="text-blue-500 text-center text-sm">
            Drag and drop elements to construct your solution
          </p>
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
        <div className="mt-2 mb-2">
          <p className="text-blue-700 mb-1 text-xs">Preview:</p>
          <div className="bg-white border border-blue-200 rounded-md p-2 shadow-sm">
            <MathJax inline dynamic>{`\\(${equationStr}\\)`}</MathJax>
          </div>
        </div>
      )}
    </div>
  );
};

// Update how we display the tokens UI panel
const TokenPanel = ({ activeTokens }) => {
  return (
    <div className="bg-white rounded-md shadow-md p-3">
      <div className="flex flex-wrap">
        <div className="w-full md:w-1/2 pr-1">
          <div className="flex flex-col space-y-1">
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
            {activeTokens.operators && (
              <TokenCategory
                title="Operators"
                tokens={activeTokens.operators}
                category="operators"
              />
            )}
          </div>
        </div>
        
        <div className="w-full md:w-1/2 pl-1">
          <div className="flex flex-col space-y-1">
            {activeTokens.functions && (
              <TokenCategory
                title="Functions"
                tokens={activeTokens.functions}
                category="functions"
              />
            )}
            {activeTokens.specials && (
              <TokenCategory
                title="Special"
                tokens={activeTokens.specials}
                category="specials"
              />
            )}
            <div className="flex space-x-1">
              <div className="flex-1">
                {activeTokens.logic && (
                  <TokenCategory
                    title="Logic"
                    tokens={activeTokens.logic}
                    category="logic"
                  />
                )}
              </div>
              <div className="flex-1">
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
      variables: ['x', 'y', 'z', 'n', 'α', 'β', 'θ', 'i'],  // Added imaginary unit 'i' here
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

  return (
    <DndProvider backend={HTML5Backend}>
      <MathJaxContext>
        <SlideWrapper className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="w-full h-full flex flex-col p-4">
            <header className="text-center mb-2">
              <h1 className="text-xl font-bold text-blue-800 mb-1">
                {courseData?.topic || 'Mathematical Expression Builder'}
              </h1>
              <p className="text-xs text-blue-600">Build and solve mathematical challenges</p>
            </header>

            <div className="flex justify-center items-center mb-2">
              <div className="flex gap-1">
                {['easy', 'medium', 'hard'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`
                      px-3 py-1 rounded-md text-xs font-semibold transition-all duration-300
                      ${difficulty === level 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'bg-white text-blue-600 hover:bg-blue-50'}
                    `}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            {loading && !challenge ? (
              <div className="flex justify-center items-center my-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-blue-600 text-sm">Loading...</span>
              </div>
            ) : challenge ? (
              <DropZone
                tokens={equationTokens}
                onDrop={handleDrop}
                removeToken={removeToken}
                challenge={challenge}
              />
            ) : (
              <div className="text-center text-red-500 my-2 text-sm">
                Failed to load challenge. Please try again.
              </div>
            )}

            {/* Replace the original token display with our new compact panel */}
            <TokenPanel activeTokens={getActiveTokens()} />

            <div className="flex flex-wrap gap-2 mt-3 justify-center">
              <button
                onClick={validateExpression}
                className="
                  bg-blue-600 text-white px-3 py-1 rounded-md
                  hover:bg-blue-700 transition-all duration-300
                  shadow-sm font-semibold text-xs
                "
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <span className="animate-spin h-3 w-3 mr-1 border-t-2 border-b-2 border-white rounded-full"></span>
                    Checking...
                  </span>
                ) : 'Check Answer'}
              </button>
              <button
                onClick={resetEquation}
                className="
                  bg-white text-blue-600 px-3 py-1 rounded-md
                  hover:bg-blue-50 transition-all duration-300
                  shadow-sm font-semibold text-xs
                "
              >
                Reset
              </button>
              <button
                onClick={newChallenge}
                className="
                  bg-green-500 text-white px-3 py-1 rounded-md
                  hover:bg-green-600 transition-all duration-300
                  shadow-sm font-semibold text-xs
                "
                disabled={loading}
              >
                New Challenge
              </button>
              {challenge && challenge.target && (
                <button
                  onClick={toggleHint}
                  className="
                    bg-yellow-500 text-white px-3 py-1 rounded-md
                    hover:bg-yellow-600 transition-all duration-300
                    shadow-sm font-semibold text-xs
                  "
                >
                  {showHint ? 'Hide Hint' : 'Show Hint'}
                </button>
              )}
            </div>

            {showHint && (
              <div className="mt-2 p-2 rounded-md bg-yellow-50 border border-yellow-200 shadow-sm">
                <h3 className="text-sm font-semibold text-yellow-800 mb-1">Hint</h3>
                <p className="text-yellow-700 text-xs">
                  Try constructing: {challenge.target}
                </p>
              </div>
            )}

            {result && (
              <div className="mt-2 p-3 rounded-md bg-white border border-blue-200 shadow-sm">
                <h3 className="text-base font-semibold text-blue-800 mb-1">Result</h3>
                <div className="space-y-2">
                  {result.isValid ? (
                    <div className="text-green-600 font-semibold text-sm flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Correct!
                    </div>
                  ) : (
                    <div className="text-red-600 font-semibold text-sm flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                      Not quite right
                    </div>
                  )}
                  
                  {result.explanation && (
                    <div className="bg-blue-50 p-2 rounded-md">
                      <p className="text-blue-700 text-xs">
                        {/* Transform explanation to directly address the user */}
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
                      <h4 className="text-xs font-semibold text-blue-700 mb-1">Helpful hints:</h4>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {result.hints.map((hint, index) => (
                          <li key={index} className="text-blue-600 text-xs">
                            {/* Make hints directly address the user */}
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
                      <h4 className="text-xs font-semibold text-blue-700 mb-1">Other approaches you could try:</h4>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {result.alternativeSolutions.map((solution, index) => (
                          <li key={index} className="text-blue-600 text-xs">{solution}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-auto flex justify-between pt-3">
              <button
                onClick={onPrevious}
                className="bg-white text-blue-600 px-3 py-1 rounded-md shadow-sm
                          hover:bg-blue-50 transition-all duration-300 text-xs"
              >
                ← Prev
              </button>
              {isLast ? (
                <button
                  onClick={() => alert('Course completed!')}
                  className="bg-green-500 text-white px-3 py-1 rounded-md shadow-sm
                          hover:bg-green-600 transition-all duration-300 text-xs"
                >
                  Complete ✓
                </button>
              ) : (
                <button
                  onClick={onNext}
                  className="bg-blue-600 text-white px-3 py-1 rounded-md shadow-sm
                          hover:bg-blue-700 transition-all duration-300 text-xs"
                >
                  Next →
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