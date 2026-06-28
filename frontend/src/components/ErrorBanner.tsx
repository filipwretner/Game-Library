import type { JSX } from 'react';

interface ErrorBannerProps {
  message: string | null;
}

/** Presentational alert for a failed action. Renders nothing when there's no error. */
export function ErrorBanner({ message }: Readonly<ErrorBannerProps>): JSX.Element | null {
  if (message === null) return null;
  return (
    <p className="error-banner" role="alert">
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
