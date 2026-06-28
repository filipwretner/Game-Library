import { useState, type JSX } from 'react';

interface PriceEditorProps {
  price: number | null;
  currency: string | null;
  onSave: (price: number) => void;
}

/**
 * Manual price entry for PS5/wishlist items (spec §2.3). Holds only the input
 * text (ephemeral UI state); the parent persists via a mutation. Auto-fetch for
 * PC items arrives in Milestone 6.
 */
export function PriceEditor({ price, currency, onSave }: Readonly<PriceEditorProps>): JSX.Element {
  const [value, setValue] = useState(price === null ? '' : String(price));

  const save = (): void => {
    const parsed = Number.parseFloat(value);
    if (!Number.isNaN(parsed) && parsed >= 0) onSave(parsed);
  };

  return (
    <span className="price-editor">
      <span className="currency">{currency ?? 'USD'}</span>
      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        aria-label="Price"
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="button" onClick={save}>
        Save price
      </button>
    </span>
  );
}
