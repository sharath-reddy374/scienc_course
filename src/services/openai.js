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
                    "content": "You are an expert course content generator. You must always respond with valid JSON. Format your responses as a JSON object with the required structure for each slide type. For quiz questions, ensure the new question is different from any previous questions."
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
            return JSON.parse(content);
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

const getSlidePrompt = (slideType, context, options = {}) => {
    const { subject, topic } = context;
    
    switch (slideType) {
        case 'TOC':
            return `Create a course outline for ${subject}: ${topic}. 
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
            const additionalQuizInstructions = options.regenerateQuiz 
                ? "Generate a completely new quiz question that is different from any previous questions. Ensure the new question tests a different aspect of the topic." 
                : "";

            return `Create an introduction for ${subject}: ${topic}. 
                   ${additionalQuizInstructions}
                   Return your response in this exact JSON format:
                   {
                     "description": "course description",
                     "quiz": {
                       "question": "quiz question",
                       "options": ["option1", "option2", "option3", "option4"],
                       "correctIndex": 0
                     }
                   }`;
        
        case 'TYPES':
            return `Create detailed content about ${topic} in ${subject}. 
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
                   Include exactly 4 concepts, each with exactly 3 points.`;
        
        default:
            throw new Error('Invalid slide type');
    }
};

export default generateSlideContent;