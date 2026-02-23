import React from 'react';
import { Star, StarHalf } from 'lucide-react';

interface RoleStarsProps {
  rating: number; // 0 to 5
}

export const RoleStars: React.FC<RoleStarsProps> = ({ rating }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(<Star key={i} size={12} className="fill-yellow-400 text-yellow-400" />);
    } else if (i === fullStars && hasHalfStar) {
      stars.push(<StarHalf key={i} size={12} className="fill-yellow-400 text-yellow-400" />);
    } else {
      stars.push(<Star key={i} size={12} className="text-slate-600" />);
    }
  }

  return <div className="flex space-x-0.5">{stars}</div>;
};