import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#1a2844',
            border: '1px solid #d1dce8',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(30,58,95,0.12)',
            fontSize: '0.9rem',
            fontWeight: '500',
          },
          success: {
            iconTheme: { primary: '#0a9e6c', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#dc2626', secondary: '#fff' },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
