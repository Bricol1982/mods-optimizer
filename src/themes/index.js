// src/themes/index.js
import blueTheme from './defaultTheme';
import blueTheme from './blueTheme';
import darkTheme from './darkTheme';
import greenTheme from './greenTheme';
import lightTheme from './lightTheme';
import redTheme from './redTheme';
import customTheme from './customTheme';

const themes = {
  default: defaultTheme,  
  blue: blueTheme,
  dark: darkTheme,
  green: greenTheme,
  light: lightTheme,
  red: redTheme,
  custom: customTheme  // thème personnalisable
};

export default themes;
