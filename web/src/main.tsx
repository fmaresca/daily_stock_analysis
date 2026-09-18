import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary
      fallbackTitle="Application Rendering Error"
      fallbackMessage="An unexpected error occurred while initializing DeltaHarvest. Click below to reload the workspace safely."
      onReset={() => {
        try {
          localStorage.removeItem('deltaharvest_auth_user');
        } catch {}
        window.location.reload();
      }}
    >
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

