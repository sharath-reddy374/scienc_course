// import OpenAI from "openai";
// import { z } from "zod";
// import { zodResponseFormat } from "openai/helpers/zod";

// const openai = new OpenAI();

// const slide_gen = z.object({
//   slide: z.string()
// });

// const completion = await openai.beta.chat.completions.parse({
//   model: "gpt-4o-mini",
//   messages: [
//     { role: "system", content: "You are a helpful math tutor. Guide the user through the solution step by step." },
//     { role: "user", content: "Generate a welcome slide in " },
//   ],
//   response_format: zodResponseFormat(slide_gen, "slides"),
// });

// const slidegen = completion.choices[0].message.parsed;



// "Create engaging welcome content for a course on ${topic} in ${subject}.${contextInfo}"
// "Return your response in this exact JSON format:"
                  
//                     "title: An engaging course title that includes the subject and topic,"
//                     "icon: A single emoji that represents this subject area,"
//                     "tagline: A short, catchy phrase that captures the essence of this course,"
//                    "description: 2-3 sentences welcoming the student and very briefly explaining what they will learn,"
// "Make the content educational, engaging, and appropriate for an interactive learning experience."
//                   "Ensure the emoji icon is relevant to ${subject}."
//                   "The key points should highlight the most valuable things students will learn or experience."

