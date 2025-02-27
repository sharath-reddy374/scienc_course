// src/services/openai.js
import OpenAI from 'openai';

const client = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
});

export const generateSlideContent = async (slideType, context, options = {}) => {
    try {
        console.log('Making API call for:', slideType);
        console.log('Context:', context);
        console.log('Options:', options);
        
        const prompt = getSlidePrompt(slideType, context, options);
        console.log('Using prompt:', prompt);

        const response = await client.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    "role": "system",
                    "content": "You are an expert course content generator. You must always respond with valid JSON. Format your responses as a JSON object with the required structure for each slide type. For quiz questions, ensure the new question is different from any previous questions. Consider any additional requirements provided in the description."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        });
        
        const content = response.choices[0].message.content;
        console.log('API Response:', content);
        
        try {
            const parsedContent = JSON.parse(content);
            
            // For TYPES slide, if we're requesting detailed content, add it to the existing types content
            if (slideType === 'TYPES' && options.selectedTopic !== undefined) {
                // If this is a request for detail content for a specific topic
                return parsedContent;
            }
            
            // For TYPES slide without a selected topic, initialize the details object
            if (slideType === 'TYPES' && !options.selectedTopic) {
                return {
                    concepts: parsedContent.concepts,
                    details: {} // Initialize empty details object
                };
            }
            
            // Handle the case where we're fetching detail content for a specific concept
            if (slideType === 'DETAIL') {
                return parsedContent;
            }
            
            return parsedContent;
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            throw new Error('Failed to parse API response as JSON');
        }
    } catch (error) {
        console.error('OpenAI API Error:', {
            message: error.message,
            details: error.response?.data,
            status: error.response?.status
        });
        throw error;
    }
};

// A new function to fetch detail content for a specific concept
export const fetchDetailContent = async (contentKey, context, selectedTopic) => {
    try {
        // First, check if we already have this content
        if (context && context.details && context.details[selectedTopic]) {
            return context.details[selectedTopic];
        }
        
        // If not, fetch the content
        const detailContent = await generateSlideContent('DETAIL', {
            ...context,
            detailPrompt: context.concepts[selectedTopic].title
        });
        
        // Return the new content
        return {
            ...context,
            details: {
                ...context.details,
                [selectedTopic]: detailContent
            }
        };
    } catch (error) {
        console.error('Error fetching detail content:', error);
        throw error;
    }
};

const getSlidePrompt = (slideType, context, options = {}) => {
    const { 
        subject, 
        topic, 
        description = ''
    } = context;
    
    // Build contextual information
    const contextInfo = `
        Subject: ${subject}
        Topic: ${topic}
        ${description ? `Additional Details: ${description}` : ''}
    `;
    
    switch (slideType) {
        case 'TOC':
            return `Create a course outline for the following course:
                   ${contextInfo}
                   
                   Return your response in this exact JSON format:
                   {
                     "title": "Course Title",
                     "quests": [
                       {
                         "title": "Quest Title",
                         "objectives": ["objective 1", "objective 2", "objective 3"]
                       }
                     ]
                   }
                   
                   Include exactly 4 quests, each with exactly 3 learning objectives.`;
        
                   case 'INTRO':
                    const quizQuestionInstruction = `
                      Generate a completely new and unique quiz question that is based on the provided course description (if available). 
                      Ensure the quiz question does not repeat any previous questions and tests a different aspect of the topic.
                    `;
                  
                    return `
                      Create a thorough introduction for the following course:
                      ${contextInfo}
                  
                      The introduction should:
                  -     Provide at least one paragraph explaining the key concepts, background, and relevance of "${topic}" in the context of "${subject}".
                  +     Provide at least one paragraph explaining the key concepts, background, and relevance of "${topic}" in the context of "${subject}".
                  +     Use Markdown formatting where appropriate. For example:
                  +       - Bullet points for lists
                  +       - Separate paragraphs with blank lines
                  +       - Bold or italic text for emphasis
                  +     Include at least one bulleted list to demonstrate important points or examples.
                  
                      ${quizQuestionInstruction}
                  
                      Return your response in this exact JSON format:
                      {
                        "description": "course description",
                        "quiz": {
                          "question": "quiz question",
                          "options": ["option1", "option2", "option3", "option4"],
                          "correctIndex": 0
                        }
                      }
                    `;
                  
                
        
        case 'TYPES':
            return `Create detailed content about ${topic} in ${subject} for the following course:
                   ${contextInfo}
                   
                   Return your response in this exact JSON format:
                   {
                     "concepts": [
                       {
                         "title": "concept title",
                         "icon": "emoji icon",
                         "points": [
                           {
                             "title": "point title",
                             "description": "point description"
                           }
                         ]
                       }
                     ]
                   }
                   
                   Include exactly 4 concepts, each with exactly 3 points.
                   Each concept should have a unique, relevant emoji icon.
                   Ensure all concepts are foundational aspects of ${topic}.`;

       
                   case 'EQUATION_VALIDATION':
                    return `You are an expert mathematics tutor. Validate whether the user's mathematical expression is equivalent to or correctly solves the given challenge.
                    
                    Challenge question: ${context.question}
                    Expected target: ${context.target}
                    Challenge type: ${context.type}
                    User's expression: ${context.userExpression}
                    
                    Return your evaluation in the following JSON format:
                    {
                      "isValid": boolean,       // true if the user's expression is valid/equivalent, false otherwise
                      "explanation": string,    // detailed explanation of why the answer is valid or invalid
                      "hints": [string],        // array of helpful hints if the answer is incorrect (empty array if answer is correct)
                      "alternativeSolutions": [string]  // other valid approaches if the answer is correct (empty array if incorrect)
                    }
                    
                    Consider all mathematically equivalent forms while being precise about mathematical properties. For example:
                    
                    - For logarithm properties:
                      - log(xy) = log(x) + log(y)
                      - log(x/y) = log(x) - log(y)
                      - log(x^n) = n·log(x)
                    
                    - For algebraic equivalences, ensure expressions like "x^2 + 2x + 1" and "(x+1)^2" are recognized as equivalent
                    
                    - For calculus:
                      - Verify that derivatives and integrals follow correct rules
                      - Ensure proper application of the chain rule, product rule, etc.
                    
                    Be rigorous in your validation. Mathematical equivalence must be precise - do not accept incorrect applications of mathematical properties.
                    
                    For example, if asked to express log(xy) using separate logarithms, only log(x) + log(y) is correct. 
                    An expression like log(x) × log(y) or log(x) ÷ log(y) would be incorrect.
                    
                    Evaluate strictly but explain clearly. If the user's expression is close but has errors, explain precisely what is wrong.
                    
                    Provide meaningful, educational feedback regardless of whether the answer is correct or incorrect.`;


                    
                    case 'EQUATION_CHALLENGE':
                          return `You are an expert mathematics tutor. Create a NEW and UNIQUE mathematical challenge appropriate for a ${context.difficulty} difficulty level in the subject of ${context.subject}.
                          
                          This is request #${context.timestamp}-${context.seed}-${context.requestVersion || 'v1'}, please ensure this challenge is different from any you've created before.
                          
                          IMPORTANT CONSTRAINT: The challenge MUST be solvable using ONLY the following tokens available in the UI:
                          
                          Numbers: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, π, e
                          Variables: x, y, z, n, α, β, θ, i
                          Operators: +, -, ×, ÷, =, ≠, ≤, ≥, <, >, (, )
                          Functions: sin, cos, tan, log, √, ∫, Σ, lim
                          Special: ^, dx, dy, d, ∂, →, ⇒
                          Logic: ∀, ∃, →, ∧, ∨, ¬, ⊤, ⊥, T
                          Sets: ∈, ⊂, ⊆, ∪, ∩, ∅, \\
                          
                          ${context.challengeTypes ? `Focus on ONE of these specific challenge types: ${context.challengeTypes.join(', ')}` : ''}
                          
                          ${context.avoidRepeats && context.previousExamples ? `IMPORTANT: Avoid creating challenges similar to these recent examples: ${context.previousExamples}` : ''}
                          
                          Return your response in the following exact JSON format:
                          {
                            "type": string,         // Specific subtype of math challenge (be detailed, e.g. "logarithmic_properties", "geometric_series")
                            "question": string,     // The challenge question text - make it clear and educationally valuable
                            "target": string,       // The expected answer or target value that can be built using ONLY the available tokens
                            "hint": string          // Optional hint that could help a student who is stuck (do not give the exact answer)
                          }
                          
                          For different difficulty levels, follow these guidelines:
                          
                          Easy:
                          - Simple arithmetic or basic algebraic operations
                          - Clear objectives with straightforward solutions
                          - Limited to basic concepts like addition, subtraction, multiplication, division
                          - Number patterns, basic fraction operations
                          - Questions should be approachable by students with minimal mathematical background
                          - The question must be solvable using the following only ( Numbers: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, π and operators: +,-,x, ÷,(,),=)
                          
                          Medium:
                          - Intermediate algebra, basic calculus, or logical reasoning
                          - May require multiple steps to solve
                          - Can include quadratic equations, basic derivatives, logarithm properties
                          - Trigonometric identities, coordinate geometry
                          - Questions should challenge a high school mathematics student
                          - The questions should be single line answers, do not include "prove" questions
                          
                          Hard:
                          - concepts in calculus, logic, or abstract mathematics
                          - Requires deep understanding of mathematical principles
                          - Can include integration, complex logical statements, or set theory
                          - Differential equations, complex number operations, abstract algebra concepts
                          - Questions should challenge an undergraduate mathematics student
                          - The questions should be single line answers, do not include "prove" questions
                          
                          BE CREATIVE! Don't just use standard textbook problems. Create challenges that:
                          1. Develop critical thinking
                          2. Connect different areas of mathematics
                          3. Relate to real-world applications when possible
                          4. Challenge the student to think in new ways
                          
                          VERY IMPORTANT:
                          - Verify that BOTH the question and the target solution can be expressed using ONLY the tokens listed above
                          - The target should be a mathematical expression or equation that can be constructed by dragging and dropping the available tokens
                          - Do not use any symbols, functions, or operators that are not in the token list
                          - Avoid problems requiring extensive algebraic manipulations that would need too many symbols
                          
                          Ensure the JSON is valid and the challenge is appropriate for the specified difficulty level.`;
  case 'DETAIL':
          return `Create detailed educational content about "${context.detailPrompt}" in the context of ${subject}: ${topic}.
                 
                 Format your response in this exact JSON structure:
                 {
                   "overview": "A thorough introduction to the concept (1-2 paragraphs)",
                   "keyPoints": [
                     {
                       "title": "Key Point Title",
                       "description": "Detailed explanation of this key point"
                     }
                   ],
                   "examples": [
                     "1 with specific details",
                     "2 with specific details",
                     "3 with specific details"
                   ],
                   "exercises": [
                     {
                       "question": "A challenging question about ${context.detailPrompt}",
                       "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                       "correctAnswer": 0
                     },
                     {
                       "question": "Another question testing understanding of ${context.detailPrompt}",
                       "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                       "correctAnswer": 1
                     }
                   ]
                 }
                 
                 Include exactly 4 key points, 3 examples, 2 practice exercises.
                 Make sure each section is comprehensive and educational.
                 For the exercises, ensure the correctAnswer index matches the actual correct option (0-based indexing).`;



                 
                 case 'MATCHING':
                  // Add a timestamp and random seed to ensure varied content each time
                  const seed = Math.floor(Math.random() * 10000);
                  const timestamp = new Date().getTime();
                  
                  return `Create a BRAND NEW matching exercise for ${topic} in ${subject}. 
                          IMPORTANT: Generate completely different terms than any previous request.
                          This is request ID: ${timestamp}-${seed}, ensure the content is unique.
                          
                          Provide 4 pairs of matching terms and definitions, focusing on different aspects 
                          of ${topic} than might have been covered in previous requests.
                          
                          Return as JSON:
                          {
                            "items": [
                              { "term": "First unique term", "definition": "Definition for first term" },
                              { "term": "Second unique term", "definition": "Definition for second term" },
                              { "term": "Third unique term", "definition": "Definition for third term" },
                              { "term": "Fourth unique term", "definition": "Definition for fourth term" }
                            ]
                          }`;
  
        case 'QUIZ':
            return `Create an interactive quiz for ${subject}: ${topic}. 
                Return your response in this exact JSON format:
                {
                  "questions": [
                    {
                      "question": "Write a clear, specific question about ${topic}",
                      "options": [
                        "A clear first option",
                        "A clear second option",
                        "A clear third option",
                        "A clear fourth option"
                      ],
                      "correctAnswer": 0,
                      "explanation": "Detailed explanation of why the first option is correct"
                    }
                  ]
                }
                Important: Do NOT include any indication of which answer is correct in the option text.
                Do NOT add words like "(correct answer)" in the options.
                Make each option clear and concise.
                Provide exactly 5 questions, each with 4 options.
                Make questions progressively harder.
                Ensure all options are plausible.`;


                case 'ANIMATED_EQUATION':
                  return `You are an expert mathematics teacher. Create a step-by-step equation transformation that shows how to ${context.transformationType || 'solve a linear equation'}.
                
                  Please return your response in the following JSON format:
                  {
                    "title": "Short descriptive title of the transformation",
                    "steps": [
                      {
                        "equation": "The LaTeX equation at this step",
                        "explanation": "Clear explanation of what happens in this step"
                      },
                      // Add more steps following the same format
                    ]
                  }
                  
                  IMPORTANT FORMATTING INSTRUCTIONS FOR EQUATIONS:
                  - Do NOT wrap LaTeX in \\( \\) or \\[ \\] delimiters - these will be added by the client
                  - Use proper LaTeX notation for all mathematical expressions 
                  - For complex expressions like fractions, use display-style formatting: \\dfrac instead of \\frac
                  - Ensure proper spacing in equations using \\, \\; or \\quad where appropriate
                  - For trigonometric functions, use \\sin, \\cos, \\tan, etc. (not sin, cos, tan)
                  - When using fractions, ensure they're properly formatted: \\dfrac{numerator}{denominator}
                  - Use \\cdot for multiplication instead of * or ×
                  - Use proper subscripts with _ and superscripts with ^ and group with {} when needed
                  - For math expressions in explanations, wrap them in dollar signs: $expression$
                  - Example: "Apply the formula $a^2 + b^2 = c^2$ to the right side."
                  - Use consistent formatting for variables and mathematical terms in both equations and explanations
                  - Ensure trigonometric functions, fractions, and special symbols use proper LaTeX in explanations too
                  - For example, use $\\sin(x)$ not $sin(x)$ in explanations
                  
                  Make sure the steps are logical and clear, with each step showing a small, incremental change.
                  Each step should include a concise explanation suitable for students.
                  Include 4-7 steps total, depending on the complexity of the transformation.
                  
                  For example, if asked to solve "2x + 5 = 13", your response would walk through subtracting 5 from both sides, then dividing by 2 to isolate x.
                  If asked to factor "x^2 - 5x + 6", your response would show the steps to identify the factors (x-2) and (x-3).
                  `;
            
                

                  case 'PROBABILITY_SIMULATOR':
                    return `Create content for a Probability Simulator in the context of ${subject}: ${topic}.
                           
                           This simulator will allow students to explore statistical concepts through interactive probability experiments.
                           
                           Return your response in this exact JSON format:
                           {
                             "theory": {
                               "title": "String - Descriptive title for the probability theory section",
                               "description": "String - Overview of probability concepts relevant to ${topic}",
                               "sections": [
                                 {
                                   "title": "String - Name of theoretical concept",
                                   "content": "String - Detailed explanation of the concept"
                                 }
                               ]
                             },
                             "challenges": [
                               {
                                 "title": "String - Name of the probability challenge",
                                 "description": "String - Description of a task for students to complete using the simulator"
                               }
                             ]
                           }
                           
                           Include at least 2 theory sections focusing on concepts like expected value, the law of large numbers, probability distributions, etc.
                           Include 2-3 challenges that encourage students to use the simulator to explore probability concepts.
                           Customize all content to be relevant to ${topic} in ${subject}.`;



    
        default:
            throw new Error('Invalid slide type');
    }
};

export const fetchProbabilitySimulatorContent = async (context) => {
  try {
    console.log("Fetching probability simulator content");
    
    // Generate content for the probability simulator
    const content = await generateSlideContent('PROBABILITY_SIMULATOR', context);
    
    // Return the content
    return content;
  } catch (error) {
    console.error('Error fetching probability simulator content:', error);
    
    // Return fallback content in case of API error
    return {
      theory: {
        title: "Understanding Probability",
        description: "Probability is a branch of mathematics that deals with calculating the likelihood of a given event's occurrence. Let's explore how experimental probability approaches theoretical probability as the number of trials increases.",
        sections: [
          {
            title: "Law of Large Numbers",
            content: "As the number of trials of a random process increases, the experimental probability approaches the theoretical probability. For example, flipping a fair coin many times will result in approximately 50% heads and 50% tails."
          },
          {
            title: "Expected Value",
            content: "The expected value of a random variable is the weighted average of all possible values, where the weights are the probabilities of each value occurring. For dice rolls, the expected value of a single die is 3.5, and for two dice it's 7."
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
        },
        {
          title: "Approach to Theoretical",
          description: "Run the coin flip experiment with 10, 50, 100, and 1000 trials. Observe how the experimental probability approaches the theoretical probability of 50% heads with increasing trials."
        }
      ]
    };
  }
};


export const fetchAnimatedEquation = async (transformationType) => {
  console.log("Fetching animated equation for:", transformationType);
  
  try {
    // Make API call through generateSlideContent
    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          "role": "system",
          "content": "You are an expert mathematics teacher. Create step-by-step equation transformations with LaTeX notation. Always respond with valid JSON containing a title and an array of steps."
        },
        {
          "role": "user",
          "content": `Create a step-by-step equation transformation that shows how to ${transformationType}.
          
          Return your response in this exact JSON format:
          {
            "title": "Short descriptive title of the transformation",
            "steps": [
              {
                "equation": "The LaTeX equation at this step, wrapped in \\\\( \\\\)",
                "explanation": "Clear explanation of what happens in this step"
              }
            ]
          }
          
          Make sure the steps are logical and clear, with each step showing an incremental change.
          Use proper LaTeX notation for all mathematical expressions.
          Each step should include a concise explanation suitable for students.
          Include 4-7 steps total, depending on the complexity of the transformation.`
        }
      ]
    });
    
    const content = response.choices[0].message.content;
    console.log("Raw API response:", content);
    
    try {
      // Parse the JSON response
      const parsedContent = JSON.parse(content);
      
      // Validate the response structure
      if (!parsedContent.title || !parsedContent.steps || !Array.isArray(parsedContent.steps)) {
        throw new Error("Invalid response format from API");
      }
      
      return parsedContent;
    } catch (parseError) {
      console.error("JSON Parse error:", parseError);
      throw new Error("Failed to parse API response as JSON");
    }
  } catch (error) {
    console.error("API Error:", error);
    
    // Return a fallback example in case of API errors
    return {
      title: "Example: Solving a Linear Equation",
      steps: [
        {
          equation: "\\(2x + 5 = 13\\)",
          explanation: "We start with our linear equation."
        },
        {
          equation: "\\(2x + 5 - 5 = 13 - 5\\)",
          explanation: "Subtract 5 from both sides to isolate the variable term."
        },
        {
          equation: "\\(2x = 8\\)",
          explanation: "Simplify both sides of the equation."
        },
        {
          equation: "\\(\\frac{2x}{2} = \\frac{8}{2}\\)",
          explanation: "Divide both sides by 2 to isolate x."
        },
        {
          equation: "\\(x = 4\\)",
          explanation: "And we have our solution!"
        }
      ]
    };
  }
};



export default generateSlideContent;