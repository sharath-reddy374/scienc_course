// src/services/contextTracker.js
// This service helps track and maintain consistent course context throughout the application

// Store the current course context
let currentCourseContext = {
    subject: '',
    topic: '',
    description: '',
    timestamp: Date.now()
  };
  
  // Update the course context
  export const updateCourseContext = (newContext) => {
    console.log('Updating course context:', newContext);
    
    // Merge the new context with the existing one
    currentCourseContext = {
      ...currentCourseContext,
      ...newContext,
      timestamp: Date.now() // Update the timestamp
    };
    
    // Log the updated context
    console.log('Current course context is now:', currentCourseContext);
    
    return currentCourseContext;
  };
  
  // Get the current course context
  export const getCourseContext = () => {
    return {...currentCourseContext};
  };
  
  // Add course context to any object
  export const withCourseContext = (obj) => {
    return {
      ...obj,
      courseContext: getCourseContext()
    };
  };
  
  export default {
    updateCourseContext,
    getCourseContext,
    withCourseContext
  };