import { database } from '../firebase';
import { ref, set, get, child, update, runTransaction } from "firebase/database";

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
    // Get existing content first to ensure we don't lose any sections
    let existingContent = null;
    try {
      existingContent = await this.getSubtopicContent(courseId, questIndex, subtopicIndex);
    } catch (err) {
      console.log(`No existing content found, creating new entry`);
    }
    
    // Create merged content - ensures we keep all sections
    const mergedContent = {
      ...(existingContent || {}),
      ...content,
      // Make sure title is preserved
      title: content.title || (existingContent && existingContent.title)
    };
    
    const key = `quest_${questIndex}_subtopic_${subtopicIndex}`;
    await set(ref(database, `courses/${courseId}/subtopics/${key}`), {
      content: mergedContent,
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

  // Store a specific section of subtopic content using atomic update
  async storeSubtopicSection(courseId, questIndex, subtopicIndex, sectionType, sectionContent) {
    try {
      const key = `quest_${questIndex}_subtopic_${subtopicIndex}`;
      // Reference to the "content" node inside the subtopic document
      const contentRef = ref(database, `courses/${courseId}/subtopics/${key}/content`);
      
      // Atomically update only the specific section
      await update(contentRef, { [sectionType]: sectionContent });
      
      console.log(`Updated ${sectionType} section for subtopic ${questIndex}-${subtopicIndex} in course ${courseId}`);
      return true;
    } catch (error) {
      console.error(`Error updating subtopic section for course ${courseId}:`, error);
      return null;
    }
  },

  // Optional: Alternatively, update a subtopic section using a transaction
  async storeSubtopicSectionTransaction(courseId, questIndex, subtopicIndex, sectionType, sectionContent) {
    try {
      const key = `quest_${questIndex}_subtopic_${subtopicIndex}`;
      const contentRef = ref(database, `courses/${courseId}/subtopics/${key}/content`);
      
      await runTransaction(contentRef, (currentData) => {
        if (currentData === null) {
          currentData = {};
        }
        return {
          ...currentData,
          [sectionType]: sectionContent
        };
      });
      
      console.log(`Transaction updated ${sectionType} section for subtopic ${questIndex}-${subtopicIndex} in course ${courseId}`);
      return true;
    } catch (error) {
      console.error(`Error in transaction updating subtopic section for course ${courseId}:`, error);
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
