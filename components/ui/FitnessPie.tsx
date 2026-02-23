import React from 'react';

interface FitnessPieProps {
  percentage: number;
  color?: string;
  size?: number;
}

export const FitnessPie: React.FC<FitnessPieProps> = ({ percentage, color = '#10b981', size = 16 }) => {
  const radius = 16; // Standardized coordinate system
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center gap-1">
      <div className="relative flex items-center justify-center">
        <svg
          height={size}
          width={size}
          viewBox="0 0 40 40"
          className="transform -rotate-90"
        >
          <circle
            stroke="#334155"
            fill="transparent"
            strokeWidth="8"
            r={radius}
            cx="20"
            cy="20"
          />
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth="8"
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={radius}
            cx="20"
            cy="20"
          />
        </svg>
      </div>
      <span className={`text-xs font-medium ${percentage < 90 ? 'text-yellow-400' : 'text-emerald-400'}`}>
        {percentage}%
      </span>
    </div>
  );
};