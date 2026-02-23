import React from 'react';
import { Player } from '../types';
import { Shirt } from 'lucide-react';

interface SubstitutesProps {
  benchSlots: string[];
  players: Player[];
  onPlayerDrop: (draggedPlayerId: string, targetSlotId: string) => void;
  kitColor: string;
  numberColor: string;
  subCount: number;
}

export const Substitutes: React.FC<SubstitutesProps> = ({ 
    benchSlots, 
    players, 
    onPlayerDrop, 
    kitColor, 
    numberColor,
    subCount 
}) => {
  const getPlayerInSlot = (slotId: string) => players.find(p => p.assignedSlot === slotId);

  // Only use slots that fall within the subCount
  const activeSlots = benchSlots.slice(0, subCount);

  const handleDragStart = (e: React.DragEvent, playerId: string) => {
    e.dataTransfer.setData('playerId', playerId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, slotId: string) => {
    e.preventDefault();
    const playerId = e.dataTransfer.getData('playerId');
    if (playerId) {
      onPlayerDrop(playerId, slotId);
    }
  };

  return (
    <div className="w-full bg-slate-800/50 rounded-lg p-2 flex flex-col gap-2 overflow-y-auto max-h-full">
      <h3 className="text-slate-400 text-xs font-bold uppercase text-center mb-2">Subs</h3>
      {activeSlots.map((slotId) => {
        const player = getPlayerInSlot(slotId);
        return (
          <div 
            key={slotId}
            className="flex flex-col items-center bg-slate-900/80 p-2 rounded border border-slate-700 hover:border-slate-500 transition-colors cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, slotId)}
            draggable={!!player}
            onDragStart={(e) => player && handleDragStart(e, player.id)}
          >
            {player ? (
              <>
                 <div className="relative">
                    <Shirt 
                        size={24} 
                        className="transition-colors duration-300" 
                        color={kitColor}
                        fill={kitColor}
                    />
                    <span 
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold transition-colors duration-300"
                        style={{ color: numberColor }}
                    >
                        {player.number}
                    </span>
                 </div>
                 <span className="text-[10px] text-slate-200 mt-1 text-center leading-tight truncate w-full">{player.name.split(' ').pop()}</span>
                 <span className="text-[9px] text-slate-500">{player.naturalPosition.split(' ')[0]}</span>
              </>
            ) : (
                <span className="text-slate-600 text-xs">Empty</span>
            )}
          </div>
        );
      })}
    </div>
  );
};