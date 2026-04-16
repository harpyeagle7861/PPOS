
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './src/index.tsx';
import './index.css';

const rootEl = document.getElementById('root');
if (rootEl) {
    const root = createRoot(rootEl);
    root.render(<App />);
} else {
    console.error("Root element not found. Please ensure your HTML has an element with id='root'.");
}
