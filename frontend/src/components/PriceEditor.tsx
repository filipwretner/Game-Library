import { useEffect, useState, type JSX } from 'react';
import { Button } from './Button.tsx';

interface PriceEditorProps {
  price: number | null;
  currency: string | null;
  onSave: (price: number) => void;
}

/**
 * Manual price entry for PS5/wishlist items (spec §2.3). Holds only the input
 * text (ephemeral UI state); the parent persists via a mutation. PC items use
 * auto-fetch instead (CheapShark).
 */
export function PriceEditor({ price, currency, onSave }: Readonly<PriceEditorProps>): JSX.Element {
  const [value, setValue] = useState(price === null ? '' : String(price));

  // Reflect an externally changed price (e.g. after a save reconciles the cache).
  useEffect(() => {
    setValue(price === null ? '' : String(price));
  }, [price]);

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
      <Button onClick={save}>Save price</Button>
    </span>
  );
}
