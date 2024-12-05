import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Tutorial.css'; // Import the CSS for styling

const Tutorial = () => {
  const navigate = useNavigate();

  return (
    <div className="tutorial-container">
      <h1>Welcome to the Tutorial</h1>
      <p>This tutorial will guide you through the features of our app.</p>
      <div className="tutorial-steps">
        <div className="step">
          <h2>Step 1</h2>
          <p>Learn how to navigate through the app.</p>
        </div>
        <div className="step">
          <h2>Step 2</h2>
          <p>Understand the main functionalities.</p>
        </div>
        <div className="step">
          <h2>Step 3</h2>
          <p>Get to know advanced features and tips.</p>
        </div>
      </div>
      <button className="got-it-button" onClick={() => navigate('/room')}>
        Got it!
      </button>
    </div>
  );
};

export default Tutorial;