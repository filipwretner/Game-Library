import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { App } from './app/App.tsx';
import { createQueryClient } from './app/queryClient.ts';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

const queryClient = createQueryClient();

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
