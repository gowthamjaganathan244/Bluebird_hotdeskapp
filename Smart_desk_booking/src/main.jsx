import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig } from './authConfig';
import './index.css';
import App from './App.jsx';

// Initialize MSAL
const pca = new PublicClientApplication(msalConfig);

// Ensure MSAL is initialized before rendering
pca.initialize().then(() => {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    createRoot(rootElement).render(
      <StrictMode>
        <MsalProvider instance={pca}>
          <App />
        </MsalProvider>
      </StrictMode>
    );
  } else {
    console.error("Root element not found.");
  }
}).catch(error => {
  console.error("Error initializing MSAL:", error);
});
