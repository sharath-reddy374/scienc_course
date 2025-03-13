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

        const response = await client.beta.chat.completions.parse({
            model: "gpt-4o-mini",
            messages: [
                {
                    "role": "system",
                    "content": "You are an expert course content generator. You must always respond with valid JSON. Format your responses as a JSON object with the required structure for each slide type. For quiz questions, ensure the new question is different from any previous questions. Consider any additional requirements provided in the description."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            response_format: { type: "json_object" }
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

// Function to fetch detail content for a specific concept
export const fetchDetailContent = async (contentKey, context, selectedTopic) => {
  try {
      console.log('Fetching detail content for:', selectedTopic);
      console.log('With context:', context);
      
      // First, check if we already have this content
      if (context && context.details && context.details[selectedTopic]) {
          console.log('Using cached detail content for:', selectedTopic);
          return context.details[selectedTopic];
      }
      
      // Get the subject and topic from the course context
      const subject = context.subject || '';
      const topic = context.topic || '';
      
      // Get the selected concept's title
      const conceptTitle = context.concepts[selectedTopic]?.title;
      
      if (!conceptTitle) {
          console.error('No concept title found for selected topic:', selectedTopic);
          throw new Error('No concept title found for the selected topic');
      }
      
      // If not, fetch the content with detailed logging
      console.log('Preparing to call generateSlideContent with:');
      console.log('- Subject:', subject);
      console.log('- Topic:', topic);
      console.log('- Detail Prompt:', conceptTitle);
      
      const detailContent = await generateSlideContent('DETAIL', {
          subject,
          topic,
          detailPrompt: conceptTitle,
          // Add additional context that might be helpful
          courseContext: context
      });
      
      console.log('Received detail content:', detailContent);
      
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

/**
 * Fetches detailed content for a subtopic
 * @param {Object} courseData - The course data
 * @param {Number} questIndex - The index of the selected quest
 * @param {Number} subtopicIndex - The index of the selected subtopic
 * @param {String} sectionType - The specific section to generate (overview, keyPoints, examples, exercises, matchingExercises)
 * @param {Boolean} forceRefresh - Whether to force refresh the content
 * @returns {Promise<Object>} - The detailed content
 */
export const fetchSubtopicContent = async (courseData, questIndex, subtopicIndex, sectionType = 'overview', forceRefresh = false) => {
  try {
    console.log(`Fetching subtopic content for Quest ${questIndex}, Subtopic ${subtopicIndex}, Section ${sectionType}`);
    
    // Get the content from TOC slide first if needed
    let tocContent;
    if (!courseData.tocContent) {
      tocContent = await generateSlideContent('TOC', courseData);
    } else {
      tocContent = courseData.tocContent;
    }
    
    // Validate that we have a valid TOC structure
    if (!tocContent || !tocContent.quests || !Array.isArray(tocContent.quests)) {
      console.error('Invalid TOC content structure:', tocContent);
      return getFallbackSubtopicContent(sectionType);
    }
    
    // Get the quest information
    const quest = tocContent.quests[questIndex];
    if (!quest) {
      console.error(`Quest at index ${questIndex} not found`);
      return getFallbackSubtopicContent(sectionType);
    }
    
    // Make sure objectives array exists
    if (!quest.objectives || !Array.isArray(quest.objectives)) {
      console.error('Quest objectives not found:', quest);
      return getFallbackSubtopicContent(quest.title || 'Subtopic', sectionType);
    }
    
    // Get the objective for this subtopic
    const objective = quest.objectives[subtopicIndex];
    if (!objective) {
      console.error(`Objective at index ${subtopicIndex} not found`);
      return getFallbackSubtopicContent(quest.title || 'Subtopic', sectionType);
    }
    
    console.log(`Generating content for: ${quest.title} - ${objective}, Section: ${sectionType}`);
    
    // Check if content already exists for this section (if we're not forcing a refresh)
    if (!forceRefresh && 
        courseData.subtopicContent && 
        courseData.subtopicContent[questIndex] && 
        courseData.subtopicContent[questIndex][subtopicIndex]) {
      
      const existingContent = courseData.subtopicContent[questIndex][subtopicIndex];
      
      // If requesting specific section and it exists
      if (sectionType !== 'all' && 
          existingContent[sectionType] && 
          (typeof existingContent[sectionType] === 'string' || 
           (Array.isArray(existingContent[sectionType]) && existingContent[sectionType].length > 0))) {
        console.log(`Using existing ${sectionType} content`);
        return existingContent;
      }
    }
    
    // Create a prompt for this specific subtopic section
    const prompt = generateSectionPrompt(courseData, quest, objective, sectionType);
    
    // Call the OpenAI API
    const response = await client.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        {
          "role": "system",
          "content": "You are an expert course content generator. You must always respond with valid JSON. Format your responses as a JSON object with the required structure. Consider any additional requirements provided in the description. MOST IMPORTANTLY: You must create content that is directly relevant to the specific objective requested."
        },
        {
          "role": "user",
          "content": prompt
        }
      ],
      response_format: { type: "json_object" }
    });
    
    const content = response.choices[0].message.content;
    console.log(`API Response for subtopic ${sectionType}:`, content);
    
    try {
      const parsedContent = JSON.parse(content);
      
      // If we already have content for this subtopic, merge in the new section
      if (courseData.subtopicContent && 
          courseData.subtopicContent[questIndex] && 
          courseData.subtopicContent[questIndex][subtopicIndex] && 
          sectionType !== 'all') {
        
        const existingContent = courseData.subtopicContent[questIndex][subtopicIndex];
        
        // Return the merged content
        return {
          ...existingContent,
          [sectionType]: parsedContent[sectionType],
          title: existingContent.title || parsedContent.title
        };
      }
      
      // Otherwise return the newly generated content
      return parsedContent;
      
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      return getFallbackSubtopicContent(objective, sectionType);
    }
  } catch (error) {
    console.error('Error fetching subtopic content:', error);
    return getFallbackSubtopicContent(undefined, sectionType);
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
                   
                   Include exactly 4 quests, each with exactly 3 learning objectives and do not include "Quest" in the titles.`;
        
        
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

        case 'DETAIL':
            // Extract the detailed concept title from context
            const detailPrompt = context.detailPrompt || 'this concept';
                    
            // Ensure we have subject and topic, check multiple potential locations
            let detailSubject = context.subject || '';
            let detailTopic = context.topic || '';
            
            // If we have courseContext, try to get values from there as a fallback
            if (!detailSubject && context.courseContext && context.courseContext.subject) {
                detailSubject = context.courseContext.subject;
            }
            
            if (!detailTopic && context.courseContext && context.courseContext.topic) {
                detailTopic = context.courseContext.topic;
            }
            
            // Final fallbacks
            detailSubject = detailSubject || 'the subject';
            detailTopic = detailTopic || 'the topic';
            
            console.log(`Creating DETAIL slide for: ${detailSubject}: ${detailTopic} > ${detailPrompt}`);
            
            return `Create detailed educational content about ${detailSubject}: ${detailTopic}, focusing specifically on "${detailPrompt}".
                   
                   Format your response in this exact JSON structure:
                   {
                     "overview": "A thorough introduction to the concept in the context of ${detailSubject}: ${detailTopic}.",
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
                         "question": "A challenging question about ${detailPrompt}",
                         "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                         "correctAnswer": 0,
                         "explanation": "Why this answer is correct"
                       },
                       {
                         "question": "Another question testing understanding of ${detailPrompt}",
                         "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                         "correctAnswer": 1,
                         "explanation": "Why this answer is correct"
                       }
                     ]
                   }
                   
                   Include exactly 4 key points, 3 examples, 2 practice exercises.
                   Make sure each section is comprehensive and educational.
                   Make sure it matches the subject and the topic given above.
                   For the exercises, ensure the correctAnswer index matches the actual correct option (0-based indexing).
                   Include an explanation for each correct answer.`;
                                   
  


        case 'MEMORY':
          return `
            Create a memory matching game for "${subject}: ${topic}".
            ${description ? `Course description: ${description}` : ''}
            
            Design matching pairs of cards where each term is matched with its definition.
            
            Return your response in this exact JSON format:
            {
              "title": "Memory Game: ${topic}",
              "description": "Match each term with its correct definition to reinforce your learning",
              "cardPairs": [
                {
                  "term": "Term or concept from the subject",
                  "definition": "Definition or explanation of the term"
                }
              ]
            }
            
            Provide exactly 6 pairs of terms and definitions.
            Ensure all terms and definitions are directly related to ${topic}.
            Make sure the terms are concise (1-3 words), and definitions are brief (10-20 words).
            The definitions should be clear enough that students can understand the concept.
          `;
               
        case 'WELCOME':
          return `Create engaging welcome content for a course on ${topic} in ${subject}.
                  ${contextInfo}
                  
                  Return your response in this exact JSON format:
                  {
                    "title": "An engaging course title that includes the subject and topic",
                    "icon": "A single emoji that represents this subject area",
                    "tagline": "A short, catchy phrase that captures the essence of this course",
                    "description": "2-3 sentences welcoming the student and very briefly explaining what they will learn",
                    
                  }
                  
                  Make the content educational, engaging, and appropriate for an interactive learning experience.
                  Ensure the emoji icon is relevant to ${subject}.
                  The key points should highlight the most valuable things students will learn or experience.`;
    
        default:
            throw new Error('Invalid slide type');
    }
};

// Function to generate section-specific prompts for subtopic content
function generateSectionPrompt(courseData, quest, objective, sectionType) {
  // Base portion of the prompt that will be common to all sections
  const basePrompt = `
  Create extensive, comprehensive educational content about ${courseData.subject}: ${courseData.topic}, 
  focusing specifically on "${objective}" from the quest "${quest.title}".
  
  Your response MUST:
  - Be directly related to this specific objective: "${objective}"
  - Provide DETAILED and EXTENSIVE information - do not be brief or concise
  - Cover the topic with significant depth and breadth
  - Include specific details, not just general information
  - Be suitable for in-depth educational purposes
  
  The user needs comprehensive learning materials, so provide substantial, thorough content.
`;
  
  // If requesting all content, return the original full prompt
  if (sectionType === 'all') {
    return basePrompt + `
    Format your response in this exact JSON structure:
    {
      "title": "${quest.title} - ${objective}",
      "overview": "INTRODUCTION: Ecology is the study of the interactions between living organisms and their environment. Ecological interactions play a crucial role in shaping ecosystems and maintaining biodiversity. ---SECTION--- BACKGROUND: Different ecological interactions include competition, predation, mutualism, commensalism, and parasitism. These interactions influence population dynamics, species distribution, and ecosystem stability. ---SECTION--- SIGNIFICANCE: Understanding ecological interactions helps scientists predict how ecosystems respond to environmental changes and human activities.",
      "learningOutcomes": [
        "After studying this content, learners will be able to...",
        "Additional specific, measurable learning outcome"
      ],
      "keyPoints": [
        {
          "title": "Key Point Title",
          "description": "Detailed explanation of this key point with evidence-based information",
          "subpoints": [
            "Additional detail or nuance related to this key point",
            "Another important aspect of this key point"
          ],
          "sources": ["Optional citation or reference if applicable"]
        }
      ],
      "examples": [
        {
          "title": "Example Title",
          "scenario": "Detailed real-world application or illustration",
          "analysis": "Explanation of how this example demonstrates the concept",
          "reflection": "Questions or points for learners to consider about this example"
        }
      ],
      "exercises": [
        {
          "type": "multiple-choice",
          "difficulty": "beginner",
          "question": "A beginner-level question about ${objective}",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "correctAnswer": 0,
          "explanation": "Why this answer is correct and why others are incorrect"
        },
        {
          "type": "multiple-choice",
          "difficulty": "intermediate",
          "question": "An intermediate-level question about ${objective}",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "correctAnswer": 0,
          "explanation": "Why this answer is correct and why others are incorrect"
        },
        {
          "type": "multiple-choice",
          "difficulty": "advanced",
          "question": "An advanced-level question about ${objective} that tests deeper understanding",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "correctAnswer": 0,
          "explanation": "Why this answer is correct and why others are incorrect"
        }
      ],
      "matchingExercises": [
        {
          "type": "matching",
          "difficulty": "intermediate",
          "instructions": "Match the items on the left with their corresponding items on the right.",
          "leftItems": ["Item 1", "Item 2", "Item 3", "Item 4"],
          "rightItems": ["Definition 1", "Definition 2", "Definition 3", "Definition 4"],
          "correctPairs": [
            {"left": 0, "right": 2},
            {"left": 1, "right": 3},
            {"left": 2, "right": 0},
            {"left": 3, "right": 1}
          ],
          "explanations": [
            "Explanation for why Item 1 matches with Definition 3",
            "Explanation for why Item 2 matches with Definition 4",
            "Explanation for why Item 3 matches with Definition 1",
            "Explanation for why Item 4 matches with Definition 2"
          ]
        }
      ]
    }
    
    Guidelines to ensure educational quality and accuracy:
    
    1. Include 5-6 well-researched key points that are directly relevant to the objective
    2. Provide 2-3 concrete, realistic examples that clearly illustrate the concept
    3. Create 3 multiple-choice questions with different difficulty levels (beginner, intermediate, advanced)
    4. Create one matching exercise with at least 4 pairs to match
    5. For all factual claims, reference established knowledge in the field
    6. Address common misconceptions to prevent reinforcement of incorrect understandings
    7. For multiple-choice exercises, ensure the correctAnswer index matches the actual correct option (0-based indexing)
    8. For matching exercises, use 0-based indexing in the correctPairs objects
    9. Make sure options for multiple-choice questions are plausible but clearly have one best answer
    10. For advanced questions, test application of concepts rather than just recall
    
    JSON FORMATTING GUIDELINES:
    - Ensure all text in the JSON is properly escaped (e.g., no unescaped quotes, backslashes, or control characters)
    - Do not use special characters like tabs, newlines, or carriage returns within fields - use \\n for line breaks
    - For any quotation marks inside strings, use escaped quotes: \\"
    - Keep all text encoding as simple ASCII characters when possible
    - Avoid using special Unicode characters or non-printable characters
    - Use plain language without overly complex formatting
    - Remember that the response will be parsed as JSON, so it must be valid JSON syntax
    
    OVERVIEW STRUCTURE GUIDELINES:
    - Format the overview as a single string with special delimiter "---SECTION---" between sections
    - Include only three sections: INTRODUCTION, BACKGROUND, and SIGNIFICANCE
    - Each section should begin with its title in ALL CAPS followed by a colon,and it has to be atleast 4-5 lines
    - This approach allows your frontend to split the string by the delimiter and render each section separately
    - You can add code to your frontend that does: const sections = overview.split("---SECTION---")
    
    IMPORTANT CONSTRAINTS:
    - The content MUST focus specifically on "${objective}" and be relevant to "${quest.title}"
    - If you're uncertain about any specific details, indicate this clearly rather than inventing information
    - All examples should be realistic and accurate
    - Include only information that is widely accepted in the field
    - Do not make assumptions about cultural knowledge or background
    - Ensure inclusivity and diversity in examples where appropriate
    - For mathematical or scientific content, ensure all formulas and principles are accurate
    - Include descriptions for visual aids rather than attempting to create actual images
    `;
  }
  
  // For section-specific content, create targeted prompts
  let sectionSpecificPrompt = '';
  let expectedJsonStructure = '';
  
  switch(sectionType) {

    case 'overview':
  sectionSpecificPrompt = `
    FOCUS ON OVERVIEW:
    Create an extensive, comprehensive, and in-depth overview about "${objective}" in the context of "${quest.title}".
    
    The overview should include:
    - A thorough introduction explaining key concepts, importance, and foundational principles with at least 1 paragraph.
    - Detailed background information that provides historical context, theoretical frameworks, and evolution of knowledge
    - An extensive discussion of significance covering real-world applications, implications, and future directions
    
    IMPORTANT: Provide EXTENSIVE and DETAILED content - don't be brief or concise. The user needs comprehensive educational material.
    
    FORMAT THE OVERVIEW EXACTLY AS FOLLOWS:
    - Format your overview as a single string with "---SECTION---" as the exact delimiter between sections
    - The output must look like: "INTRODUCTION: [content] ---SECTION--- BACKGROUND: [content] ---SECTION--- SIGNIFICANCE: [content]"
    - Each section must start with its title in ALL CAPS followed by a colon
    - Do NOT use markdown headings like ## or ###
    - Do NOT change the delimiter text - it must be exactly "---SECTION---" 
    
    REQUIRED SECTIONS:
    1. INTRODUCTION: [detailed content]
    2. ---SECTION---
    3. BACKGROUND: [detailed content]
    4. ---SECTION---
    5. SIGNIFICANCE: [detailed content]
  `;
  
  expectedJsonStructure = `
    {
      "title": "${quest.title} - ${objective}",
      "overview": "INTRODUCTION: [detailed introduction about ${objective}] ---SECTION--- BACKGROUND: [detailed background information about ${objective}] ---SECTION--- SIGNIFICANCE: [detailed explanation of the significance of ${objective}]"
    }
  `;
break;
      
    case 'keyPoints':
      sectionSpecificPrompt = `
        FOCUS ON KEY POINTS:
  Create 5-7 extensive, well-researched key points about "${objective}" in the context of "${quest.title}".
  
  Each key point should:
  - Have a clear, descriptive title
  - Include an extensive explanation (at least 1-2 paragraphs) with evidence-based information
  - Be directly relevant to the specific objective
  - Cover different aspects of the topic in great depth with no redundancy
  - Be substantial, comprehensive, and educational
  - Include specific examples, case studies, or applications where appropriate
  
  IMPORTANT: Each key point should be extensive and thorough, not brief summaries.
`;
      
      expectedJsonStructure = `
        {
          "title": "${quest.title} - ${objective}",
          "keyPoints": [
            {
              "title": "Key Point Title 1",
              "description": "Detailed explanation of this key point"
            },
            {
              "title": "Key Point Title 2",
              "description": "Detailed explanation of this key point"
            },
            ... additional key points
          ]
        }
      `;
      break;
      
    case 'examples':
      sectionSpecificPrompt = `
        FOCUS ON EXAMPLES:
  Create 4-6 detailed, comprehensive examples that thoroughly illustrate "${objective}" in the context of "${quest.title}".
  
  Each example should:
  - Have a descriptive, specific title
  - Include an extensive real-world scenario with contextual details (at least 2-3 paragraphs)
  - Provide thorough analysis of how the example demonstrates the concept (at least 2-3 paragraphs)
  - Include practical implications, lessons learned, or takeaways
  - Be engaging, memorable, and highly educational
  - Represent diverse contexts and applications of the concept
  
  IMPORTANT: These should be extensive case studies, not brief examples.
`;
      
      expectedJsonStructure = `
        {
          "title": "${quest.title} - ${objective}",
          "examples": [
            {
              "title": "Example Title 1",
              "scenario": "Detailed real-world scenario",
              "analysis": "Explanation of how this example demonstrates the concept"
            },
            {
              "title": "Example Title 2",
              "scenario": "Detailed real-world scenario",
              "analysis": "Explanation of how this example demonstrates the concept"
            },
            ... additional examples
          ]
        }
      `;
      break;
      
    case 'exercises':
      sectionSpecificPrompt = `
        FOCUS ON EXERCISES:
        Create 4-5 multiple-choice questions about "${objective}" in the context of "${quest.title}".
        
        The exercises should:
        - Cover different difficulty levels (beginner, intermediate, advanced)
        - Test understanding, application, and critical thinking
        - Have 4 plausible options with one clear best answer
        - Include detailed explanations for why the correct answer is right
        - Use correctAnswer index to indicate the right option (0-based indexing)
      `;
      
      expectedJsonStructure = `
        {
          "title": "${quest.title} - ${objective}",
          "exercises": [
            {
              "type": "multiple-choice",
              "difficulty": "beginner",
              "question": "A well-formulated question about ${objective}",
              "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
              "correctAnswer": 0,
              "explanation": "Why this answer is correct and others are incorrect"
            },
            ... additional exercises with increasing difficulty
          ]
        }
      `;
      break;
      case 'matchingExercises':
      sectionSpecificPrompt = `
        FOCUS ON MATCHING EXERCISES:
        Create one comprehensive matching exercise about "${objective}" in the context of "${quest.title}".
        
        The matching exercise should:
        - Include 4-6 pairs of items to match
        - Have clear, relevant terms on the left and definitions on the right
        - Include detailed explanations for why each pair matches
        - Use 0-based indexing in the correctPairs objects
        - Test understanding of key terminology and concepts
      `;
      
      expectedJsonStructure = `
        {
          "title": "${quest.title} - ${objective}",
          "matchingExercises": [
            {
              "type": "matching",
              "difficulty": "intermediate",
              "instructions": "Match the items on the left with their corresponding items on the right.",
              "leftItems": ["Item 1", "Item 2", "Item 3", "Item 4"],
              "rightItems": ["Definition 1", "Definition 2", "Definition 3", "Definition 4"],
              "correctPairs": [
                {"left": 0, "right": 2},
                {"left": 1, "right": 3},
                {"left": 2, "right": 0},
                {"left": 3, "right": 1}
              ],
              "explanations": [
                "Explanation for why Item 1 matches with Definition 3",
                "Explanation for why Item 2 matches with Definition 4",
                "Explanation for why Item 3 matches with Definition 1",
                "Explanation for why Item 4 matches with Definition 2"
              ]
            }
          ]
        }
      `;
      break;
      
    default:
      sectionSpecificPrompt = `
        Create comprehensive educational content about "${objective}" in the context of "${quest.title}".
        
        Include detailed information that is:
        - Accurate and evidence-based
        - Directly relevant to the specific objective
        - Educational and informative
        - Well-structured and clear
      `;
      
      expectedJsonStructure = `
        {
          "title": "${quest.title} - ${objective}",
          "${sectionType}": "Content for ${sectionType}"
        }
      `;
      break;
  }
  
  // Combine base prompt with section-specific instructions
  return `${basePrompt}
  
  ${sectionSpecificPrompt}
  
  Format your response in this exact JSON structure:
  ${expectedJsonStructure}
  
  JSON FORMATTING GUIDELINES:
  - Ensure all text in the JSON is properly escaped (e.g., no unescaped quotes)
  - Do not use special characters like tabs or newlines within fields - use \\n for line breaks
  - For any quotation marks inside strings, use escaped quotes: \\"
  - Keep all text encoding as simple ASCII characters when possible
  
  IMPORTANT CONSTRAINTS:
  - The content MUST focus specifically on "${objective}" and be relevant to "${quest.title}"
  - If you're uncertain about any specific details, indicate this clearly
  - All examples should be realistic and accurate
  - Include only information that is widely accepted in the field
  `;
}

/**
 * Provides fallback content for a subtopic if the API fails
 * @param {String} subtopicTitle - The title or description of the subtopic
 * @returns {Object} - Fallback content
 */
const getFallbackSubtopicContent = (subtopicTitle = "Subtopic Overview", sectionType = 'all') => {
  const fullContent = {
    title: subtopicTitle,
    overview: "This section covers important concepts and principles related to this topic. Understanding these fundamentals will help you build a strong foundation in this subject area.",
    keyPoints: [
      {
        title: "Key Concept 1",
        description: "This is a fundamental concept that forms the basis of understanding this subtopic."
      },
      {
        title: "Key Concept 2", 
        description: "Another important principle that builds upon the first concept and extends our understanding."
      },
      {
        title: "Practical Application",
        description: "How these concepts are applied in real-world scenarios and their practical significance."
      }
    ],
    examples: [
      {
        title: "Example 1",
        scenario: "A practical demonstration of these concepts in action.",
        analysis: "How this example illustrates the key concepts discussed."
      },
      {
        title: "Example 2", 
        scenario: "Another scenario where these principles are applied.",
        analysis: "What we can learn from this particular application."
      }
    ],
    exercises: [
      {
        question: `Which of the following best describes the main concept of ${subtopicTitle}?`,
        options: [
          "A comprehensive explanation aligned with the content",
          "An incorrect or partially correct statement",
          "A statement that misinterprets the concept",
          "A completely unrelated concept"
        ],
        correctAnswer: 0,
        explanation: "The first option correctly identifies the core concept as explained in the overview and key points."
      }
    ],
    matchingExercises: [
      {
        type: "matching",
        difficulty: "intermediate",
        instructions: "Match the items on the left with their corresponding items on the right.",
        leftItems: ["Concept 1", "Concept 2", "Concept 3", "Concept 4"],
        rightItems: ["Definition 1", "Definition 2", "Definition 3", "Definition 4"],
        correctPairs: [
          {left: 0, right: 2},
          {left: 1, right: 3},
          {left: 2, right: 0},
          {left: 3, right: 1}
        ],
        explanations: [
          "Explanation for why Concept 1 matches with Definition 3",
          "Explanation for why Concept 2 matches with Definition 4",
          "Explanation for why Concept 3 matches with Definition 1",
          "Explanation for why Concept 4 matches with Definition 2"
        ]
      }
    ]
  };

  // If requesting a specific section, return only that section
  if (sectionType !== 'all' && sectionType in fullContent) {
    return {
      title: subtopicTitle,
      [sectionType]: fullContent[sectionType]
    };
  }
  
  return fullContent;
};

/**
 * Fetches quiz content based on the course data
 * @param {Object} courseData - The course data object
 * @returns {Promise<Object>} - The quiz content
 */
export const fetchQuizContent = async (courseData) => {
  try {
    console.log('Fetching quiz content for course:', courseData.title);
    
    // Generate content for quiz
    const content = await generateSlideContent('QUIZ', courseData);
    
    return content;
  } catch (error) {
    console.error('Error fetching quiz content:', error);
    
    // Return fallback quiz content in case of API error
    return getQuizFallbackContent(courseData);
  }
};

/**
 * Provides fallback quiz content in case the API fails
 * @param {Object} courseData - The course data
 * @returns {Object} - Fallback quiz content
 */
export const getQuizFallbackContent = (courseData) => {
  return {
    title: "Knowledge Check: " + courseData.title,
    questions: [
      {
        text: "What is the main focus of this course?",
        options: [
          `Learning about ${courseData.title}`,
          "General knowledge",
          "Advanced topics only",
          "Unrelated subjects"
        ],
        correctIndex: 0
      },
      {
        text: "Why is this topic important?",
        options: [
          "It's not important",
          `It helps understand ${courseData.title} better`,
          "Only for academic purposes",
          "For entertainment only"
        ],
        correctIndex: 1
      },
      {
        text: "How would you apply this knowledge?",
        options: [
          "It has no practical applications",
          "Only in theoretical scenarios",
          "Only in specific industries",
          "In various real-world situations"
        ],
        correctIndex: 3
      },
      {
        text: `Which of these is NOT a key aspect of ${courseData.title}?`,
        options: [
          "Understanding core concepts",
          "Applying practical skills",
          "Memorizing unrelated facts",
          "Developing problem-solving abilities"
        ],
        correctIndex: 2
      },
      {
        text: "What is the best approach to learning this subject?",
        options: [
          "Passive reading only",
          "Interactive practice and application",
          "Memorization without understanding",
          "Skipping fundamental concepts"
        ],
        correctIndex: 1
      }
    ]
  };
};

/**
 * Fetches memory game content based on the course data
 * @param {Object} courseData - The course data object
 * @returns {Promise<Object>} - The memory game content
 */
export const fetchMemoryContent = async (courseData) => {
  try {
    console.log('Fetching memory game content for course:', courseData.title);
    
    // Generate content for memory game
    const content = await generateSlideContent('MEMORY', courseData);
    
    return content;
  } catch (error) {
    console.error('Error fetching memory game content:', error);
    
    // Return fallback memory content in case of API error
    return getMemoryFallbackContent(courseData);
  }
};

/**
 * Provides fallback memory game content in case the API fails
 * @param {Object} courseData - The course data
 * @returns {Object} - Fallback memory game content
 */
export const getMemoryFallbackContent = (courseData) => {
  return {
    title: "Memory Game: " + courseData.title,
    description: "Match each term with its correct definition to reinforce your understanding of key concepts.",
    cardPairs: [
      {
        term: `${courseData.title} Term 1`,
        definition: "Definition of the first important concept from this course."
      },
      {
        term: `${courseData.title} Term 2`,
        definition: "Definition of the second important concept from this course."
      },
      {
        term: `${courseData.title} Term 3`,
        definition: "Definition of the third important concept from this course."
      },
      {
        term: `${courseData.title} Term 4`,
        definition: "Definition of the fourth important concept from this course."
      },
      {
        term: `${courseData.title} Term 5`,
        definition: "Definition of the fifth important concept from this course."
      },
      {
        term: `${courseData.title} Term 6`,
        definition: "Definition of the sixth important concept from this course."
      }
    ]
  };
};

/**
 * Fetches welcome slide content based on the course data
 * @param {Object} courseData - The course data object
 * @returns {Promise<Object>} - The welcome slide content
 */
export const fetchWelcomeContent = async (courseData) => {
  try {
    console.log('Fetching welcome content for course:', courseData.title);
    
    // Create a more structured prompt WITHOUT features
    const prompt = `Create engaging welcome content for a course on ${courseData.topic || 'this topic'} in ${courseData.subject || 'this subject'}.
    
    Return your response in this exact JSON format:
    {
      "title": "An engaging course title that includes the subject and topic",
      "icon": "A single emoji that represents this subject area",
      "tagline": "A short, catchy phrase that captures the essence of this course",
      "description": "1-2 sentences welcoming the student and explaining what they will learn in this course. Make this description inspiring and motivational."
    }
    
    Make the content educational, engaging, and appropriate for an interactive learning experience.
    Your response MUST be a valid JSON object with no additional text.
    For the description, focus on creating an exciting introduction that makes students eager to start learning.`;
    
    // Generate content for welcome slide with explicit response format
    const response = await client.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        {
          "role": "system",
          "content": "You are an expert course content generator. You must always respond with valid JSON. Format your responses as a JSON object with no additional text. Ensure all property names are double-quoted."
        },
        {
          "role": "user",
          "content": prompt
        }
      ],
     response_format: { type: "json_object" }
    });
    
    const content = response.choices[0].message.content;
    console.log('API Response (first 100 chars):', content.substring(0, 100));
    
    try {
      // Sanitize the content before parsing
      const sanitizedContent = sanitizeJsonResponse(content);
      console.log('Sanitized content (first 100 chars):', sanitizedContent.substring(0, 100));
      
      const parsedContent = JSON.parse(sanitizedContent);
      
      // Validate required fields to ensure the structure is correct
      if (!parsedContent.title || !parsedContent.description) {
        console.error('Invalid welcome content structure:', parsedContent);
        return getWelcomeFallbackContent(courseData);
      }
      
      return parsedContent;
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw content:', content);
      
      // Try to recover with more aggressive sanitization if possible
      try {
        const aggressivelySanitized = attemptJsonRecovery(content);
        const recoveredContent = JSON.parse(aggressivelySanitized);
        console.log('Successfully recovered JSON with aggressive sanitization');
        return recoveredContent;
      } catch (recoveryError) {
        console.error('Failed to recover JSON:', recoveryError);
        // Fall back to default content
        return getWelcomeFallbackContent(courseData);
      }
    }
  } catch (error) {
    console.error('Error fetching welcome content:', error);
    console.error('Error details:', error.response?.data);
    
    // Return fallback content in case of API error
    return getWelcomeFallbackContent(courseData);
  }
};




function sanitizeJsonResponse(response) {
  if (!response) return '{}';
  
  // Trim whitespace
  let content = response.trim();
  
  // Remove any non-JSON text before the first curly brace
  const firstBrace = content.indexOf('{');
  if (firstBrace > 0) {
    content = content.substring(firstBrace);
  }
  
  // Remove any non-JSON text after the last curly brace
  const lastBrace = content.lastIndexOf('}');
  if (lastBrace !== -1 && lastBrace < content.length - 1) {
    content = content.substring(0, lastBrace + 1);
  }
  
  // Handle common OpenAI response formatting issues
  // Remove "```json" and "```" markers that might be included
  content = content.replace(/^```json\s*/g, '').replace(/\s*```$/g, '');
  
  return content;
}

// More aggressive JSON recovery function for badly malformed responses
function attemptJsonRecovery(response) {
  let content = response.trim();
  
  // Extract everything between the first { and last }
  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    content = content.substring(firstBrace, lastBrace + 1);
  }
  
  // Fix common issues with property names
  content = content
    // Ensure property names are quoted
    .replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3')
    // Fix double quotes within already quoted strings
    .replace(/"([^"]*)""/g, '"$1\\"')
    // Remove control characters
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
  
  // As a last resort, try to build a minimal valid structure
  if (!isValidJson(content)) {
    console.log('Building minimal valid structure as last resort');
    
    // Extract key values with regex where possible
    const title = extractValue(content, 'title') || 'Course Title';
    const icon = extractValue(content, 'icon') || '🔍';
    const tagline = extractValue(content, 'tagline') || 'Explore this fascinating subject';
    const description = extractValue(content, 'description') || 'Welcome to this engaging course.';
    
    // Create a minimal valid JSON object
    return JSON.stringify({
      title,
      icon,
      tagline,
      description
    });
  }
  
  return content;
}

// Helper to check if a string is valid JSON
function isValidJson(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

// Helper to extract values with regex as a last resort
function extractValue(content, key) {
  const regex = new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`, 'i');
  const match = content.match(regex);
  return match ? match[1] : null;
}

/**
 * Provides fallback welcome content without feature tiles
 * @param {Object} courseData - The course data
 * @returns {Object} - Fallback welcome content
 */
export const getWelcomeFallbackContent = (courseData) => {
  const subject = courseData.subject || 'Science';
  const topic = courseData.topic || 'This Course';
  
  // Generate appropriate icon based on subject
  let icon = '🔍'; // Default
  if (subject.toLowerCase().includes('biology')) {
    icon = '🧬';
  } else if (subject.toLowerCase().includes('physics')) {
    icon = '⚛️';
  } else if (subject.toLowerCase().includes('chemistry')) {
    icon = '🧪';
  } else if (subject.toLowerCase().includes('math')) {
    icon = '📊';
  } else if (subject.toLowerCase().includes('computer')) {
    icon = '💻';
  } else if (subject.toLowerCase().includes('earth') || subject.toLowerCase().includes('geo')) {
    icon = '🌎';
  }
  
  return {
    title: `${subject}: ${topic}`,
    icon: icon,
    tagline: `Discover the fascinating world of ${topic} through interactive learning`,
    description: `Welcome to this comprehensive exploration of ${topic} in ${subject}. This course is designed to provide you with a solid understanding of key concepts through interactive lessons, visual explanations, and hands-on activities. Get ready to embark on an exciting journey through the world of ${subject}!`
  };
};

/**
 * Fetches course summary content based on the course data
 * @param {Object} courseData - The course data object
 * @returns {Promise<Object>} - The summary content
 */
export const fetchSummaryContent = async (courseData) => {
  try {
    console.log('Fetching summary content for course:', courseData.title);
    
    // Generate content for summary - simplified to only what's needed
    const prompt = `Create a summary for the following course:
      Subject: ${courseData.subject || ''}
      Topic: ${courseData.topic || ''}
      ${courseData.description ? `Description: ${courseData.description}` : ''}
      
      The summary should include:
      1. A concise overview of the course (2-3 paragraphs)
      2. 4-6 key learning points from the course
      
      Please structure your response in JSON format as follows:
      {
        "title": "Course title",
        "overview": "A concise overview of the course",
        "keyLearnings": [
          {"title": "Key learning point 1", "description": "Description of the learning point"},
          {"title": "Key learning point 2", "description": "Description of the learning point"}
        ]
      }
      
      Ensure all content is educational, relevant, and directly related to ${courseData.topic || 'the course subject'}.
    `;
    
    const response = await client.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        {
          "role": "system",
          "content": "You are an expert course content generator. Generate concise, educational summaries in valid JSON format."
        },
        {
          "role": "user",
          "content": prompt
        }
      ],
      response_format: { type: "json_object" }
    });
    
    const content = response.choices[0].message.content;
    
    try {
      const parsedContent = JSON.parse(content);
      
      // If we have TOC content, add the quests to the summary
      if (courseData.tocContent && courseData.tocContent.quests) {
        parsedContent.quests = courseData.tocContent.quests;
      }
      
      return parsedContent;
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      return getSummaryFallbackContent(courseData);
    }
  } catch (error) {
    console.error('Error fetching summary content:', error);
    return getSummaryFallbackContent(courseData);
  }
};

/**
 * Provides fallback summary content in case the API fails
 * @param {Object} courseData - The course data
 * @returns {Object} - Fallback summary content
 */
export const getSummaryFallbackContent = (courseData) => {
  const subject = courseData.subject || 'Science';
  const topic = courseData.topic || 'This Course';
  
  // Get quests from TOC content if available
  const quests = courseData.tocContent?.quests || [];
  
  return {
    title: `${subject}: ${topic}`,
    overview: `This course provided an introduction to ${topic} within the field of ${subject}. You've learned about key concepts, principles, and applications through interactive lessons and exercises.`,
    keyLearnings: [
      {
        title: "Fundamental Concepts",
        description: `Understanding the core principles of ${topic}`
      },
      {
        title: "Practical Applications",
        description: `Applying ${topic} concepts to real-world scenarios`
      },
      {
        title: "Critical Analysis",
        description: `Developing analytical skills related to ${topic}`
      },
      {
        title: "Problem-Solving",
        description: `Learning strategies to address challenges in ${topic}`
      }
    ],
    quests: quests
  };
};



export default generateSlideContent;