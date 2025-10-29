import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import './styles/formatted-text.css';
import './styles/design-system.css';

// Suprimir erros de extensões do navegador (message channel)
window.addEventListener('error', (event) => {
  if (event.message.includes('message channel') || 
      event.message.includes('listener indicated') ||
      event.message.includes('asynchronous response')) {
    event.preventDefault();
    return true;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && typeof event.reason === 'object' && 
      event.reason.message && 
      (event.reason.message.includes('message channel') ||
       event.reason.message.includes('listener indicated') ||
       event.reason.message.includes('asynchronous response'))) {
    event.preventDefault();
    return true;
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);