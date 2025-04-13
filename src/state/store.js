// store.js
import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import modsOptimizer from './reducers/modsOptimizer';

const store = createStore(
  modsOptimizer,
  applyMiddleware(thunkMiddleware)
);

export default store;
