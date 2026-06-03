
import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/index.css';
import App from './src/app/App';
import { bootstrap } from './src/app/bootstrap';
import { initializeDesktopLocalStorageBridge } from './src/app/storage/desktopLocalStorageBridge';

const mountApp = async () => {
  try {
    await initializeDesktopLocalStorageBridge();
  } catch (error) {
    console.warn('[index] Failed to initialize desktop local storage bridge', error);
  }

  try {
    await bootstrap();
  } catch (error) {
    console.warn('[index] Failed to complete application bootstrap before mount', error);
  }

  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Could not find root element to mount to");
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

void mountApp();
