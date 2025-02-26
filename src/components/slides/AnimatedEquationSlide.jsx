import React, { useState, useEffect } from 'react';
import { MathJaxContext, MathJax } from 'better-react-mathjax';
import { motion, AnimatePresence } from 'framer-motion';
import SlideWrapper from '../common/SlideWrapper';

const EquationTransformer = ({ steps }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);

  // Create a safe version of steps that's never undefined
  const safeSteps = Array.isArray(steps) && steps.length > 0 ? steps : [
    {
      equation: "\\(\\text{Loading equation...}\\)",
      explanation: "Please wait while the equation loads."
    }
  ];

  useEffect(() => {
    let timer;
    
    if (autoPlay && isPlaying && currentStep < safeSteps.length - 1) {
      timer = setTimeout(() => {
        setCurrentStep(prevStep => prevStep + 1);
      }, speed);
    } else if (currentStep >= safeSteps.length - 1) {
      setIsPlaying(false);
    }
    
    return () => clearTimeout(timer);
  }, [autoPlay, currentStep, safeSteps.length, speed, isPlaying]);

  // Reset currentStep if it's out of bounds when steps change
  useEffect(() => {
    if (currentStep >= safeSteps.length) {
      setCurrentStep(0);
    }
  }, [safeSteps, currentStep]);

  // Process equation text to ensure proper LaTeX rendering
  const processEquation = (equationText) => {
    if (!equationText) return "\\(\\text{No equation available}\\)";
    
    // Replace simple caret notation with proper LaTeX superscript
    equationText = equationText.replace(/\^(\d+)/g, "^{$1}");
    equationText = equationText.replace(/sin\^(\d+)/g, "\\sin^{$1}");
    equationText = equationText.replace(/cos\^(\d+)/g, "\\cos^{$1}");
    equationText = equationText.replace(/tan\^(\d+)/g, "\\tan^{$1}");
    
    // Ensure proper math function formatting
    equationText = equationText.replace(/\\sin/g, "\\sin");
    equationText = equationText.replace(/\\cos/g, "\\cos");
    equationText = equationText.replace(/\\tan/g, "\\tan");
    equationText = equationText.replace(/sin(?!\^)/g, "\\sin");
    equationText = equationText.replace(/cos(?!\^)/g, "\\cos");
    equationText = equationText.replace(/tan(?!\^)/g, "\\tan");
    
    // If equation isn't wrapped in delimiters, wrap it
    if (!equationText.includes("\\(") && !equationText.includes("\\[") &&
        !equationText.includes("$")) {
      return `\\[${equationText}\\]`;
    }
    
    // Ensure display mode for complex fractions and expressions
    if (equationText.includes("\\frac") || equationText.includes("\\sum") || 
        equationText.includes("\\int") || equationText.includes("\\prod")) {
      // Replace inline delimiters with display delimiters if not already in display mode
      if (equationText.includes("\\(")) {
        return equationText.replace(/\\\(/g, "\\[").replace(/\\\)/g, "\\]");
      }
    }
    
    return equationText;
  };

  // Check if a text contains LaTeX expressions that need separate rendering
  const containsMath = (text) => {
    return text && (
      text.includes('$') || 
      text.includes('\\(') || 
      text.includes('\\[') ||
      text.includes('\\frac') || 
      text.includes('\\sin') || 
      text.includes('\\cos') ||
      text.includes('\\tan') ||
      text.includes('\\csc') ||
      text.includes('\\sec') ||
      text.includes('\\cot')
    );
};

  // Split explanation text to handle LaTeX expressions
  const renderExplanationWithMath = (explanation) => {
    if (!explanation) return null;
    if (!containsMath(explanation)) return explanation;

    // If it's a simple explanation with inline math, wrap the whole thing in MathJax
    if (explanation.includes('$')) {
      return <MathJax>{explanation}</MathJax>;
    }

    // For more complex explanations, we could split text and math parts
    // This is a simpler approach that works for many cases
    return <MathJax>{explanation}</MathJax>;
  };

  const playAnimation = () => {
    if (currentStep >= safeSteps.length - 1) {
      setCurrentStep(0);
    }
    setIsPlaying(true);
  };

  const pauseAnimation = () => {
    setIsPlaying(false);
  };

  const resetAnimation = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const goToStep = (stepIndex) => {
    setCurrentStep(stepIndex);
    setIsPlaying(false);
  };

  const goNextStep = () => {
    if (currentStep < safeSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
    setIsPlaying(false);
  };

  const goPrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
    setIsPlaying(false);
  };
  
  // Handler for speed change
  const handleSpeedChange = (e) => {
    setSpeed(Number(e.target.value));
  };

  // Calculate progress percentage
  const progressPercentage = safeSteps.length > 1 
    ? (currentStep / (safeSteps.length - 1)) * 100 
    : 0;

  return (
    <div className="w-full">
      {/* Enhanced equation display area with 3D-like depth */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6 relative overflow-hidden border border-indigo-100">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
        
        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-indigo-50 opacity-20"></div>
        <div className="absolute -left-4 -bottom-4 w-16 h-16 rounded-full bg-purple-50 opacity-20"></div>
        
        {/* Step indicator - horizontal progress bar */}
        <div className="h-1 w-full bg-gray-100 rounded-full mb-4 overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        
        {/* Step counter display */}
        <div className="flex justify-between items-center mb-3">
          <div className="text-xs text-gray-500">
            Step {currentStep + 1} of {safeSteps.length}
          </div>
          <div className="text-xs font-medium text-indigo-600">
            {Math.round(progressPercentage)}% Complete
          </div>
        </div>

        {/* Equation display area - increased height */}
        <div className="min-h-[200px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
              className="text-center w-full"
            >
              {/* Main equation with enhanced styling */}
              <motion.div
                className="text-2xl my-6 block p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 shadow-sm"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <MathJax>
                  {processEquation(safeSteps[currentStep]?.equation)}
                </MathJax>
              </motion.div>
              
              {safeSteps[currentStep]?.explanation && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4"
                >
                  {/* Explanation with light bulb icon in the style shown in the screenshot */}
                  <div className="bg-blue-50 rounded-lg p-4 flex items-start border border-blue-100 shadow-sm">
                    <div className="text-blue-500 mr-3 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.343a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                      </svg>
                    </div>
                    <div className="text-gray-800 text-sm">
                      {renderExplanationWithMath(safeSteps[currentStep].explanation)}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Enhanced controls with better visual hierarchy */}
      <div className="flex flex-col gap-4">
        {/* Main playback controls */}
        <div className="flex justify-center items-center gap-3">
          <motion.button 
            onClick={goPrevStep} 
            disabled={currentStep === 0}
            whileHover={currentStep !== 0 ? { scale: 1.1 } : {}}
            whileTap={currentStep !== 0 ? { scale: 0.95 } : {}}
            className={`p-3 rounded-full ${currentStep === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </motion.button>
          
          {isPlaying ? (
            <motion.button 
              onClick={pauseAnimation}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-4 rounded-full bg-indigo-600 text-white shadow-md hover:bg-indigo-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </motion.button>
          ) : (
            <motion.button 
              onClick={playAnimation}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-4 rounded-full bg-indigo-600 text-white shadow-md hover:bg-indigo-700"
            >
              {currentStep >= safeSteps.length - 1 ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </motion.button>
          )}
          
          <motion.button 
            onClick={goNextStep} 
            disabled={currentStep === safeSteps.length - 1}
            whileHover={currentStep !== safeSteps.length - 1 ? { scale: 1.1 } : {}}
            whileTap={currentStep !== safeSteps.length - 1 ? { scale: 0.95 } : {}}
            className={`p-3 rounded-full ${currentStep === safeSteps.length - 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </motion.button>
        </div>
        
        {/* Step indicators transformed into a timeline */}
        <div className="flex justify-center gap-1 py-2">
          {safeSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => goToStep(index)}
              className="group relative"
              aria-label={`Go to step ${index + 1}`}
            >
              <div className={`w-6 h-1 ${index === 0 ? 'rounded-l-full' : ''} ${index === safeSteps.length - 1 ? 'rounded-r-full' : ''} ${currentStep >= index ? 'bg-indigo-500' : 'bg-gray-200'}`}></div>
              <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-indigo-600 whitespace-nowrap bg-white px-2 py-1 rounded-md shadow-sm">
                Step {index + 1}
              </span>
            </button>
          ))}
        </div>
        
        {/* Secondary controls with improved organization */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
          <motion.button 
            onClick={resetAnimation}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1 px-3 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Reset
          </motion.button>
          
          <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-md">
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="autoplay" 
                checked={autoPlay} 
                onChange={() => setAutoPlay(!autoPlay)}
                className="h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <label htmlFor="autoplay" className="ml-2 text-xs text-gray-700">Auto-play</label>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-md">
            <label htmlFor="speed" className="text-xs text-gray-700">Speed:</label>
            <select 
              id="speed"
              value={speed}
              onChange={handleSpeedChange} 
              className="text-xs border rounded p-1 bg-white focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value={500}>Fast</option>
              <option value={1000}>Normal</option>
              <option value={2000}>Slow</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

// Preset examples for when no API data is available
const presetExamples = [
  // Solving a linear equation: 2x + 5 = 13
  {
    title: "Solving a Linear Equation",
    steps: [
      {
        equation: "2x + 5 = 13",
        explanation: "We start with our linear equation."
      },
      {
        equation: "2x + 5 - 5 = 13 - 5",
        explanation: "Subtract 5 from both sides to isolate the variable term."
      },
      {
        equation: "2x = 8",
        explanation: "Simplify both sides of the equation."
      },
      {
        equation: "\\frac{2x}{2} = \\frac{8}{2}",
        explanation: "Divide both sides by 2 to isolate x."
      },
      {
        equation: "x = 4",
        explanation: "And we have our solution!"
      }
    ]
  },
  
  // Factoring a quadratic: x² - 5x + 6
  {
    title: "Factoring a Quadratic Expression",
    steps: [
      {
        equation: "x^2 - 5x + 6",
        explanation: "We start with our quadratic expression."
      },
      {
        equation: "x^2 - 2x - 3x + 6",
        explanation: "Split the middle term into two parts where their product equals the constant term."
      },
      {
        equation: "x(x - 2) - 3(x - 2)",
        explanation: "Factor by grouping: pull out common factors from each pair."
      },
      {
        equation: "(x - 2)(x - 3)",
        explanation: "Identify the common binomial factor and simplify."
      }
    ]
  },
  
  // Completing the square: x² + 6x + 8
  {
    title: "Completing the Square",
    steps: [
      {
        equation: "x^2 + 6x + 8",
        explanation: "We start with our quadratic expression."
      },
      {
        equation: "x^2 + 6x + (\\frac{6}{2})^2 - (\\frac{6}{2})^2 + 8",
        explanation: "Add and subtract (b/2)² where b is the coefficient of x."
      },
      {
        equation: "x^2 + 6x + 9 - 9 + 8",
        explanation: "Substitute (6/2)² = 9 and organize terms."
      },
      {
        equation: "(x + 3)^2 - 9 + 8",
        explanation: "The first part is now a perfect square trinomial."
      },
      {
        equation: "(x + 3)^2 - 1",
        explanation: "Simplify the constants: -9 + 8 = -1."
      }
    ]
  },
  
  // Trigonometric Identity Example
  {
    title: "Trigonometric Identity",
    steps: [
      {
        equation: "\\sin^2(x) + \\cos^2(x)",
        explanation: "We start with the sum of squared sine and cosine functions."
      },
      {
        equation: "\\sin^2(x) + (1 - \\sin^2(x))",
        explanation: "Substitute cos²(x) = 1 - sin²(x), which is a fundamental identity."
      },
      {
        equation: "\\sin^2(x) + 1 - \\sin^2(x)",
        explanation: "Distribute the terms."
      },
      {
        equation: "1",
        explanation: "Since \\sin^2(x) - \\sin^2(x) equals 0, we are left with 1."
      }
    ]
  },
  
  // Logarithm Properties
  {
    title: "Logarithm Properties",
    steps: [
      {
        equation: "\\log(xy)",
        explanation: "We want to simplify this logarithm using logarithm properties."
      },
      {
        equation: "\\log(x) + \\log(y)",
        explanation: "Apply the product rule: log(xy) = log(x) + log(y)."
      },
      {
        equation: "\\log(\\frac{x}{y})",
        explanation: "We now want to simplify this expression."
      },
      {
        equation: "\\log(x) - \\log(y)",
        explanation: "Apply the quotient rule: log(x/y) = log(x) - log(y)."
      }
    ]
  },
  
  // Limit Evaluation
  {
    title: "Limit Evaluation",
    steps: [
      {
        equation: "\\lim_{x \\to 0} \\frac{\\sin(x)}{x}",
        explanation: "We want to evaluate this important limit that appears in calculus."
      },
      {
        equation: "\\lim_{x \\to 0} \\frac{\\sin(x)}{x} = ?",
        explanation: "Direct substitution gives us the indeterminate form 0/0."
      },
      {
        equation: "\\lim_{x \\to 0} \\frac{d}{dx}[\\sin(x)]}{\\frac{d}{dx}[x]} = \\frac{\\cos(0)}{1}",
        explanation: "We can apply L'Hôpital's rule, taking derivatives of numerator and denominator."
      },
      {
        equation: "\\cos(0) = 1",
        explanation: "Evaluate cos(0) to get the final result."
      }
    ]
  },
  
  // Matrix Operations
  {
    title: "Matrix Multiplication",
    steps: [
      {
        equation: "\\begin{pmatrix} 2 & 1 \\\\ 3 & 4 \\end{pmatrix} \\times \\begin{pmatrix} 0 & 5 \\\\ 7 & 2 \\end{pmatrix}",
        explanation: "We want to multiply these two 2×2 matrices."
      },
      {
        equation: "\\begin{pmatrix} 2 \\cdot 0 + 1 \\cdot 7 & 2 \\cdot 5 + 1 \\cdot 2 \\\\ 3 \\cdot 0 + 4 \\cdot 7 & 3 \\cdot 5 + 4 \\cdot 2 \\end{pmatrix}",
        explanation: "Each entry in the result is the dot product of the corresponding row and column."
      },
      {
        equation: "\\begin{pmatrix} 0 + 7 & 10 + 2 \\\\ 0 + 28 & 15 + 8 \\end{pmatrix}",
        explanation: "Compute all the individual products and sums."
      },
      {
        equation: "\\begin{pmatrix} 7 & 12 \\\\ 28 & 23 \\end{pmatrix}",
        explanation: "Simplify to get the final result."
      }
    ]
  },
  
  // Derivative Example
  {
    title: "Product Rule for Derivatives",
    steps: [
      {
        equation: "\\frac{d}{dx}[x^2 \\cdot \\ln(x)]",
        explanation: "We want to find the derivative of the product of two functions."
      },
      {
        equation: "\\frac{d}{dx}[x^2] \\cdot \\ln(x) + x^2 \\cdot \\frac{d}{dx}[\\ln(x)]",
        explanation: "Apply the product rule: d/dx[f(x)·g(x)] = f'(x)·g(x) + f(x)·g'(x)."
      },
      {
        equation: "2x \\cdot \\ln(x) + x^2 \\cdot \\frac{1}{x}",
        explanation: "Calculate the individual derivatives: d/dx[x²] = 2x and d/dx[ln(x)] = 1/x."
      },
      {
        equation: "2x\\ln(x) + x",
        explanation: "Simplify the expression to get the final result."
      }
    ]
  },
  
  // Integration Example
  {
    title: "Integration by Parts",
    steps: [
      {
        equation: "\\int x\\cos(x)\\,dx",
        explanation: "We need to use integration by parts to solve this integral."
      },
      {
        equation: "\\int u\\,dv = uv - \\int v\\,du",
        explanation: "The formula for integration by parts. Let u = x and dv = cos(x)dx."
      },
      {
        equation: "x\\sin(x) - \\int \\sin(x)\\,dx",
        explanation: "With u = x, du = dx, dv = cos(x)dx, and v = sin(x)."
      },
      {
        equation: "x\\sin(x) - (-\\cos(x)) + C",
        explanation: "Integrate sin(x) to get -cos(x)."
      },
      {
        equation: "x\\sin(x) + \\cos(x) + C",
        explanation: "Simplify to get the final result."
      }
    ]
  }
];

// Main slide component with improved styling
const AnimatedEquationSlide = ({ courseData, content, onNext, onPrevious, isFirst, isLast, onRefreshContent, isRefreshing }) => {
  const [selectedExample, setSelectedExample] = useState(0);
  const [customTransformationInput, setCustomTransformationInput] = useState('');
  // Initialize with presetExamples directly to make them available immediately
  const [examples, setExamples] = useState(presetExamples);
  const [customSubmissionCount, setCustomSubmissionCount] = useState(0);
  const [error, setError] = useState(null);
  // Add a state to track whether the example drawer is open
  const [showExampleDrawer, setShowExampleDrawer] = useState(false);

  // Handle updates to examples when content changes, but preserve presetExamples
  useEffect(() => {
    console.log("Content or custom submission changed:", content, customSubmissionCount);
    
    try {
      if (content) {
        // If content is an array, use it directly
        if (Array.isArray(content)) {
          // Validate that each item has steps
          const validContent = content.filter(item => item && item.steps && Array.isArray(item.steps));
          if (validContent.length > 0) {
            // Merge new content with existing preset examples
            const updatedExamples = [...presetExamples, ...validContent];
            setExamples(updatedExamples);
            
            // Auto-select the newest example if it was just added
            if (customSubmissionCount > 0) {
              setSelectedExample(updatedExamples.length - 1);
            }
            setError(null);
          } else {
            console.error("Content array has no valid items with steps:", content);
            setError("The data received doesn't contain valid equation steps");
          }
        } 
        // If content is a single object with steps, wrap it in an array
        else if (content.steps && Array.isArray(content.steps)) {
          const newExamples = [...presetExamples, content];
          setExamples(newExamples);
          setSelectedExample(presetExamples.length); // Select the newly added example
          setError(null);
        } else {
          console.error("Content is not an array and doesn't have steps:", content);
          setError("The data received doesn't contain equation steps");
        }
      }
    } catch (err) {
      console.error("Error processing content:", err);
      setError(`Error: ${err.message}`);
    }
  }, [content, customSubmissionCount]);

  const handleCustomTransformationSubmit = () => {
    if (!customTransformationInput.trim() || isRefreshing) return;
    
    console.log("Submitting transformation:", customTransformationInput);
    setError(null);
    
    // Call the refresh content handler with the custom transformation
    if (onRefreshContent) {
      onRefreshContent({
        customTransformation: customTransformationInput.trim()
      });
      
      // Increment submission counter to trigger the useEffect
      setCustomSubmissionCount(prev => prev + 1);
    } else {
      console.error("onRefreshContent handler is not defined!");
      setError("Unable to generate transformation: refresh handler is not available");
    }
    
    // Clear the input field
    setCustomTransformationInput('');
  };

  // Make sure we always have a valid selectedExample index
  useEffect(() => {
    if (examples && examples.length > 0) {
      if (selectedExample >= examples.length) {
        setSelectedExample(examples.length - 1);
      }
    }
  }, [examples, selectedExample]);

  // Check if examples[selectedExample] is valid before rendering
  const hasValidSelectedExample = 
    examples && 
    examples.length > 0 && 
    selectedExample < examples.length && 
    examples[selectedExample] && 
    examples[selectedExample].steps && 
    Array.isArray(examples[selectedExample].steps);

  // Group examples by category
  const exampleCategories = {
    "Algebra": examples.filter(ex => 
      ex.title.includes("Linear") || 
      ex.title.includes("Quadratic") || 
      ex.title.includes("Square")),
    "Trigonometry": examples.filter(ex => 
      ex.title.includes("Trigonometric") || 
      ex.title.includes("Sin") || 
      ex.title.includes("Cos")),
    "Calculus": examples.filter(ex => 
      ex.title.includes("Derivative") || 
      ex.title.includes("Integration") || 
      ex.title.includes("Limit")),
    "Other": examples.filter(ex => 
      !ex.title.includes("Linear") && 
      !ex.title.includes("Quadratic") && 
      !ex.title.includes("Square") &&
      !ex.title.includes("Trigonometric") && 
      !ex.title.includes("Sin") && 
      !ex.title.includes("Cos") &&
      !ex.title.includes("Derivative") && 
      !ex.title.includes("Integration") && 
      !ex.title.includes("Limit"))
  };
  
  // Filter out empty categories
  const nonEmptyCategories = Object.entries(exampleCategories)
    .filter(([_, exs]) => exs.length > 0);

  return (
    <MathJaxContext
      config={{
        tex: {
          inlineMath: [[', '], ['\\(', '\\)']],
          displayMath: [['$', '$'], ['\\[', '\\]']],
          processEscapes: true,
          macros: {
            "\\R": "\\mathbb{R}",
            "\\N": "\\mathbb{N}",
            "\\Z": "\\mathbb{Z}"
          }
        },
        loader: { load: ['[tex]/ams', '[tex]/color', '[tex]/noerrors', '[tex]/noundefined'] },
        options: {
          enableMenu: false,
          renderActions: {
            addMenu: [], 
            checkLoading: []
          }
        },
        svg: {
          fontCache: 'global',
          scale: 1.2
        }
      }}
    >
      <SlideWrapper className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="w-full h-full flex flex-col p-6">
          {/* Enhanced header with decorative elements */}
          <header className="text-center mb-6 relative">
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-indigo-100 opacity-30"></div>
            <div className="absolute -top-8 -left-8 w-24 h-24 rounded-full bg-purple-100 opacity-30"></div>
            
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 inline-block mb-2">
              {courseData?.topic || 'Animated Equation Transformations'}
            </h1>
            <div className="h-1 w-24 mx-auto bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mb-2"></div>
            <p className="text-sm text-indigo-700">
              Watch equations transform step by step
            </p>
          </header>

          {/* Example browser button that's always visible */}
          <div className="flex justify-center mb-4">
            <motion.button
              onClick={() => setShowExampleDrawer(!showExampleDrawer)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-4 py-2 rounded-md bg-white border border-indigo-200 text-indigo-700 shadow-sm
                      hover:bg-indigo-50 flex items-center gap-2 text-sm font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Browse {examples.length} Examples
            </motion.button>
          </div>

          {/* Examples drawer - expanded view when showExampleDrawer is true */}
          <AnimatePresence>
            {showExampleDrawer && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden mb-6"
              >
                <div className="bg-white rounded-lg shadow-md p-4 border border-indigo-100">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium text-indigo-800">Example Library</h3>
                    <button 
                      onClick={() => setShowExampleDrawer(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {nonEmptyCategories.map(([category, categoryExamples]) => (
                      <div key={category}>
                        <h4 className="text-sm font-semibold text-indigo-600 mb-2">{category}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {categoryExamples.map((example, index) => {
                            // Find the global index of this example in the examples array
                            const globalIndex = examples.findIndex(ex => ex.title === example.title);
                            return (
                              <motion.button
                                key={`${category}-${index}`}
                                onClick={() => {
                                  setSelectedExample(globalIndex);
                                  setShowExampleDrawer(false);
                                }}
                                whileHover={{ y: -2, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                                className={`p-3 rounded-md text-left border ${
                                  selectedExample === globalIndex
                                    ? 'bg-indigo-50 border-indigo-300'
                                    : 'bg-gray-50 border-gray-200 hover:border-indigo-200'
                                }`}
                              >
                                <div className="text-sm font-medium mb-1">
                                  {example.title}
                                </div>
                                <div className="text-xs text-gray-500 flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                  </svg>
                                  {example.steps?.length || 0} steps
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Custom transformation input with enhanced styling */}
          <div className="mb-6">
            <div className="flex justify-center">
              <div className="w-full max-w-xl relative">
                <motion.div 
                  className="p-0.5 rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                  animate={{ boxShadow: isRefreshing ? '0 0 15px rgba(99, 102, 241, 0.5)' : '0 0 0px rgba(99, 102, 241, 0)' }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                >
                  <div className="flex bg-white rounded-lg">
                    <div className="flex items-center pl-3 text-indigo-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={customTransformationInput}
                      onChange={(e) => setCustomTransformationInput(e.target.value)}
                      placeholder="Enter a transformation (e.g., 'simplify x² + 2x + 1')"
                      className="flex-grow px-3 py-3 rounded-l-md text-sm focus:outline-none focus:ring-0 border-0"
                      disabled={isRefreshing}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCustomTransformationSubmit();
                        }
                      }}
                    />
                    <motion.button
                      onClick={handleCustomTransformationSubmit}
                      disabled={!customTransformationInput.trim() || isRefreshing}
                      whileHover={!(!customTransformationInput.trim() || isRefreshing) ? { scale: 1.02 } : {}}
                      whileTap={!(!customTransformationInput.trim() || isRefreshing) ? { scale: 0.98 } : {}}
                      className={`px-4 py-3 rounded-r-md text-sm font-medium flex items-center gap-1 ${
                        !customTransformationInput.trim() || isRefreshing
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                      }`}
                    >
                      {isRefreshing ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Generate
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Error message display with animation */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm max-w-md mx-auto flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </motion.div>
          )}

          {/* Currently selected example display */}
          <div className="mb-4 flex items-center justify-center">
            <div className="bg-indigo-100 px-4 py-2 rounded-full text-sm text-indigo-800 font-medium flex items-center">
              <span>Now Viewing: </span>
              <span className="ml-1">{examples[selectedExample]?.title || 'Example'}</span>
              <button 
                onClick={() => setShowExampleDrawer(true)}
                className="ml-2 text-indigo-600 hover:text-indigo-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Main equation transformer component with loading state */}
          {isRefreshing ? (
            <div className="flex flex-col items-center justify-center h-60 bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-center items-center mb-4">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-t-4 border-b-4 border-indigo-500 animate-spin"></div>
                  <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-t-4 border-l-4 border-purple-500 animate-ping opacity-30"></div>
                </div>
              </div>
              <div className="text-indigo-700 font-medium">Generating your equation...</div>
              <div className="text-gray-500 text-sm mt-2">This might take a moment</div>
            </div>
          ) : hasValidSelectedExample ? (
            <EquationTransformer 
              steps={examples[selectedExample].steps} 
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-40 bg-white rounded-lg shadow-md p-6">
              <div className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-5/6 mx-auto"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
                  </div>
                </div>
              </div>
              <div className="text-gray-500 mt-4">Loading equation examples...</div>
            </div>
          )}

          {/* Navigation buttons with enhanced styling */}
          <div className="mt-auto flex justify-between pt-6">
            <motion.button
              onClick={onPrevious}
              disabled={isFirst}
              whileHover={!isFirst ? { scale: 1.05, x: -2 } : {}}
              whileTap={!isFirst ? { scale: 0.95 } : {}}
              className={`px-4 py-2 rounded-md shadow-sm text-sm flex items-center gap-1 ${
                isFirst 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-200'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Previous Slide
            </motion.button>
            
            {isLast ? (
              <motion.button
                onClick={() => alert('Course completed!')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-md shadow-sm
                        hover:from-green-600 hover:to-emerald-600 transition-all duration-300 text-sm font-medium flex items-center gap-1"
              >
                Complete Course
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.button>
            ) : (
              <motion.button
                onClick={onNext}
                whileHover={{ scale: 1.05, x: 2 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-md shadow-sm
                        hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 text-sm font-medium flex items-center gap-1"
              >
                Next Slide
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </motion.button>
            )}
          </div>
        </div>
      </SlideWrapper>
    </MathJaxContext>
  );
};
export default AnimatedEquationSlide;