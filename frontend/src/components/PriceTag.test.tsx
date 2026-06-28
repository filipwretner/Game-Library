import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PriceTag } from './PriceTag.tsx';

describe('PriceTag', () => {
  it('shows the sale price and struck-through regular price when on sale', () => {
    render(<PriceTag price={6.24} normalPrice={24.99} discountPct={75} currency="USD" />);
    expect(screen.getByText('USD 6.24')).toBeInTheDocument();
    expect(screen.getByText('USD 24.99').tagName).toBe('S');
  });

  it('shows only the price when not on sale', () => {
    render(<PriceTag price={59.99} normalPrice={null} discountPct={null} currency="USD" />);
    expect(screen.getByText('USD 59.99')).toBeInTheDocument();
    expect(screen.queryByText(/24.99/)).not.toBeInTheDocument();
  });

  it('shows a placeholder when there is no price', () => {
    render(<PriceTag price={null} normalPrice={null} discountPct={null} currency={null} />);
    expect(screen.getByText('No price yet')).toBeInTheDocument();
  });
});
