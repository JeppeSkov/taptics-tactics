import React, { useEffect, useRef } from 'react';
import { Cookie } from 'lucide-react';

export type CookieConsentChoice = 'accepted' | 'rejected';

interface CookieConsentBannerProps {
  onChoice: (choice: CookieConsentChoice) => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onChoice }) => {
  const acceptRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    acceptRef.current?.focus();
  }, []);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[180] p-4 sm:p-5 pointer-events-none"
      role="region"
      aria-label="Cookie consent"
    >
      <div className="pointer-events-auto max-w-3xl mx-auto rounded-xl border border-slate-600 bg-slate-900/95 backdrop-blur-md shadow-2xl px-4 py-4 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex gap-3 flex-1 min-w-0">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
            <Cookie className="text-emerald-400" size={22} aria-hidden />
          </div>
          <div className="text-sm text-slate-300 leading-relaxed">
            <p className="font-semibold text-white mb-1">Cookies & analytics</p>
            <p className="text-slate-400">
              We use cookies and similar technology to measure how the app is used (Google Analytics) and improve your
              experience. You can accept analytics or continue without it.
            </p>
          </div>
        </div>
        <div className="flex flex-row flex-wrap gap-2 shrink-0 sm:ml-2 justify-end sm:justify-start">
          <button
            type="button"
            onClick={() => onChoice('rejected')}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Decline
          </button>
          <button
            ref={acceptRef}
            type="button"
            onClick={() => onChoice('accepted')}
            className="px-4 py-2.5 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 shadow-lg transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};
