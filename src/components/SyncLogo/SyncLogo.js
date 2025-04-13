// src/components/SyncLogo/SyncLogo.js
import React from 'react';
import './SyncLogo.css';

const SyncLogo = ({ onClick, syncing }) => (
  <button className="sync-logo-button" onClick={onClick}>
    <svg
      className={`sync-icon ${syncing ? 'spinning' : ''}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
    >
      {/* Exemple d'icône de synchronisation (vous pouvez remplacer ce path par votre propre SVG) */}
      <path fill="currentColor" d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 .34-.03.67-.08 1h2.02c.05-.33.06-.66.06-1 0-4.42-3.58-8-8-8zM6.08 11C6.03 10.67 6 10.34 6 10c0-.34.03-.67.08-1H4.06c-.05.33-.06.66-.06 1 0 4.42 3.58 8 8 8v3l4-4-4-4v3c-3.31 0-6-2.69-6-6z" />
    </svg>
  </button>
);

export default SyncLogo;
