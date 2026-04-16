
import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import App from './src/index.tsx';
import './index.css';

const ErrorFallback = ({ error, resetErrorBoundary }: any) => {
  return (
    <div role="alert" style={{ padding: '20px', color: '#ff0033', background: '#000', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontFamily: "'JetBrains Mono', monospace" }}>
      <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>[SYSTEM CRITICAL] Substrate Rift Detected</h2>
      <pre style={{ color: '#ffaa00', background: '#111', padding: '15px', borderRadius: '8px', maxWidth: '80%', overflowX: 'auto' }}>{error.message}</pre>
      <button onClick={resetErrorBoundary} style={{ marginTop: '20px', padding: '10px 20px', background: '#00ffcc', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
        INITIATE WICK ROTATION (RESTART)
      </button>
    </div>
  );
};

const rootEl = document.getElementById('root');
if (rootEl) {
    const root = createRoot(rootEl);
    root.render(
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <HashRouter>
          <App />
        </HashRouter>
      </ErrorBoundary>
    );
} else {
    console.error("Root element not found. Please ensure your HTML has an element with id='root'.");
}
