import React from 'react';
import './RestoreProgressButton.css';

const RestoreProgressButton = ({ onClick, restoring }) => (
  <button className="restore-progress-button" onClick={onClick} title="Restaurer une sauvegarde">
    <svg 
      className={`restore-icon ${restoring ? 'spinning' : ''}`}
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24"
      width="32" 
      height="32"
    >
      {/* Icône de téléchargement */}
      <path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
    </svg>
  </button>
);

export default RestoreProgressButton;
