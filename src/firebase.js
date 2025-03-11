import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyCaUDhdo6EhNaQxdlW8vL8fG8DxfYa3O3k",
    authDomain: "science-course-1b7c8.firebaseapp.com",
    databaseURL: "https://science-course-1b7c8-default-rtdb.firebaseio.com",
    projectId: "science-course-1b7c8",
    storageBucket: "science-course-1b7c8.firebasestorage.app",
    messagingSenderId: "483926842177",
    appId: "1:483926842177:web:70da0d2f17c803be0a1fc0",
    measurementId: "G-GWS38CEEXQ"
  };


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };
