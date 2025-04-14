// /src/components/ThemeChanger/ThemeChanger.js
import React from 'react';
import './ThemeChanger.css';

const ThemeChanger = ({ currentTheme, onThemeChange }) => {
  const themes = [
    { key: 'blue', label: 'Blue' },
    { key: 'green', label: 'Green' },
    { key: 'red', label: 'Red' },
    { key: 'dark', label: 'Dark' },
    { key: 'light', label: 'Light' },
    { key: 'yoda', label: 'Yoda' },
    { key: 'darkVader', label: 'Dark Vador' },
    { key: 'custom', label: 'Custom' }
  ];

  const handleChange = (event) => {
    onThemeChange(event.target.value);
  };

  return (
    <div className="theme-changer">
      <label htmlFor="theme-select">Theme:</label>
      <select id="theme-select" value={currentTheme} onChange={handleChange}>
        {themes.map((theme) => (
          <option key={theme.key} value={theme.key}>
            {theme.label}
          </option>
        ))}
      </select>
    </div>
  );
};

// Assurez-vous qu'on a toujours une fonction par défaut
ThemeChanger.defaultProps = {
  currentTheme: 'blue', // Par exemple, le thème par défaut
  onThemeChange: () => {} // Fonction vide pour éviter l'erreur
};

export default ThemeChanger;
