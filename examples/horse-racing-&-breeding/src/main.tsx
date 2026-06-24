import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Add global error handling to suppress third-party browser extension or cross-origin script errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const isCrossOrigin = event.filename && !event.filename.includes(window.location.host);
    const isScriptError = event.message === 'Script error.';
    const isExtensionError = event.filename && (event.filename.startsWith('chrome-extension:') || event.filename.startsWith('moz-extension:') || event.filename.includes('inpage.js'));
    
    if (isCrossOrigin || isScriptError || isExtensionError) {
      // Prevent these errors from triggering platform alert tools or console crashes
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    // Suppress unhandled rejections from external chrome extensions/scripts
    const reason = event.reason;
    if (reason && reason.stack && (reason.stack.includes('chrome-extension:') || reason.stack.includes('moz-extension:'))) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

