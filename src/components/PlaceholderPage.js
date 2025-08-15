import React from 'react';
import './PlaceholderPage.css';

const PlaceholderPage = ({ title, description, icon }) => {
  return (
    <div className="placeholder-page">
      <div className="placeholder-content">
        <div className="placeholder-icon">{icon}</div>
        <h1>{title}</h1>
        <p className="subtitle">{description}</p>
        <div className="placeholder-info">
          <p>This page is under development and will be available soon.</p>
          <p>Check back later for updates!</p>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderPage;

