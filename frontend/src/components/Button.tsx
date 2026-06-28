import type { ButtonHTMLAttributes, JSX } from 'react';
import { cn } from '../lib/cn.ts';

const BASE =
  'inline-flex items-center justify-center gap-1 rounded-md border border-border bg-raised ' +
  'px-3 py-1.5 text-sm font-medium text-text transition-colors hover:bg-border ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

/**
 * The single source of truth for buttons. Bakes in `type="button"` and the base
 * styling; callers may extend/override via `className` (later utilities win).
 */
export function Button({
  children,
  className,
  ...rest
}: Readonly<ButtonHTMLAttributes<HTMLButtonElement>>): JSX.Element {
  return (
    <button type="button" className={cn(BASE, className)} {...rest}>
      {children}
    </button>
  );
}
