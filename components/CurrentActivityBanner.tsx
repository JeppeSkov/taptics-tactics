import React from 'react';
import { buildActivityText, useOtherActiveCoaches } from '../livePresence';

interface CurrentActivityBannerProps {
  className?: string;
}

export const CurrentActivityBanner: React.FC<CurrentActivityBannerProps> = ({ className = '' }) => {
  const otherCoaches = useOtherActiveCoaches();
  const activityText = buildActivityText(otherCoaches);

  return (
    <div className={`rounded-lg border border-green-500/25 bg-green-500/5 px-2.5 py-1.5 flex items-center gap-1.5 ${className}`}>
      <p className="text-[11px] sm:text-xs text-green-500/80">
        <span className="font-bold uppercase tracking-wide mr-1">Current Activity:</span>
        {activityText}
      </p>
    </div>
  );
};
