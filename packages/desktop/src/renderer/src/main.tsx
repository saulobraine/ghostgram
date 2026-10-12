import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/index.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  console.log('[GhostGram Desktop] Inicializando React DOM...');
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('[GhostGram Desktop] React montado com sucesso.');
}
