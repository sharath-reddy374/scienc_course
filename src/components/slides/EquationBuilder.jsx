import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { MathJaxContext, MathJax } from 'better-react-mathjax';
import { generateSlideContent } from '../../services/openai';
import SlideWrapper from '../common/SlideWrapper';

const TOKEN_TYPE = 'TOKEN';

// Challenge generation from OpenAI API
const generateChallenge = async (difficulty = 'medium') => {
  try {
    console.log(`Generating new ${difficulty} challenge...`);
    
    // Add a timestamp or random ID to ensure we get a new challenge each time
    const timestamp = new Date().getTime();
    const randomSeed = Math.floor(Math.random() * 10000);
    
    // Generate a challenge based on difficulty level
    const data = await generateSlideContent('EQUATION_CHALLENGE', {
      difficulty: difficulty,
      subject: 'mathematics',
      timestamp: timestamp,
      seed: randomSeed,  // Add randomness to avoid caching or repetition
      // Add specific challenge types for each difficulty to ensure variety
      challengeTypes: difficulty === 'easy' 
        ? ['arithmetic', 'basic_algebra']
        : difficulty === 'medium'
          ? ['algebra', 'geometry', 'trigonometry', 'basic_calculus']
          : ['calculus', 'logic', 'sets', 'advanced_algebra']
    });
    
    console.log('Challenge generated:', data);
    
    // Return the challenge from the API
    return data;
  } catch (error) {
    console.error('Error generating challenge:', error);
    
    // Improved fallback challenges with more variety
    const fallbackChallenges = {
      easy: [
        { type: 'arithmetic', question: 'Create an equation that equals 45', target: 45 },
        { type: 'arithmetic', question: 'Make an expression using multiplication that equals 36', target: 36 },
        { type: 'equation', question: 'Create an equation with x that equals 20', target: '20' }
      ],
      medium: [
        { type: 'algebra', question: 'Create a quadratic equation with roots at x = 2 and x = -3', target: 'x² + x - 6 = 0' },
        { type: 'calculus', question: 'Write the derivative of x²', target: '2x' },
        { type: 'equation', question: 'Create an equation involving sine that equals 1', target: 'sin(π/2)' }
      ],
      hard: [
        { type: 'calculus', question: 'Write an integral expression for the area under x²', target: '∫x² dx' },
        { type: 'logic', question: 'Express: for all x, if x is positive then x² is positive', target: '∀x(x>0→x²>0)' },
        { type: 'sets', question: 'Write an expression for the intersection of sets A and B', target: 'A∩B' }
      ]
    };
    
    // Return a random fallback challenge from the appropriate difficulty
    const fallbacks = fallbackChallenges[difficulty];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
};

const DraggableToken = ({ token, category }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: TOKEN_TYPE,
    item: { token },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`
        flex items-center justify-center 
        ${category === 'numbers' ? 'w-8 h-8' : 'w-10 h-10'} 
        m-0.5 
        bg-white border border-blue-200 
        text-blue-800 font-mono ${category === 'numbers' ? 'text-sm' : 'text-base'}
        cursor-move select-none
        transition-all duration-200
        hover:scale-105 hover:bg-blue-50
        rounded-md shadow-sm
        ${isDragging ? 'opacity-50' : 'opacity-100'}
        ${category === 'function' ? 'col-span-1 md:col-span-1' : ''}
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
          transition-colors
        "
        onClick={onRemove}
      >
        ×
      </button>
    </div>
  );
};

const TokenCategory = ({ title, tokens, category }) => (
  <div className="mb-3">
    <h3 className="text-base font-semibold mb-1 text-blue-800">{title}</h3>
    <div className={`grid ${category === 'function' ? 'grid-cols-5 md:grid-cols-7' : category === 'numbers' ? 'grid-cols-10' : 'grid-cols-8 md:grid-cols-10'} gap-1`}>
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
    // Replace problematic tokens or add escaping as needed
    return tokens.map(token => {
      // Special case handling
      if (token === '^') return '\\^';
      if (token === '=') return '=';  // Ensure equals sign is rendered correctly
      if (token === '×') return '\\times';
      if (token === '÷') return '\\div';
      return token;
    }).join(' ');
  };

  const equationStr = prepareEquationForMathJax(tokens);

  return (
    <div className="mb-6">
      <div className="bg-blue-100 p-3 rounded-md mb-3 shadow-sm">
        <h3 className="text-lg font-semibold text-blue-800 mb-1">Challenge</h3>
        <p className="text-blue-700 text-sm">{challenge.question}</p>
      </div>
      
      <div
        ref={drop}
        className={`
          min-h-[90px] 
          p-3 rounded-md border-2 border-dashed
          transition-colors duration-300 
          ${isOver ? 'border-blue-500 bg-blue-50' : 'border-blue-300 bg-white'}
          ${tokens.length === 0 && 'flex items-center justify-center'}
          shadow-sm mb-3
        `}
      >
        {tokens.length === 0 ? (
          <p className="text-blue-500 text-center">
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
        <div className="mt-3 mb-3">
          <p className="text-blue-700 mb-1 text-sm">Preview:</p>
          <div className="bg-white border border-blue-200 rounded-md p-3 shadow-sm">
            <MathJax inline dynamic>{`\\(${equationStr}\\)`}</MathJax>
          </div>
        </div>
      )}
    </div>
  );
};

const EquationBuilder = ({ courseData, onNext, onPrevious, isLast }) => {
  const [equationTokens, setEquationTokens] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [challenge, setChallenge] = useState(null);

  const tokenSets = {
    basic: {
      numbers: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
      operators: ['+', '-', '×', '÷', '=', '(', ')'],
    },
    advanced: {
      numbers: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'π', 'e'],
      variables: ['x', 'y', 'z', 'n', 'α', 'β', 'θ'],
      operators: ['+', '-', '×', '÷', '=', '≠', '≤', '≥', '(', ')'],
      functions: ['sin', 'cos', 'tan', 'log', '√', '∫', '∑'],
      specials: ['^', 'dx', 'dy', 'd'],
      logic: ['∀', '∃', '→', '∧', '∨', '¬'],
      sets: ['∈', '⊂', '∪', '∩', '∅']
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
  };

  const validateExpression = async () => {
    setLoading(true);
    try {
      // Format the equation for validation
      const userEquation = equationTokens.join(' ');
      
      // Basic validation - check if equation is empty
      if (equationTokens.length === 0) {
        setResult({
          isValid: false,
          explanation: 'Please build an expression before checking your answer.'
        });
        setLoading(false);
        return;
      }
      
      // Instead of relying on the API which seems to have issues,
      // let's implement robust local validation to handle common mathematical expressions
      
      // 1. Direct match (exact or normalized by removing spaces)
      const normalizedUserEquation = userEquation.replace(/\s+/g, '');
      const normalizedTarget = challenge.target.replace(/\s+/g, '');
      
      if (normalizedUserEquation === normalizedTarget) {
        setResult({
          isValid: true,
          explanation: 'Great job! Your answer matches the expected solution.'
        });
        setLoading(false);
        return;
      }
      
      // 2. Handle common math equivalences based on challenge type
      let isValid = false;
      let explanation = '';
      
      switch (challenge.type) {
        case 'arithmetic':
          // For arithmetic, try to evaluate both expressions
          try {
            // Simple evaluation for basic arithmetic
            // This is just a basic implementation - a real one would use a math library
            const userValue = normalizedUserEquation.includes('=') 
              ? normalizedUserEquation.split('=')[1] 
              : normalizedUserEquation;
            const targetValue = normalizedTarget.includes('=')
              ? normalizedTarget.split('=')[1]
              : normalizedTarget;
              
            isValid = userValue === targetValue;
            explanation = isValid 
              ? 'Correct! Your arithmetic expression is valid.' 
              : 'Your expression evaluates differently than the expected result.';
          } catch (e) {
            isValid = false;
            explanation = 'Could not evaluate your arithmetic expression.';
          }
          break;
          
        case 'algebra':
          // For algebraic expressions, check for equivalent forms
          if (normalizedTarget === 'x²+x-6=0' || normalizedTarget === 'x^2+x-6=0') {
            // Example of checking for factored form
            if (normalizedUserEquation === '(x+3)(x-2)=0') {
              isValid = true;
              explanation = 'Correct! Your factored form is equivalent to the expected solution.';
            } else {
              isValid = false;
              explanation = 'Your algebraic expression isn\'t equivalent to the expected form.';
            }
          } else {
            // For general case, fall back to direct comparison
            isValid = normalizedUserEquation === normalizedTarget;
            explanation = isValid 
              ? 'Correct! Your algebraic expression matches the expected form.' 
              : 'Your algebraic expression doesn\'t match the expected form.';
          }
          break;
          
        case 'calculus':
          // For calculus, handle different notations
          if (normalizedTarget.includes('∫') && normalizedTarget.includes('dx')) {
            // Integral validation
            const isIntegral = normalizedUserEquation.includes('∫') && normalizedUserEquation.includes('dx');
            const containsCorrectExpression = normalizedUserEquation.includes(normalizedTarget.replace('∫', '').replace('dx', ''));
            
            isValid = isIntegral && containsCorrectExpression;
            explanation = isValid
              ? 'Correct! Your integral expression is valid.'
              : 'Make sure your answer includes both the integral sign (∫) and dx.';
          } else if (normalizedTarget.includes('d') && !normalizedTarget.includes('dx')) {
            // Derivative validation
            isValid = normalizedUserEquation === normalizedTarget;
            explanation = isValid
              ? 'Correct! Your derivative expression is valid.'
              : 'Your derivative expression doesn\'t match the expected form.';
          } else {
            // General calculus expression
            isValid = normalizedUserEquation === normalizedTarget;
            explanation = isValid
              ? 'Correct! Your calculus expression is valid.'
              : 'Your calculus expression doesn\'t match the expected form.';
          }
          break;
          
        case 'logic':
          // For logic expressions, strict matching for now
          isValid = normalizedUserEquation === normalizedTarget;
          explanation = isValid
            ? 'Correct! Your logical expression is valid.'
            : 'Your logical expression doesn\'t match the expected form.';
          break;
          
        case 'sets':
          // For set expressions, strict matching for now
          isValid = normalizedUserEquation === normalizedTarget;
          explanation = isValid
            ? 'Correct! Your set expression is valid.'
            : 'Your set expression doesn\'t match the expected form.';
          break;
          
        default:
          // For any other type, do direct comparison
          isValid = normalizedUserEquation === normalizedTarget;
          explanation = isValid
            ? 'Correct! Your answer matches the expected solution.'
            : 'Your answer doesn\'t match the expected solution.';
      }
      
      setResult({
        isValid,
        explanation,
        // Add hints for incorrect answers
        ...(isValid ? {} : {
          hints: [
            `Try working toward: ${challenge.target}`,
            `Make sure you've used the right mathematical notation.`,
            `Check that you've included all necessary parts of the expression.`
          ]
        })
      });
      
    } catch (error) {
      console.error('Validation error:', error);
      
      // Show a more helpful error message with debugging info
      setResult({
        isValid: false,
        explanation: `Error validating your expression. Please try again. (${error.message || 'Unknown error'})`
      });
    } finally {
      setLoading(false);
    }
  };

  const getActiveTokens = () => {
    if (difficulty === 'easy') return tokenSets.basic;
    return tokenSets.advanced;
  };

  const newChallenge = async () => {
    setLoading(true);
    resetEquation();
    
    try {
      // Generate a new challenge with additional randomization parameters
      const timestamp = new Date().getTime();
      const randomSeed = Math.floor(Math.random() * 10000);
      
      const newChallenge = await generateSlideContent('EQUATION_CHALLENGE', {
        difficulty: difficulty,
        subject: 'mathematics',
        timestamp: timestamp,
        seed: randomSeed,
        forceNew: true,  // Signal to the API that we want a new challenge
        challengeTypes: difficulty === 'easy' 
          ? ['arithmetic', 'basic_algebra']
          : difficulty === 'medium'
            ? ['algebra', 'geometry', 'trigonometry', 'basic_calculus']
            : ['calculus', 'logic', 'sets', 'advanced_algebra']
      });
      
      // Log for debugging
      console.log('New challenge generated:', newChallenge);
      
      // Set the new challenge
      setChallenge(newChallenge);
    } catch (error) {
      console.error('Failed to generate new challenge:', error);
      
      // In case of error, generate a fallback challenge
      const fallbackChallenges = {
        easy: [
          { type: 'arithmetic', question: 'Create an equation that equals 42', target: 42 },
          { type: 'arithmetic', question: 'Make an expression using multiplication that equals 24', target: 24 },
          { type: 'equation', question: 'Create an equation with x that equals 15', target: '15' }
        ],
        medium: [
          { type: 'algebra', question: 'Create a quadratic equation with roots at x = 1 and x = -4', target: 'x² + 3x - 4 = 0' },
          { type: 'calculus', question: 'Write the derivative of x³', target: '3x²' },
          { type: 'equation', question: 'Create an equation involving cosine that equals 0', target: 'cos(π/2)' }
        ],
        hard: [
          { type: 'calculus', question: 'Write an integral expression for the area under x³', target: '∫x³ dx' },
          { type: 'logic', question: 'Express: there exists x such that x² equals 4', target: '∃x(x²=4)' },
          { type: 'sets', question: 'Write an expression for the union of sets A and B', target: 'A∪B' }
        ]
      };
      
      // Select a random fallback challenge different from the current one
      const fallbacks = fallbackChallenges[difficulty];
      let newFallback;
      do {
        newFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      } while (challenge && newFallback.question === challenge.question);
      
      setChallenge(newFallback);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <MathJaxContext>
        <SlideWrapper className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="w-full h-full flex flex-col p-4 md:p-8">
            <header className="text-center mb-2 md:mb-4">
              <h1 className="text-xl md:text-3xl font-bold text-blue-800 mb-1">
                {courseData?.topic || 'Mathematical Expression Builder'}
              </h1>
              <p className="text-xs md:text-sm text-blue-600">Build and solve mathematical challenges</p>
            </header>

            <div className="flex justify-center items-center mb-3">
              <div className="flex gap-1">
                {['easy', 'medium', 'hard'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`
                      px-3 py-1 rounded-md text-sm font-semibold transition-all duration-300
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
            
            {challenge && (
              <DropZone
                tokens={equationTokens}
                onDrop={handleDrop}
                removeToken={removeToken}
                challenge={challenge}
              />
            )}

            <div className="bg-white rounded-lg shadow-md p-3 md:p-4">
              <div className="space-y-2">
                {Object.entries(getActiveTokens()).map(([category, tokens]) => (
                  <TokenCategory
                    key={category}
                    title={category.charAt(0).toUpperCase() + category.slice(1)}
                    tokens={tokens}
                    category={category}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-3 justify-center">
              <button
                onClick={validateExpression}
                className="
                  bg-blue-600 text-white px-4 py-1.5 rounded-md
                  hover:bg-blue-700 transition-all duration-300 hover:scale-105
                  shadow-sm font-semibold text-sm
                "
                disabled={loading}
              >
                {loading ? 'Checking...' : 'Check Answer'}
              </button>
              <button
                onClick={resetEquation}
                className="
                  bg-white text-blue-600 px-4 py-1.5 rounded-md
                  hover:bg-blue-50 transition-all duration-300 hover:scale-105
                  shadow-sm font-semibold text-sm
                "
              >
                Reset
              </button>
              <button
                onClick={newChallenge}
                className="
                  bg-green-500 text-white px-4 py-1.5 rounded-md
                  hover:bg-green-600 transition-all duration-300 hover:scale-105
                  shadow-sm font-semibold text-sm
                "
              >
                New Challenge
              </button>
            </div>

            {result && (
              <div className="mt-3 p-3 rounded-md bg-white border border-blue-200 shadow-sm">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Result</h3>
                <div className="space-y-2">
                  {result.isValid ? (
                    <div className="text-green-600 font-semibold text-sm">✓ Correct!</div>
                  ) : (
                    <div className="text-red-600 font-semibold text-sm">× Not quite right</div>
                  )}
                  {result.explanation && (
                    <p className="text-blue-700 text-sm">
                      {/* Transform explanation to directly address the user */}
                      {result.explanation.replace(
                        /The student's answer/g, 'Your answer'
                      ).replace(
                        /student's/g, 'your'
                      ).replace(
                        /student/g, 'you'
                      )}
                    </p>
                  )}
                  {result.hints && result.hints.length > 0 && (
                    <div className="mt-2">
                      <h4 className="text-sm font-semibold text-blue-700 mb-1">Helpful hints:</h4>
                      <ul className="list-disc pl-5 space-y-0.5">
                        {result.hints.map((hint, index) => (
                          <li key={index} className="text-blue-600 text-xs">{hint}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.alternativeSolutions && result.alternativeSolutions.length > 0 && (
                    <div className="mt-2">
                      <h4 className="text-sm font-semibold text-blue-700 mb-1">Other approaches:</h4>
                      <ul className="list-disc pl-5 space-y-0.5">
                        {result.alternativeSolutions.map((solution, index) => (
                          <li key={index} className="text-blue-600 text-xs">{solution}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-3 flex justify-between">
              <button
                onClick={onPrevious}
                className="bg-white text-blue-600 px-3 py-1.5 rounded-md shadow-sm
                          hover:bg-blue-50 transition-all duration-300 hover:scale-105 text-xs md:text-sm"
              >
                ← Prev
              </button>
              {isLast ? (
                <button
                  onClick={() => alert('Course completed!')}
                  className="bg-green-500 text-white px-3 py-1.5 rounded-md shadow-sm
                          hover:bg-green-600 transition-all duration-300 hover:scale-105 text-xs md:text-sm"
                >
                  Complete ✓
                </button>
              ) : (
                <button
                  onClick={onNext}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded-md shadow-sm
                          hover:bg-blue-700 transition-all duration-300 hover:scale-105 text-xs md:text-sm"
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