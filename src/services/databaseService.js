import { database } from '../firebase';
import { ref, set, get, child } from "firebase/database";

// Database service for Realtime Database
const DatabaseService = {
  // Store slide content
  async storeSlideContent(courseId, contentKey, content) {
    try {
      await set(ref(database, `courses/${courseId}/slides/${contentKey}`), {
        content,
        courseId,
        updatedAt: new Date().toISOString()
      });
      console.log(`Stored ${contentKey} content for course ${courseId} in database`);
      return true;
    } catch (error) {
      console.error(`Error storing ${contentKey} content for course ${courseId}:`, error);
      return false;
    }
  },

  // Get slide content
  async getSlideContent(courseId, contentKey) {
    try {
      const snapshot = await get(child(ref(database), `courses/${courseId}/slides/${contentKey}`));
      
      if (snapshot.exists()) {
        return snapshot.val().content;
      } else {
        console.log(`No ${contentKey} content found in database for course ${courseId}`);
        return null;
      }
    } catch (error) {
      console.error(`Error getting ${contentKey} content for course ${courseId}:`, error);
      return null;
    }
  },

  // Store subtopic content
  async storeSubtopicContent(courseId, questIndex, subtopicIndex, content) {
    try {
      const key = `quest_${questIndex}_subtopic_${subtopicIndex}`;
      await set(ref(database, `courses/${courseId}/subtopics/${key}`), {
        content,
        courseId,
        questIndex,
        subtopicIndex,
        updatedAt: new Date().toISOString()
      });
      console.log(`Stored subtopic ${questIndex}-${subtopicIndex} content for course ${courseId} in database`);
      return true;
    } catch (error) {
      console.error(`Error storing subtopic content for course ${courseId}:`, error);
      return false;
    }
  },

  // Get subtopic content
  async getSubtopicContent(courseId, questIndex, subtopicIndex) {
    try {
      const key = `quest_${questIndex}_subtopic_${subtopicIndex}`;
      const snapshot = await get(child(ref(database), `courses/${courseId}/subtopics/${key}`));
      
      if (snapshot.exists()) {
        return snapshot.val().content;
      } else {
        console.log(`No subtopic ${questIndex}-${subtopicIndex} content found in database for course ${courseId}`);
        return null;
      }
    } catch (error) {
      console.error(`Error getting subtopic content for course ${courseId}:`, error);
      return null;
    }
  },

  // Store specific section of subtopic content
  async storeSubtopicSection(courseId, questIndex, subtopicIndex, sectionType, sectionContent) {
    try {
      // First try to get existing content
      const existingContent = await this.getSubtopicContent(courseId, questIndex, subtopicIndex) || {};
      
      // Update with new section content
      const updatedContent = {
        ...existingContent,
        [sectionType]: sectionContent
      };
      
      // Store the updated content
      await this.storeSubtopicContent(courseId, questIndex, subtopicIndex, updatedContent);
      
      console.log(`Stored ${sectionType} section for subtopic ${questIndex}-${subtopicIndex} in course ${courseId}`);
      return updatedContent;
    } catch (error) {
      console.error(`Error storing subtopic section for course ${courseId}:`, error);
      return null;
    }
  },

  // Initialize a course in the database
  async initializeCourse(courseData) {
    try {
      const courseId = courseData.id || Date.now().toString();
      
      await set(ref(database, `courses/${courseId}`), {
        ...courseData,
        id: courseId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      return courseId;
    } catch (error) {
      console.error("Error initializing course:", error);
      return null;
    }
  },





  
  
  // Get course data by ID
  async getCourseData(courseId) {
    try {
      const snapshot = await get(child(ref(database), `courses/${courseId}`));
      
      if (snapshot.exists()) {
        return snapshot.val();
      } else {
        console.log(`No course found with ID ${courseId}`);
        return null;
      }
    } catch (error) {
      console.error(`Error getting course data for ${courseId}:`, error);
      return null;
    }
  }
};


export default DatabaseService;