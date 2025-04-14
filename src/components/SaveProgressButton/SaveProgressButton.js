// /src/components/SaveProgressButton/SaveProgressButton.js
import React from 'react';
import './SaveProgressButton.css';

const SaveProgressButton = ({ onClick, saving }) => (
  <button className="save-progress-button" onClick={onClick} title="Enregistrer ma progression">
    <svg 
      className={`save-icon ${saving ? 'spinning' : ''}`}
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24"
      width="32" 
      height="32"
    >
      {/* Icône représentant "Enregistrer" (disquette) */}
      <path fill="currentColor" d="M17 3H7C5.9 3 5 3.9 5 5v14c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V7l-4-4zM12 19c-2.21 0-4-1.79-4-4 0-2.21 1.79-4 4-4s4 1.79 4 4c0 2.21-1.79 4-4 4zM15 9H9V5h6v4z"/>
    </svg>
  </button>
);

export default SaveProgressButton;
