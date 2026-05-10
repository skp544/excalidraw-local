import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';

import App from './App.jsx';
import { queryClient } from '@/lib/query-client.js';
import { useThemeStore } from '@/stores/theme-store.js';

import './styles/globals.css';

// Apply persisted theme before paint to avoid a flash of light theme.
useThemeStore.getState().hydrate();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
