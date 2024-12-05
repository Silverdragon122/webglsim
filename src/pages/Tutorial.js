import React from 'react';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom
import '../CSS/Tutorial.css'; // Import the CSS for styling

const Tutorial = () => {
  return (
    <div className="tutorial-container">
      <h1>Welcome to the Tutorial</h1>
      <p>This tutorial will guide you through the features the site, and how to use it.</p>
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
      <Link to="/room" className="got-it-button">Got it!</Link>
    </div>
  );
};

export default Tutorial;