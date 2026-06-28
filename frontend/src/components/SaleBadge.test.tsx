import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SaleBadge } from './SaleBadge.tsx';

describe('SaleBadge', () => {
  it('renders the discount when on sale', () => {
    render(<SaleBadge discountPct={40} />);
    expect(screen.getByText('🔥 -40%')).toBeInTheDocument();
  });

  it('renders nothing without a discount', () => {
    const { container } = render(<SaleBadge discountPct={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
