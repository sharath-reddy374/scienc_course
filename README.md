# Interactive Learning Platform

A React app that creates interactive courses using AI. Users can learn through quests, games, and exercises.

## What it does

This app generates personalized learning content using OpenAI's API. It takes a subject and topic from the user, then creates:

- Welcome screens with course intros
- Quest-based learning paths
- Interactive memory games
- Multiple-choice questions
- Matching exercises
- Course summary

All content is stored in Firebase so users can continue where they left off.

## Tech Stack

- React
- Firebase Realtime Database
- OpenAI API
- Framer Motion for animations
- Tailwind CSS
- React Router

## How to use

1. Enter a subject and topic you want to learn about
2. The app generates a full interactive course
3. Navigate through quests and lessons
4. Test your knowledge with games and exercises
5. View your progress and completion summary

## Main components

- `Course.jsx`: The main controller for the learning experience
- Slide components: Different interactive screens (welcome, quests, games, etc.)
- `databaseService.js`: Handles Firebase storage and retrieval
- `openai.js`: Manages API calls to generate content
