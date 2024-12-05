
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './404.css'; // Import the CSS for styling

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist. Or maybe it does. We can't find it.</p>
      <button className="home-button" onClick={() => navigate('/')}>
        Go to Home
      </button>
    </div>
  );
};

export default NotFound;