import React from 'react';
import { render } from '@testing-library/react';  // <-- Cette librairie gère le DOM de test
import { Provider } from 'react-redux';           // <-- Pour injecter le store Redux
import store from '../../state/store';            // <-- Importez votre store (chemin à adapter)
import App from './App';

test('renders without crashing', () => {
  // On rend <App/> à l’intérieur du <Provider store={store}> pour qu'il trouve le store
  render(
    <Provider store={store}>
      <App />
    </Provider>
  );
  // Pas besoin de unmount : Testing Library nettoie après chaque test
});
