/**
 * GA4 (gtag) — loaded only after cookie consent (see CookieConsentBanner).
 * Custom event `taptics_share` for share tracking; register parameters in GA4 if needed.
 */

const GA_MEASUREMENT_ID = 'G-47GKZ5SH9G';
export const COOKIE_CONSENT_STORAGE_KEY = 'taptics_cookie_consent_v1';

type GtagFn = (command: string, action: string, params?: Record<string, string | undefined>) => void;

export type CookieConsent = 'accepted' | 'rejected' | null;

export function getStoredConsent(): CookieConsent {
  try {
    const v = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (v === 'accepted' || v === 'rejected') return v;
  } catch {
    // ignore
  }
  return null;
}

export function setStoredConsent(choice: 'accepted' | 'rejected'): void {
  try {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, choice);
  } catch {
    // ignore
  }
}

let loadPromise: Promise<void> | null = null;

/** Injects gtag.js and configures GA4. Safe to call multiple times. */
export function loadGoogleAnalytics(): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve();
  }

  const w = window as Window & { gtag?: GtagFn; dataLayer?: unknown[] };

  if (document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`) && typeof w.gtag === 'function') {
    return Promise.resolve();
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    w.dataLayer = w.dataLayer || [];
    w.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      (w.dataLayer as unknown[]).push(arguments);
    };

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    script.onload = () => {
      w.gtag!('js', new Date());
      w.gtag!('config', GA_MEASUREMENT_ID);
      resolve();
    };
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Failed to load Google Analytics'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

export type ShareTrackType = 'lineup' | 'set_pieces' | 'builder';

export function trackShare(params: {
  type: ShareTrackType;
  share_mode?: 'single' | 'all';
}): void {
  if (typeof window === 'undefined') return;
  if (getStoredConsent() !== 'accepted') return;
  const g = (window as Window & { gtag?: GtagFn }).gtag;
  if (typeof g !== 'function') return;

  const payload: Record<string, string | undefined> = {
    share_type: params.type,
    method: 'clipboard',
  };
  if (params.share_mode) {
    payload.share_mode = params.share_mode;
  }

  g('event', 'taptics_share', payload);
}
