import type { JSX } from 'react';

interface ErrorBannerProps {
  message: string | null;
}

/** Presentational alert for a failed action. Renders nothing when there's no error. */
export function ErrorBanner({ message }: Readonly<ErrorBannerProps>): JSX.Element | null {
  if (message === null) return null;
  return (
    <p
      role="alert"
      className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
    >
      {message}
    </p>
  );
}

/** First error message among a view's mutations, for a single ErrorBanner. */
export function firstErrorMessage(
  mutations: ReadonlyArray<{ error: Error | null }>,
): string | null {
  for (const mutation of mutations) {
    if (mutation.error) return mutation.error.message;
  }
  return null;
}
