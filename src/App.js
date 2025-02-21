// src/App.js
import React from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import InputForm from './components/InputForm';
import Course from './components/Course';

const router = createBrowserRouter([
  {
    path: "/",
    element: <InputForm />
  },
  {
    path: "/course",
    element: <Course />
  }
]);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;