import { inject } from '@vercel/analytics';

/** Vercel Analytics page views only (D13). Disabled in dev and tests. */
export function initAnalytics(): void {
  if (import.meta.env.PROD) inject();
}
