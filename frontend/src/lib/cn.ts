import { twMerge } from 'tailwind-merge';

/**
 * Join class names, with later Tailwind utilities overriding earlier conflicting
 * ones (so a component's base classes can be overridden by a caller's className).
 */
export function cn(...classes: Array<string | undefined | false | null>): string {
  return twMerge(classes.filter(Boolean).join(' '));
}
