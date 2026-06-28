import type { ButtonHTMLAttributes, JSX } from 'react';

/**
 * The single source of truth for buttons. Bakes in `type="button"` (so no form
 * ever submits by accident) and is the one place to add variants/styling later.
 * Spreads the rest of the native button props (onClick, disabled, aria-*, …).
 */
export function Button({
  children,
  ...rest
}: Readonly<ButtonHTMLAttributes<HTMLButtonElement>>): JSX.Element {
  return (
    <button type="button" {...rest}>
      {children}
    </button>
  );
}
