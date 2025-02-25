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
                      - Provide at least one paragraph explaining the key concepts, background, and relevance of "${topic}" in the context of "${subject}".
                      - Highlight real-life applications or examples to show why this topic is important.
                      - If a description is provided, incorporate it meaningfully into your introduction.
                
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
                      
                      ${context.challengeTypes ? `Focus on ONE of these specific challenge types: ${context.challengeTypes.join(', ')}` : ''}
                      
                      ${context.avoidRepeats && context.previousExamples ? `IMPORTANT: Avoid creating challenges similar to these recent examples: ${context.previousExamples}` : ''}
                      
                      Return your response in the following exact JSON format:
                      {
                        "type": string,         // Specific subtype of math challenge (be detailed, e.g. "logarithmic_properties", "geometric_series")
                        "question": string,     // The challenge question text - make it clear and educationally valuable
                        "target": string,       // The expected answer or target value
                        "hint": string          // Optional hint that could help a student who is stuck (do not give the exact answer)
                      }
                      
                      For different difficulty levels, follow these guidelines:
                      
                      Easy:
                      - Simple arithmetic or basic algebraic operations
                      - Clear objectives with straightforward solutions
                      - Limited to basic concepts like addition, subtraction, multiplication, division
                      - Number patterns, basic fraction operations
                      - Questions should be approachable by students with minimal mathematical background
                      
                      Medium:
                      - Intermediate algebra, basic calculus, or logical reasoning
                      - May require multiple steps to solve
                      - Can include quadratic equations, basic derivatives, logarithm properties
                      - Trigonometric identities, coordinate geometry
                      - Questions should challenge a high school mathematics student
                      
                      Hard:
                      - Advanced concepts in calculus, logic, or abstract mathematics
                      - Requires deep understanding of mathematical principles
                      - Can include integration, complex logical statements, or set theory
                      - Differential equations, complex number operations, abstract algebra concepts
                      - Questions should challenge an undergraduate mathematics student
                      
                      BE CREATIVE! Don't just use standard textbook problems. Create challenges that:
                      1. Develop critical thinking
                      2. Connect different areas of mathematics
                      3. Relate to real-world applications when possible
                      4. Challenge the student to think in new ways
                      
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
                     "Example 1 with specific details",
                     "Example 2 with specific details",
                     "Example 3 with specific details"
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
                   ],
                   "resources": [
                     {
                       "title": "Further Resource Title",
                       "description": "Description of how this resource helps understand ${context.detailPrompt}"
                     },
                     {
                       "title": "Another Resource Title",
                       "description": "Description of this resource's value"
                     }
                   ]
                 }
                 
                 Include exactly 4 key points, 3 examples, 2 practice exercises, and 3 resources.
                 Make sure each section is comprehensive and educational.
                 For the exercises, ensure the correctAnswer index matches the actual correct option (0-based indexing).`;

        case 'MATCHING':
            return `Create a matching exercise for ${topic} in ${subject}. 
                    Provide 4 pairs of matching terms and definitions. Return as JSON:
                    {
                      "items": [
                        { "term": "First term", "definition": "Definition for first term" },
                        { "term": "Second term", "definition": "Definition for second term" },
                        { "term": "Third term", "definition": "Definition for third term" },
                        { "term": "Fourth term", "definition": "Definition for fourth term" }
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
    
        default:
            throw new Error('Invalid slide type');
    }
};

export default generateSlideContent;