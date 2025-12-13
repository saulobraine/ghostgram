// Bundle - Entry point for refactored application
// This file imports and renders the refactored App component
// Note: React/Preact should be available globally or via import

import { App } from './src/bundle/App.js';
import React from 'react';
import { render } from 'react-dom';

// Validate hostname
import { INSTAGRAM_HOSTNAME } from './src/constants/Constants.js';

if (location.hostname !== INSTAGRAM_HOSTNAME) {
  alert('Can be used only on Instagram routes');
} else {
  document.title = 'InstagramUnfollowers';
  document.body.innerHTML = '';
  
  render(<App />, document.body);
}

