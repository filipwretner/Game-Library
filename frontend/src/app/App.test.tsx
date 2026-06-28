import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { App } from './App.tsx';
import { createQueryClient } from './queryClient.ts';

// Fake the api layer at its boundary (spec §11.4) — no real network in tests.
vi.mock('../api/healthApi.ts', () => ({
  healthApi: { get: vi.fn().mockResolvedValue({ status: 'ok' }) },
}));

function renderApp() {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <App />
    </QueryClientProvider>,
  );
}

describe('App', () => {
  it('renders the backend status once the health query resolves', async () => {
    renderApp();
    await waitFor(() => {
      expect(screen.getByTestId('backend-status')).toHaveTextContent('ok');
    });
  });
});
