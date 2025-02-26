import React, { useState, useEffect, useRef } from 'react';
import SlideWrapper from '../common/SlideWrapper';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ProbabilitySimulatorSlide = ({ courseData, content, onNext, onPrevious, onRefreshContent, isRefreshing }) => {
  // Experiment Types
  const EXPERIMENTS = {
    COIN: 'coin',
    DICE: 'dice',
    CUSTOM: 'custom'
  };

  // State
  const [activeSection, setActiveSection] = useState('simulator'); // 'simulator' or 'theory'
  const [experimentType, setExperimentType] = useState(EXPERIMENTS.COIN);
  const [numberOfTrials, setNumberOfTrials] = useState(10);
  const [animationSpeed, setAnimationSpeed] = useState(500); // ms
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [customOptions, setCustomOptions] = useState([
    { label: 'Option 1', probability: 1 },
    { label: 'Option 2', probability: 1 }
  ]);
  const [diceCount, setDiceCount] = useState(1);
  const [showDistribution, setShowDistribution] = useState(true);
  
  // Animation references
  const animationRef = useRef(null);
  const completedTrials = useRef(0);

  // Use API content if available, otherwise use default content
  const experimentContent = content || {
    theory: {
      title: "Understanding Probability",
      description: "Probability is a branch of mathematics that deals with calculating the likelihood of a given event's occurrence. Learn how experimental probability approaches theoretical probability as the number of trials increases.",
      sections: [
        {
          title: "Law of Large Numbers",
          content: "As the number of trials of a random process increases, the experimental probability approaches the theoretical probability. For example, flipping a fair coin many times will result in approximately 50% heads and 50% tails."
        },
        {
          title: "Expected Value",
          content: "The expected value of a random variable is the weighted average of all possible values, where the weights are the probabilities of each value occurring."
        }
      ]
    },
    challenges: [
      {
        title: "Find the Expected Value",
        description: "If you roll two dice, what is the expected sum? Run at least 100 trials and compare with the theoretical expected value of 7."
      },
      {
        title: "Test Your Intuition",
        description: "Create a custom probability experiment with 3 outcomes. Before running the simulation, predict the frequency of each outcome. Then run at least 50 trials to check your intuition."
      }
    ]
  };

  // Calculate statistics based on results
  useEffect(() => {
    if (results.length === 0) return;

    // Count occurrences of each outcome
    const counts = {};
    let total = results.length;
    
    results.forEach(result => {
      if (counts[result]) {
        counts[result]++;
      } else {
        counts[result] = 1;
      }
    });

    // Calculate frequencies
    const frequencies = {};
    Object.keys(counts).forEach(key => {
      frequencies[key] = (counts[key] / total) * 100;
    });

    // Calculate theoretical probabilities
    let theoreticalProbabilities = {};
    
    if (experimentType === EXPERIMENTS.COIN) {
      theoreticalProbabilities = {
        Heads: 50,
        Tails: 50
      };
    } else if (experimentType === EXPERIMENTS.DICE) {
      if (diceCount === 1) {
        // Single die
        for (let i = 1; i <= 6; i++) {
          theoreticalProbabilities[i] = 100 / 6;
        }
      } else if (diceCount === 2) {
        // Two dice (sum)
        for (let i = 2; i <= 12; i++) {
          // Calculate probability for each possible sum
          let ways = 0;
          for (let j = 1; j <= 6; j++) {
            for (let k = 1; k <= 6; k++) {
              if (j + k === i) ways++;
            }
          }
          theoreticalProbabilities[i] = (ways / 36) * 100;
        }
      }
    } else if (experimentType === EXPERIMENTS.CUSTOM) {
      const totalWeight = customOptions.reduce((sum, option) => sum + option.probability, 0);
      customOptions.forEach(option => {
        theoreticalProbabilities[option.label] = (option.probability / totalWeight) * 100;
      });
    }

    // Prepare chart data
    const chartData = [];
    const allKeys = new Set([...Object.keys(counts), ...Object.keys(theoreticalProbabilities)]);
    
    allKeys.forEach(key => {
      chartData.push({
        name: key,
        Experimental: frequencies[key] || 0,
        Theoretical: theoreticalProbabilities[key] || 0
      });
    });

    // Sort chart data for better visualization
    chartData.sort((a, b) => {
      // For dice, sort numerically
      if (!isNaN(a.name) && !isNaN(b.name)) {
        return parseInt(a.name) - parseInt(b.name);
      }
      // For other experiments, sort alphabetically
      return a.name.localeCompare(b.name);
    });

    // Set statistics state
    setStatistics({
      counts,
      frequencies,
      theoreticalProbabilities,
      chartData,
      total
    });
  }, [results, experimentType, diceCount, customOptions]);

  // Handle running the experiment
  const runExperiment = () => {
    if (isRunning) return;
    
    // Reset results and counter
    setResults([]);
    completedTrials.current = 0;
    setIsRunning(true);
    
    // Start animation
    animationRef.current = setInterval(() => {
      if (completedTrials.current >= numberOfTrials) {
        clearInterval(animationRef.current);
        setIsRunning(false);
        return;
      }
      
      // Generate a new result based on experiment type
      const result = generateResult();
      
      setResults(prev => [...prev, result]);
      completedTrials.current++;
    }, animationSpeed);
  };

  // Generate a random result based on experiment type
  const generateResult = () => {
    if (experimentType === EXPERIMENTS.COIN) {
      return Math.random() < 0.5 ? 'Heads' : 'Tails';
    } else if (experimentType === EXPERIMENTS.DICE) {
      if (diceCount === 1) {
        // Single die
        return Math.floor(Math.random() * 6) + 1;
      } else if (diceCount === 2) {
        // Two dice (sum)
        const die1 = Math.floor(Math.random() * 6) + 1;
        const die2 = Math.floor(Math.random() * 6) + 1;
        return die1 + die2;
      }
    } else if (experimentType === EXPERIMENTS.CUSTOM) {
      // Custom probability distribution
      const totalWeight = customOptions.reduce((sum, option) => sum + option.probability, 0);
      let random = Math.random() * totalWeight;
      
      for (const option of customOptions) {
        if (random < option.probability) {
          return option.label;
        }
        random -= option.probability;
      }
      
      // Fallback (should not reach here)
      return customOptions[0].label;
    }
  };

  // Stop experiment
  const stopExperiment = () => {
    if (animationRef.current) {
      clearInterval(animationRef.current);
      setIsRunning(false);
    }
  };

  // Reset experiment
  const resetExperiment = () => {
    stopExperiment();
    setResults([]);
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, []);

  // Handle adding a new custom option
  const addCustomOption = () => {
    if (customOptions.length < 10) {
      setCustomOptions([
        ...customOptions,
        { label: `Option ${customOptions.length + 1}`, probability: 1 }
      ]);
    }
  };

  // Handle removing a custom option
  const removeCustomOption = (index) => {
    if (customOptions.length > 2) {
      setCustomOptions(customOptions.filter((_, i) => i !== index));
    }
  };

  // Handle updating a custom option
  const updateCustomOption = (index, field, value) => {
    const updatedOptions = [...customOptions];
    updatedOptions[index] = { 
      ...updatedOptions[index], 
      [field]: field === 'probability' ? parseFloat(value) || 0 : value 
    };
    setCustomOptions(updatedOptions);
  };

  // Get the appropriate controls based on experiment type
  const renderExperimentControls = () => {
    switch (experimentType) {
      case EXPERIMENTS.COIN:
        return (
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h3 className="font-medium text-indigo-800 mb-3">Coin Flip Settings</h3>
            <p className="text-sm text-indigo-600 mb-4">A simple coin toss with equal probability of heads or tails.</p>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="w-full md:w-1/2">
                <label className="block text-sm font-medium text-indigo-700 mb-1">
                  Number of Flips
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={numberOfTrials}
                  onChange={(e) => setNumberOfTrials(Math.min(1000, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-full p-2 border border-indigo-300 rounded-md"
                  disabled={isRunning}
                />
              </div>
              <div className="w-full md:w-1/2">
                <label className="block text-sm font-medium text-indigo-700 mb-1">
                  Animation Speed (ms)
                </label>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="50"
                  value={animationSpeed}
                  onChange={(e) => setAnimationSpeed(parseInt(e.target.value))}
                  className="w-full"
                  disabled={isRunning}
                />
                <div className="text-xs text-indigo-600">{animationSpeed}ms</div>
              </div>
            </div>
          </div>
        );
      
      case EXPERIMENTS.DICE:
        return (
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h3 className="font-medium text-indigo-800 mb-3">Dice Roll Settings</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-indigo-700 mb-1">
                Number of Dice
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setDiceCount(1)}
                  className={`px-4 py-2 rounded-md ${
                    diceCount === 1 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white text-indigo-600 border border-indigo-300'
                  }`}
                  disabled={isRunning}
                >
                  1 Die
                </button>
                <button
                  onClick={() => setDiceCount(2)}
                  className={`px-4 py-2 rounded-md ${
                    diceCount === 2 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white text-indigo-600 border border-indigo-300'
                  }`}
                  disabled={isRunning}
                >
                  2 Dice (Sum)
                </button>
              </div>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="w-full md:w-1/2">
                <label className="block text-sm font-medium text-indigo-700 mb-1">
                  Number of Rolls
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={numberOfTrials}
                  onChange={(e) => setNumberOfTrials(Math.min(1000, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-full p-2 border border-indigo-300 rounded-md"
                  disabled={isRunning}
                />
              </div>
              <div className="w-full md:w-1/2">
                <label className="block text-sm font-medium text-indigo-700 mb-1">
                  Animation Speed (ms)
                </label>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="50"
                  value={animationSpeed}
                  onChange={(e) => setAnimationSpeed(parseInt(e.target.value))}
                  className="w-full"
                  disabled={isRunning}
                />
                <div className="text-xs text-indigo-600">{animationSpeed}ms</div>
              </div>
            </div>
          </div>
        );
      
      case EXPERIMENTS.CUSTOM:
        return (
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h3 className="font-medium text-indigo-800 mb-3">Custom Probability Settings</h3>
            <p className="text-sm text-indigo-600 mb-4">Create your own probability distribution by adjusting the relative weights of each outcome.</p>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-indigo-700">
                  Outcomes and Probabilities
                </label>
                <button
                  onClick={addCustomOption}
                  className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 transition-colors"
                  disabled={isRunning || customOptions.length >= 10}
                >
                  + Add Option
                </button>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {customOptions.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={option.label}
                      onChange={(e) => updateCustomOption(index, 'label', e.target.value)}
                      className="flex-1 p-2 text-sm border border-indigo-300 rounded-md"
                      placeholder="Option label"
                      disabled={isRunning}
                    />
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={option.probability}
                      onChange={(e) => updateCustomOption(index, 'probability', e.target.value)}
                      className="w-20 p-2 text-sm border border-indigo-300 rounded-md"
                      placeholder="Weight"
                      disabled={isRunning}
                    />
                    <button
                      onClick={() => removeCustomOption(index)}
                      className="text-red-500 hover:text-red-700 disabled:text-gray-400"
                      disabled={isRunning || customOptions.length <= 2}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="w-full md:w-1/2">
                <label className="block text-sm font-medium text-indigo-700 mb-1">
                  Number of Trials
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={numberOfTrials}
                  onChange={(e) => setNumberOfTrials(Math.min(1000, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-full p-2 border border-indigo-300 rounded-md"
                  disabled={isRunning}
                />
              </div>
              <div className="w-full md:w-1/2">
                <label className="block text-sm font-medium text-indigo-700 mb-1">
                  Animation Speed (ms)
                </label>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="50"
                  value={animationSpeed}
                  onChange={(e) => setAnimationSpeed(parseInt(e.target.value))}
                  className="w-full"
                  disabled={isRunning}
                />
                <div className="text-xs text-indigo-600">{animationSpeed}ms</div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Get the last result for display
  const getLastResult = () => {
    if (results.length === 0) return null;
    return results[results.length - 1];
  };

  // Render visual representation of the last result
  const renderLastResult = () => {
    const lastResult = getLastResult();
    if (lastResult === null) return null;

    if (experimentType === EXPERIMENTS.COIN) {
      return (
        <div className="flex justify-center items-center">
          <div className={`
            w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold 
            ${lastResult === 'Heads' ? 'bg-yellow-400 text-yellow-800' : 'bg-gray-300 text-gray-800'}
          `}>
            {lastResult === 'Heads' ? 'H' : 'T'}
          </div>
        </div>
      );
    } else if (experimentType === EXPERIMENTS.DICE) {
      if (diceCount === 1) {
        // Single die
        return (
          <div className="flex justify-center items-center">
            <div className="w-16 h-16 bg-white border-2 border-red-500 rounded-lg flex items-center justify-center text-2xl font-bold text-red-500">
              {lastResult}
            </div>
          </div>
        );
      } else {
        // Two dice (sum)
        // Here we need to reverse-engineer the dice values (for display only)
        // We'll just show a representation of the sum
        return (
          <div className="flex flex-col items-center">
            <div className="text-lg font-semibold text-indigo-800 mb-1">Sum: {lastResult}</div>
            <div className="flex space-x-2">
              <div className="w-12 h-12 bg-white border-2 border-red-500 rounded-lg flex items-center justify-center text-xl font-bold text-red-500">
                ?
              </div>
              <div className="w-12 h-12 bg-white border-2 border-red-500 rounded-lg flex items-center justify-center text-xl font-bold text-red-500">
                ?
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1">(Showing the sum, not actual dice)</div>
          </div>
        );
      }
    } else if (experimentType === EXPERIMENTS.CUSTOM) {
      // Custom experiment
      return (
        <div className="flex justify-center items-center">
          <div className="bg-gradient-to-r from-purple-400 to-indigo-500 text-white px-6 py-3 rounded-lg text-lg font-semibold">
            {lastResult}
          </div>
        </div>
      );
    }
  };

  return (
    <SlideWrapper className="bg-gradient-to-br from-purple-50 to-blue-100 relative">
      {/* Overlay spinner for refreshing */}
      {isRefreshing && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      )}
      <div className="w-full h-full flex flex-col p-4 md:p-8">
        {/* Title & Navigation */}
        <div className="text-center mb-4 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-indigo-800 mb-3 md:mb-4">
            Probability Simulator: {courseData?.topic || 'Statistics'}
          </h1>
          <div className="flex justify-center space-x-2 md:space-x-4">
            <button
              onClick={() => setActiveSection('simulator')}
              className={`px-3 py-1 md:px-6 md:py-2 text-sm md:text-base rounded-full transition-all duration-300 ${
                activeSection === 'simulator'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              Interactive Simulator
            </button>
            <button
              onClick={() => setActiveSection('theory')}
              className={`px-3 py-1 md:px-6 md:py-2 text-sm md:text-base rounded-full transition-all duration-300 ${
                activeSection === 'theory'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              Probability Theory
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-5xl">
            {activeSection === 'simulator' ? (
              // Simulator Section
              <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8 transform transition-all duration-500">
                <div className="flex flex-col space-y-6">
                  {/* Experiment Type Selection */}
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <h3 className="font-medium text-indigo-800 mb-3">Select Experiment Type</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        onClick={() => {
                          if (!isRunning) setExperimentType(EXPERIMENTS.COIN);
                        }}
                        className={`p-3 rounded-md transition-all ${
                          experimentType === EXPERIMENTS.COIN
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-indigo-600 border border-indigo-300 hover:bg-indigo-50'
                        } ${isRunning ? 'opacity-70 cursor-not-allowed' : ''}`}
                        disabled={isRunning}
                      >
                        <div className="text-2xl mb-1">🪙</div>
                        <div className="font-medium">Coin Flip</div>
                      </button>
                      <button
                        onClick={() => {
                          if (!isRunning) setExperimentType(EXPERIMENTS.DICE);
                        }}
                        className={`p-3 rounded-md transition-all ${
                          experimentType === EXPERIMENTS.DICE
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-indigo-600 border border-indigo-300 hover:bg-indigo-50'
                        } ${isRunning ? 'opacity-70 cursor-not-allowed' : ''}`}
                        disabled={isRunning}
                      >
                        <div className="text-2xl mb-1">🎲</div>
                        <div className="font-medium">Dice Roll</div>
                      </button>
                      <button
                        onClick={() => {
                          if (!isRunning) setExperimentType(EXPERIMENTS.CUSTOM);
                        }}
                        className={`p-3 rounded-md transition-all ${
                          experimentType === EXPERIMENTS.CUSTOM
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-indigo-600 border border-indigo-300 hover:bg-indigo-50'
                        } ${isRunning ? 'opacity-70 cursor-not-allowed' : ''}`}
                        disabled={isRunning}
                      >
                        <div className="text-2xl mb-1">⚖️</div>
                        <div className="font-medium">Custom Probabilities</div>
                      </button>
                    </div>
                  </div>

                  {/* Experiment Controls */}
                  {renderExperimentControls()}

                  {/* Run Controls */}
                  <div className="flex justify-center space-x-4">
                    {!isRunning ? (
                      <button
                        onClick={runExperiment}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors"
                      >
                        Run Experiment
                      </button>
                    ) : (
                      <button
                        onClick={stopExperiment}
                        className="bg-red-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-red-700 transition-colors"
                      >
                        Stop
                      </button>
                    )}
                    <button
                      onClick={resetExperiment}
                      className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg text-lg font-semibold hover:bg-gray-300 transition-colors"
                      disabled={isRunning || results.length === 0}
                    >
                      Reset
                    </button>
                  </div>

                  {/* Results Display */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Current Result */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-indigo-800 mb-3 text-center">Current Result</h3>
                      <div className="h-32 flex items-center justify-center">
                        {results.length > 0 ? (
                          renderLastResult()
                        ) : (
                          <div className="text-gray-400 text-center">
                            Run the experiment to see results
                          </div>
                        )}
                      </div>
                      <div className="text-center mt-4">
                        <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm">
                          {results.length} of {numberOfTrials} trials completed
                        </span>
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-indigo-800 mb-3 text-center">Statistics</h3>
                      <div className="h-32 overflow-y-auto">
                        {results.length > 0 ? (
                          <div className="space-y-2">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-indigo-100">
                                  <th className="p-1 text-left">Outcome</th>
                                  <th className="p-1 text-right">Count</th>
                                  <th className="p-1 text-right">Frequency</th>
                                  <th className="p-1 text-right">Expected</th>
                                </tr>
                              </thead>
                              <tbody>
                                {statistics.chartData?.map((item, index) => (
                                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                    <td className="p-1">{item.name}</td>
                                    <td className="p-1 text-right">{statistics.counts?.[item.name] || 0}</td>
                                    <td className="p-1 text-right">{item.Experimental.toFixed(1)}%</td>
                                    <td className="p-1 text-right">{item.Theoretical.toFixed(1)}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-gray-400 text-center">
                            No data available
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Distribution Chart */}
                  {results.length > 0 && showDistribution && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium text-indigo-800">Probability Distribution</h3>
                        <button
                          onClick={() => setShowDistribution(!showDistribution)}
                          className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300 transition-colors"
                        >
                          Hide Chart
                        </button>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={statistics.chartData}
                            margin={{
                              top: 5,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis label={{ value: 'Frequency (%)', angle: -90, position: 'insideLeft' }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Experimental" fill="#6366f1" name="Experimental" />
                            <Bar dataKey="Theoretical" fill="#d1d5db" name="Theoretical" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Challenges Section */}
                  {experimentContent.challenges && experimentContent.challenges.length > 0 && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-medium text-green-800 mb-3">Probability Challenges</h3>
                      <div className="space-y-3">
                        {experimentContent.challenges.map((challenge, index) => (
                          <div key={index} className="bg-white p-3 rounded border border-green-200">
                            <h4 className="font-medium text-green-800">{challenge.title}</h4>
                            <p className="text-sm text-green-700 mt-1">{challenge.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Theory Section
              <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8 transform transition-all duration-500">
                <h2 className="text-xl md:text-2xl font-semibold text-indigo-800 mb-4">
                  {experimentContent.theory.title}
                </h2>
                <p className="text-indigo-700 mb-6">
                  {experimentContent.theory.description}
                </p>
                
                <div className="space-y-6">
                  {experimentContent.theory.sections.map((section, index) => (
                    <div key={index} className="bg-indigo-50 p-4 rounded-lg">
                      <h3 className="font-medium text-indigo-800 mb-2">{section.title}</h3>
                      <p className="text-indigo-600">{section.content}</p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-medium text-yellow-800 mb-2">Key Principles to Remember</h3>
                  <ul className="list-disc pl-5 space-y-2 text-yellow-700">
                    <li>Probability is always expressed as a value between 0 (impossible) and 1 (certain).</li>
                    <li>The sum of probabilities for all possible outcomes in a sample space equals 1.</li>
                    <li>For independent events, the probability of them occurring together is the product of their individual probabilities.</li>
                    <li>Experimental probability approaches theoretical probability as the number of trials increases (Law of Large Numbers).</li>
                  </ul>
                </div>
                
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setActiveSection('simulator')}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Try the Simulator →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-4 md:mt-8">
          <button
            onClick={onPrevious}
            className="bg-white text-indigo-600 px-3 py-2 md:px-6 md:py-2 rounded-full shadow-md
                     hover:bg-indigo-50 transition-all duration-300 hover:scale-105 text-sm md:text-base"
          >
            ← Prev
          </button>
          <button
            onClick={onNext}
            className="bg-indigo-600 text-white px-3 py-2 md:px-6 md:py-2 rounded-full shadow-md
                     hover:bg-indigo-700 transition-all duration-300 hover:scale-105 text-sm md:text-base"
          >
            Next →
          </button>
        </div>
      </div>
    </SlideWrapper>
  );
};

export default ProbabilitySimulatorSlide;