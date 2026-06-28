import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlatformBadge } from './PlatformBadge.tsx';

describe('PlatformBadge', () => {
  it('shows PC when PC is available', () => {
    render(<PlatformBadge platforms={[6, 167]} />);
    expect(screen.getByText('PC')).toHaveAttribute('data-platform', 'PC');
  });

  it('shows PS5 when only PS5 is available', () => {
    render(<PlatformBadge platforms={[167]} />);
    expect(screen.getByText('PS5')).toHaveAttribute('data-platform', 'PS5');
  });

  it('shows N/A when neither platform is available', () => {
    render(<PlatformBadge platforms={[3]} />);
    expect(screen.getByText('N/A')).toHaveAttribute('data-platform', 'none');
  });
});
