import React from 'react';
import { createRoot } from 'react-dom/client'; // Nouvelle API React 18
import './index.css';
import App from './containers/App/App';
import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { Provider } from 'react-redux';
import modsOptimizer from './state/reducers/modsOptimizer';
import getDatabase from './state/storage/Database';
import { showError } from './state/actions/app';
import { databaseReady } from './state/actions/storage';

// Crée le store Redux
const store = createStore(
  modsOptimizer,
  applyMiddleware(thunkMiddleware)
);

// Instancie la base de données
getDatabase(
  () => store.dispatch(databaseReady(store.getState())),
  (error) => {
    if (error instanceof DOMException) {
      store.dispatch(showError([
        <p key={1}>
          Impossible de charger la base de données. Cela peut être causé par un bug de Firefox
          en navigation privée ou avec l’historique désactivé. Si vous utilisez Firefox, veuillez
          passer en mode de navigation normal. En cas de problème persistant, merci de demander
          de l’aide sur le serveur Discord ci-dessous.
        </p>,
        <p key={2}>
          L’optimiseur de mods de Grandivory est testé pour fonctionner sur
          <strong> Firefox, Chrome et Safari sur ordinateur uniquement</strong> !
          D’autres navigateurs peuvent marcher, mais ne sont pas officiellement pris en charge.
          Si vous rencontrez des difficultés, essayez d’abord un de ces navigateurs avant
          de demander de l’aide.
        </p>,
        <p key={3}>Message d’erreur : {error.message}</p>,
      ]));
    } else {
      store.dispatch(showError([
        <p key={1}>
          Impossible de charger la base de données : {error.message}. Veuillez corriger
          le problème et réessayer, ou demandez de l’aide sur le serveur Discord ci-dessous.
        </p>,
        <p key={2}>
          L’optimiseur de mods de Grandivory est testé pour fonctionner sur
          <strong> Firefox, Chrome et Safari sur ordinateur uniquement</strong> !
          D’autres navigateurs peuvent marcher, mais ne sont pas officiellement pris en charge.
          Si vous rencontrez des difficultés, essayez d’abord un de ces navigateurs avant
          de demander de l’aide.
        </p>
      ]));
    }
  }
);

// Récupère la div racine depuis le DOM
const container = document.getElementById('root');

// Initialise le "root" avec la nouvelle API de React 18
const root = createRoot(container);

// Rendu de l'application à l’intérieur du Provider Redux
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
