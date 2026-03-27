import React, { useEffect, useMemo, useState } from 'react';

const LIVE_PRESENCE_KEY = 'taptics_live_presence_v1';
const LIVE_PRESENCE_SESSION_KEY = 'taptics_live_presence_session_v1';

interface CurrentActivityBannerProps {
  className?: string;
}

export const CurrentActivityBanner: React.FC<CurrentActivityBannerProps> = ({ className = '' }) => {
  const [presenceTick, setPresenceTick] = useState(0);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LIVE_PRESENCE_KEY) {
        setPresenceTick((v) => v + 1);
      }
    };
    const interval = window.setInterval(() => setPresenceTick((v) => v + 1), 15_000);
    window.addEventListener('storage', onStorage);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const activityText = useMemo(() => {
    try {
      const sessionId = sessionStorage.getItem(LIVE_PRESENCE_SESSION_KEY);
      const raw = localStorage.getItem(LIVE_PRESENCE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      const now = Date.now();
      const ttl = 90_000;
      let totalOthers = 0;

      Object.entries(parsed ?? {}).forEach(([key, value]) => {
        if (key === sessionId) return;
        const v = value as { ts?: number };
        if (typeof v?.ts !== 'number' || now - v.ts > ttl) return;
        totalOthers += 1;
      });

      if (totalOthers === 0) {
        return 'No other coaches active right now — share this builder to a coach you respect.';
      }
      return `${totalOthers} other coach${totalOthers === 1 ? '' : 'es'} currently active on Taptics Squad.`;
    } catch {
      return 'No other coaches active right now — share this builder to a coach you respect.';
    }
  }, [presenceTick]);

  return (
    <div className={`rounded-lg border border-green-500/25 bg-green-500/5 px-2.5 py-1.5 flex items-center gap-1.5 ${className}`}>
      <p className="text-[11px] sm:text-xs text-green-500/80">
        <span className="font-bold uppercase tracking-wide mr-1">Current Activity:</span>
        {activityText}
      </p>
    </div>
  );
};
