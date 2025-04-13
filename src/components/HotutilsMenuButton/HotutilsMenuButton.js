// src/components/HotutilsMenuButton/HotutilsMenuButton.js
import React, { useState } from 'react';
import './HotutilsMenuButton.css';
import hotutilsLogo from '../../img/hotsauceheader.png';

const HotutilsMenuButton = ({ onRetrieveHotUtils, keepOldMods, onToggleKeepOldMods, title }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleRetrieve = () => {
    setMenuOpen(false);
    onRetrieveHotUtils && onRetrieveHotUtils();
  };

  return (
    <div className="hotutils-menu-container">
      <button className="hotutils-button" onClick={toggleMenu} title={title || "HotUtils"}>
        <img src={hotutilsLogo} alt="HotUtils" className="hotutils-logo" />
      </button>
      {menuOpen && (
        <div className="hotutils-menu">
          <button className="hotutils-menu-item" onClick={handleRetrieve} title="Récupérer avec HotUtils">
            Récupérer avec HotUtils
          </button>
          <div className="hotutils-menu-item checkbox-item" title="Conserver les mods existants">
            <label>
              <input 
                type="checkbox" 
                checked={keepOldMods} 
                onChange={onToggleKeepOldMods} 
              />
              Conserver les mods existants
            </label>
          </div>
          <div className="hotutils-menu-item help-item" title="Comment récupérer les mods non équipés ?">
            <small>Comment récupérer les mods non équipés ?</small>
          </div>
        </div>
      )}
    </div>
  );
};

export default HotutilsMenuButton;
