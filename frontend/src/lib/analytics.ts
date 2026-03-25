/**
 * Google Analytics 4 event tracking helper.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Track a custom event in GA4.
 * No-ops gracefully if GA4 is not loaded.
 */
export function trackEvent(action: string, params?: Record<string, string | number>): void {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, params);
  }
}
