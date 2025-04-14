// /src/components/ResetOptimizerButton/ResetOptimizerButton.js
import React from 'react';
import './ResetOptimizerButton.css';

const ResetOptimizerButton = ({ onClick }) => (
  <button 
    className="reset-optimizer-button" 
    onClick={onClick} 
    title="Attention : Réinitialisation de l'Optimiseur de Mods"
  >
    <svg
      className="reset-icon"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="32"
      height="32"
    >
      {/* Icône d'avertissement (triangle avec exclamation) */}
      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
    </svg>
  </button>
);

export default ResetOptimizerButton;
