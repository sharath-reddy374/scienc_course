import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import InputForm from './components/InputForm';
import Course from './components/Course';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<InputForm />} />
        <Route path="/course" element={<Course />} />
      </Routes>
    </Router>
  );
};

export default App;
