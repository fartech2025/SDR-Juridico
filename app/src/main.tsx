import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Expor variáveis do Vite para acesso indireto em módulos compartilhados com testes Node.
if (typeof globalThis !== 'undefined') {
  (globalThis as { __VITE_ENV__?: ImportMetaEnv }).__VITE_ENV__ = import.meta.env;
}

// Suprimir erros de extensões do navegador (message channel)
const isExtensionError = (message: string | undefined) => {
  if (!message) return false;
  const msg = String(message).toLowerCase();
  return msg.includes('message channel') || 
         msg.includes('listener indicated') ||
         msg.includes('asynchronous response');
};

// Handle de erros não capturados de extensões
window.addEventListener('error', (event) => {
  if (isExtensionError(event.message)) {
    event.preventDefault();
    return true;
  }
}, true);

// Handle de rejections não capturadas de extensões
window.addEventListener('unhandledrejection', (event) => {
  const errorMsg = event.reason?.message || event.reason || '';
  if (isExtensionError(String(errorMsg))) {
    event.preventDefault();
  }
}, true);

// Interceptar console.error para extensões
const originalError = console.error;
console.error = (...args: any[]) => {
  const message = String(args[0] || '');
  if (!isExtensionError(message)) {
    originalError.apply(console, args);
  }
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
