import React, { useState, useRef } from 'react';
import { Player, TacticalSlot } from '../types';
import { Shirt, X, User } from 'lucide-react';

export interface PitchArrow {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color?: string;
}

export interface PitchZone {
    id: string;
    x: number;
    y: number;
}

export interface PitchOpponent {
    id: string;
    x: number;
    y: number;
    label?: string;
}

interface PitchProps {
  slots: TacticalSlot[];
  players: Player[];
  onPlayerDrop: (draggedPlayerId: string, targetSlotId: string) => void;
  onSlotMove: (slotId: string, x: number, y: number) => void;
  onNewPlayerDrop?: (playerId: string, x: number, y: number) => void;
  onRemovePlayer?: (playerId: string) => void;
  
  // Ball Props
  ballPosition?: { x: number, y: number } | null;
  onBallMove?: (x: number, y: number) => void;
  onBallRemove?: () => void;

  // Arrow Props
  arrows?: PitchArrow[];
  onArrowUpdate?: (arrow: PitchArrow) => void;
  onNewArrowDrop?: (x: number, y: number) => void;
  onArrowRemove?: (id: string) => void;

  // Zone Props
  zones?: PitchZone[];
  onNewZoneDrop?: (x: number, y: number) => void;
  onZoneMove?: (id: string, x: number, y: number) => void;
  onZoneRemove?: (id: string) => void;

  // Opponent Props
  opponents?: PitchOpponent[];
  onNewOpponentDrop?: (x: number, y: number) => void;
  onOpponentMove?: (id: string, x: number, y: number) => void;
  onOpponentRemove?: (id: string) => void;

  kitColor: string;
  numberColor: string;
  isExport?: boolean;
  viewMode?: 'full' | 'offensive' | 'defensive';
  playerIconStyle?: 'shirt' | 'circle';
  isSmallMode?: boolean; 
}

export const Pitch: React.FC<PitchProps> = ({ 
  slots, 
  players, 
  onPlayerDrop, 
  onSlotMove, 
  onNewPlayerDrop, 
  onRemovePlayer,
  ballPosition,
  onBallMove,
  onBallRemove,
  arrows = [],
  onArrowUpdate,
  onNewArrowDrop,
  onArrowRemove,
  zones = [],
  onNewZoneDrop,
  onZoneMove,
  onZoneRemove,
  opponents = [],
  onNewOpponentDrop,
  onOpponentMove,
  onOpponentRemove,
  kitColor, 
  numberColor,
  isExport = false,
  viewMode = 'full',
  playerIconStyle = 'shirt',
  isSmallMode = false
}) => {
  const getPlayerInSlot = (slotId: string) => players.find(p => p.assignedSlot === slotId);

  // -- Drag Logic for Arrows --
  const [dragState, setDragState] = useState<{
    type: 'arrow';
    id: string;
    mode: 'start' | 'end' | 'move';
    lastX: number;
    lastY: number;
  } | null>(null);

  // Track selected arrow to show handles/delete button
  const [selectedArrowId, setSelectedArrowId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const calculateCoords = (e: React.DragEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { 
        x: Math.max(0, Math.min(100, x)), 
        y: Math.max(0, Math.min(100, y)) 
    };
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  // Drop handler for the Slot itself (handling drops ONTO a player)
  const handleDropOnSlot = (e: React.DragEvent, targetSlotId: string) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Handle "Passthrough" drops (Ball, Zone, Opponent, Arrow)
    // If we drop these ON a player, we still want to move them.
    const type = e.dataTransfer.getData('type');
    if (type) {
        const { x, y } = calculateCoords(e);
        if (type === 'ball' && onBallMove) onBallMove(x, y);
        if (type === 'zone' && onZoneMove) {
             const zoneId = e.dataTransfer.getData('zoneId');
             if(zoneId) onZoneMove(zoneId, x, y);
        }
        if (type === 'opponent' && onOpponentMove) {
            const oppId = e.dataTransfer.getData('opponentId');
            if(oppId) onOpponentMove(oppId, x, y);
        }
        if (type === 'arrow' && onNewArrowDrop) onNewArrowDrop(x, y);
        // If type is defined, we are done (unless we want to support something else)
        return;
    }

    const draggedSlotId = e.dataTransfer.getData('slotId');
    
    // 2. Handle "Self-Move" (Dragging the player slightly onto themselves)
    if (draggedSlotId === targetSlotId) {
         const { x, y } = calculateCoords(e);
         onSlotMove(draggedSlotId, x, y);
         return;
    }

    // 3. Handle Slot-to-Slot Dragging
    // In Set Pieces mode (isSmallMode), we generally want to allow free movement (stacking/overlapping)
    // rather than swapping slots, because users create clusters of players.
    if (isSmallMode && draggedSlotId) {
         const { x, y } = calculateCoords(e);
         // Treat as a move to the dropped location (overlapping the target)
         onSlotMove(draggedSlotId, x, y);
         return;
    }

    // 4. Handle Player Swap (Standard logic for Lineup Builder)
    const playerId = e.dataTransfer.getData('playerId');
    if (playerId) {
      onPlayerDrop(playerId, targetSlotId);
    }
  };

  // Drop handler for the Pitch background
  const handlePitchDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const { x, y } = calculateCoords(e);
    
    const type = e.dataTransfer.getData('type');
    
    // Handle Ball Drop
    if (type === 'ball' && onBallMove) {
        onBallMove(x, y);
        return;
    }

    // Handle Arrow Drop
    if (type === 'arrow' && onNewArrowDrop) {
        onNewArrowDrop(x, y);
        return;
    }

    // Handle Zone Drop
    if (type === 'zone' && onNewZoneDrop) {
        onNewZoneDrop(x, y);
        return;
    }

    // Handle Opponent Drop
    if (type === 'opponent' && onNewOpponentDrop) {
        onNewOpponentDrop(x, y);
        return;
    }

    const slotId = e.dataTransfer.getData('slotId');
    const zoneId = e.dataTransfer.getData('zoneId');
    const opponentId = e.dataTransfer.getData('opponentId');
    const playerId = e.dataTransfer.getData('playerId');

    if (slotId) {
      onSlotMove(slotId, x, y);
    } else if (zoneId && onZoneMove) {
      onZoneMove(zoneId, x, y);
    } else if (opponentId && onOpponentMove) {
      onOpponentMove(opponentId, x, y);
    } else if (playerId && onNewPlayerDrop) {
      onNewPlayerDrop(playerId, x, y);
    }
  };

  const handleDragStart = (e: React.DragEvent, slotId: string, playerId?: string) => {
     e.dataTransfer.setData('slotId', slotId);
     if (playerId) {
        e.dataTransfer.setData('playerId', playerId);
     }
     e.stopPropagation();
  };

  const handleZoneDragStart = (e: React.DragEvent, zoneId: string) => {
      e.dataTransfer.setData('zoneId', zoneId);
      e.stopPropagation();
  };

  const handleOpponentDragStart = (e: React.DragEvent, opponentId: string) => {
      e.dataTransfer.setData('opponentId', opponentId);
      e.stopPropagation();
  };

  // -- Arrow Interaction Handlers --
  const handleArrowMouseDown = (e: React.MouseEvent, id: string, mode: 'start' | 'end' | 'move') => {
    if (isExport) return;
    e.stopPropagation();
    e.preventDefault();
    
    // Select the arrow on interaction
    setSelectedArrowId(id);

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const startX = ((e.clientX - rect.left) / rect.width) * 100;
    const startY = ((e.clientY - rect.top) / rect.height) * 100;

    setDragState({ type: 'arrow', id, mode, lastX: startX, lastY: startY });
  };

  const handlePitchClick = (e: React.MouseEvent) => {
      // If clicking the background, deselect arrow
      if(e.target === containerRef.current || e.target === e.currentTarget) {
          setSelectedArrowId(null);
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      // General mouse move for Arrow dragging (handled at container level to catch fast movements)
      if (!dragState || !onArrowUpdate || !arrows) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const currentX = ((e.clientX - rect.left) / rect.width) * 100;
      const currentY = ((e.clientY - rect.top) / rect.height) * 100;

      // Allow dragging slightly outside, but generally we want to update the arrow
      const arrow = arrows.find(a => a.id === dragState.id);
      if (!arrow) return;

      if (dragState.mode === 'start') {
          onArrowUpdate({ ...arrow, startX: currentX, startY: currentY });
          setDragState({ ...dragState, lastX: currentX, lastY: currentY });
      } else if (dragState.mode === 'end') {
          onArrowUpdate({ ...arrow, endX: currentX, endY: currentY });
          setDragState({ ...dragState, lastX: currentX, lastY: currentY });
      } else if (dragState.mode === 'move') {
          const dx = currentX - dragState.lastX;
          const dy = currentY - dragState.lastY;
          onArrowUpdate({
              ...arrow,
              startX: arrow.startX + dx,
              startY: arrow.startY + dy,
              endX: arrow.endX + dx,
              endY: arrow.endY + dy
          });
          setDragState({ ...dragState, lastX: currentX, lastY: currentY });
      }
  };

  const handleMouseUp = () => {
      setDragState(null);
  };

  const handleArrowDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (onArrowRemove) {
          onArrowRemove(id);
          setSelectedArrowId(null);
      }
  };

  // Dynamic scaling based on export mode
  const shirtSize = isExport ? 64 : 48;
  
  // Adjusted container size logic
  // If isSmallMode (Set Pieces), we allow the container to shrink to fit the content exactly.
  // This reduces the hit box for swapping/interaction, allowing tighter placement.
  // For standard mode, we keep the min dimensions for usability.
  const slotContainerClass = isExport 
      ? 'w-32 h-32' // Keep large for export to ensure spacing if needed, or adjust
      : isSmallMode 
        ? 'w-auto h-auto' // Fit content exactly for Set Pieces
        : 'w-auto h-auto min-w-[3rem] min-h-[3rem]'; // Standard generous hit box for lineup builder
  
  // Styling Logic
  // w-6 h-6 is 1.5rem (24px). w-7 h-7 is 1.75rem (28px). w-9 h-9 is 2.25rem (36px).
  // 24px is roughly 14% smaller than 28px, fulfilling the 10% smaller request.
  const circleSizeClass = isSmallMode ? 'w-6 h-6 text-[10px]' : 'w-9 h-9 text-sm';
  const nameTextSize = isExport ? 'text-base font-bold' : (isSmallMode ? 'text-[10px] font-bold' : 'text-xs font-bold');
  const namePadding = isExport ? 'px-3 py-1' : (isSmallMode ? 'px-1.5 py-0' : 'px-2 py-0.5');
  
  const aspectRatioClass = viewMode === 'full' ? 'aspect-[5/6]' : 'aspect-[5/3]';

  // Arrow sizing logic
  // Standard Width: 1.2. 20% smaller is ~0.96.
  // Standard Marker: 4. 20% smaller is 3.2.
  const arrowStrokeWidth = isSmallMode ? "0.96" : "1.2";
  const markerSize = isSmallMode ? "3.2" : "4";
  const markerViewBox = "0 0 4 4"; // Keep viewbox standard, scale via markerWidth/Height
  const markerRefX = isSmallMode ? "2.5" : "3"; // Adjust ref to prevent gap since marker is smaller but path is same
  
  return (
    <div 
      ref={containerRef}
      className={`relative w-full ${aspectRatioClass} bg-green-700 rounded-lg overflow-hidden border-2 border-slate-600 shadow-2xl pitch-pattern transition-all duration-300 select-none`}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
      onDrop={handlePitchDrop}
      onMouseDown={handlePitchClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      
      {/* --- PITCH MARKINGS --- */}
      
      {viewMode === 'full' && (
        <>
          <div className="absolute top-0 bottom-0 left-0 right-0 border-2 border-white/20 m-4 rounded-sm pointer-events-none"></div>
          <div className="absolute top-[50%] left-0 right-0 h-[1px] bg-white/20 pointer-events-none"></div>
          <div className="absolute top-[50%] left-[50%] w-24 h-24 border border-white/20 rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
          <div className="absolute top-4 left-[25%] right-[25%] h-16 border border-white/20 border-t-0 pointer-events-none"></div>
          <div className="absolute bottom-4 left-[25%] right-[25%] h-16 border border-white/20 border-b-0 pointer-events-none"></div>
        </>
      )}

      {viewMode === 'offensive' && (
        <>
           <div className="absolute top-0 bottom-0 left-0 right-0 border-2 border-white/20 m-4 rounded-sm border-b-0 pointer-events-none"></div>
           <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/20 m-4 mb-0 pointer-events-none"></div>
           <div className="absolute top-4 left-[25%] right-[25%] h-[20%] border border-white/20 border-t-0 pointer-events-none"></div>
           <div className="absolute top-4 left-[40%] right-[40%] h-[8%] border border-white/20 border-t-0 pointer-events-none"></div>
           <div className="absolute bottom-0 left-[50%] w-32 h-32 border border-white/20 rounded-full transform -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
           <div className="absolute top-4 left-4 w-8 h-8 border-b border-r border-white/20 rounded-br-full pointer-events-none"></div>
           <div className="absolute top-4 right-4 w-8 h-8 border-b border-l border-white/20 rounded-bl-full pointer-events-none"></div>
        </>
      )}

      {viewMode === 'defensive' && (
        <>
           <div className="absolute top-0 bottom-0 left-0 right-0 border-2 border-white/20 m-4 rounded-sm border-t-0 pointer-events-none"></div>
           <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/20 m-4 mt-0 pointer-events-none"></div>
           <div className="absolute bottom-4 left-[25%] right-[25%] h-[20%] border border-white/20 border-b-0 pointer-events-none"></div>
           <div className="absolute bottom-4 left-[40%] right-[40%] h-[8%] border border-white/20 border-b-0 pointer-events-none"></div>
           <div className="absolute top-0 left-[50%] w-32 h-32 border border-white/20 rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
           <div className="absolute bottom-4 left-4 w-8 h-8 border-t border-r border-white/20 rounded-tr-full pointer-events-none"></div>
           <div className="absolute bottom-4 right-4 w-8 h-8 border-t border-l border-white/20 rounded-tl-full pointer-events-none"></div>
        </>
      )}

      {/* --- ZONES LAYER --- */}
      {zones.map((zone) => (
         <div
            key={zone.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move z-10 group"
            style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
            draggable={!isExport}
            onDragStart={(e) => handleZoneDragStart(e, zone.id)}
         >
             <div className="w-20 h-20 rounded-full border-2 border-dashed border-yellow-300/60 bg-yellow-300/10 flex items-center justify-center">
                 <div className="w-1 h-1 bg-yellow-300/50 rounded-full"></div>
             </div>
             
             {/* Delete Zone */}
             {!isExport && onZoneRemove && (
                 <div 
                     className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-40 hover:bg-red-600"
                     onClick={(e) => { e.stopPropagation(); onZoneRemove(zone.id); }}
                     title="Remove Zone"
                 >
                     <X size={8} className="text-white" />
                 </div>
             )}
         </div>
      ))}

      {/* --- ARROWS LAYER (SVG) --- */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
            <marker id={`arrowhead-${isSmallMode ? 's' : 'l'}`} markerWidth={markerSize} markerHeight={markerSize} refX={markerRefX} refY="2" orient="auto" viewBox={markerViewBox}>
                <path d="M0,0 L0,4 L4,2 z" fill="#000000" />
            </marker>
             <marker id={`arrowhead-hover-${isSmallMode ? 's' : 'l'}`} markerWidth={markerSize} markerHeight={markerSize} refX={markerRefX} refY="2" orient="auto" viewBox={markerViewBox}>
                <path d="M0,0 L0,4 L4,2 z" fill="#333333" />
            </marker>
        </defs>
        {arrows.map(arrow => {
            const isDragging = dragState?.id === arrow.id;
            const isSelected = selectedArrowId === arrow.id;
            const midX = (arrow.startX + arrow.endX) / 2;
            const midY = (arrow.startY + arrow.endY) / 2;

            const dx = arrow.endX - arrow.startX;
            const dy = arrow.endY - arrow.startY;
            const length = Math.sqrt(dx * dx + dy * dy) || 1;
            const nx = -dy / length;
            const ny = dx / length;
            const offsetDist = 5; 
            const delX = midX + nx * offsetDist;
            const delY = midY + ny * offsetDist;

            return (
                <g key={arrow.id} className="pointer-events-auto">
                    <line 
                        x1={arrow.startX} y1={arrow.startY} x2={arrow.endX} y2={arrow.endY} 
                        stroke="transparent" 
                        strokeWidth="8"
                        className="cursor-pointer"
                        onMouseDown={(e) => handleArrowMouseDown(e, arrow.id, 'move')}
                    />
                    <line 
                        x1={arrow.startX} y1={arrow.startY} x2={arrow.endX} y2={arrow.endY} 
                        stroke={isDragging ? "#333333" : "#000000"} 
                        strokeWidth={arrowStrokeWidth}
                        markerEnd={isDragging ? `url(#arrowhead-hover-${isSmallMode ? 's' : 'l'})` : `url(#arrowhead-${isSmallMode ? 's' : 'l'})`}
                        className="transition-colors pointer-events-none"
                    />
                    {isSelected && !isExport && (
                        <>
                            <circle 
                                cx={arrow.startX} cy={arrow.startY} r="1.25" 
                                fill="#ef4444" 
                                stroke="white" strokeWidth="0.5"
                                className="cursor-move hover:fill-red-500 transition-colors"
                                onMouseDown={(e) => handleArrowMouseDown(e, arrow.id, 'start')}
                            />
                            <circle 
                                cx={arrow.endX} cy={arrow.endY} r="1.25" 
                                fill="#ef4444" 
                                stroke="white" strokeWidth="0.5"
                                className="cursor-move hover:fill-red-500 transition-colors"
                                onMouseDown={(e) => handleArrowMouseDown(e, arrow.id, 'end')}
                            />
                            <g className="cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => handleArrowDelete(e, arrow.id)}>
                                <circle cx={delX} cy={delY} r="1.5" fill="#ef4444" stroke="white" strokeWidth="0.5" />
                                <line x1={delX - 0.75} y1={delY - 0.75} x2={delX + 0.75} y2={delY + 0.75} stroke="white" strokeWidth="0.5" strokeLinecap="round" />
                                <line x1={delX + 0.75} y1={delY - 0.75} x2={delX - 0.75} y2={delY + 0.75} stroke="white" strokeWidth="0.5" strokeLinecap="round" />
                            </g>
                        </>
                    )}
                </g>
            );
        })}
      </svg>

      {/* --- OPPONENTS LAYER --- */}
      {opponents.map((opponent) => (
         <div
            key={opponent.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move z-10 group"
            style={{ left: `${opponent.x}%`, top: `${opponent.y}%` }}
            draggable={!isExport}
            onDragStart={(e) => handleOpponentDragStart(e, opponent.id)}
         >
             <div className="w-6 h-6 rounded-full bg-slate-800 border-2 border-white shadow-lg flex items-center justify-center text-white/90">
                 <User size={12} />
             </div>
             
             {/* Delete Opponent */}
             {!isExport && onOpponentRemove && (
                 <div 
                     className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-40 hover:bg-red-600"
                     onClick={(e) => { e.stopPropagation(); onOpponentRemove(opponent.id); }}
                     title="Remove Opponent"
                 >
                     <X size={8} className="text-white" />
                 </div>
             )}
         </div>
      ))}

      {/* --- BALL --- */}
      {ballPosition && (
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move z-30 group"
          style={{ left: `${ballPosition.x}%`, top: `${ballPosition.y}%` }}
          draggable={!isExport}
          onDragStart={(e) => { e.dataTransfer.setData('type', 'ball'); e.stopPropagation(); }}
        >
           <div className="text-xl drop-shadow-md hover:scale-110 transition-transform">⚽</div>
           {!isExport && onBallRemove && (
               <div 
                   className="absolute -top-3 -right-3 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-40 hover:bg-red-600"
                   onClick={(e) => { e.stopPropagation(); onBallRemove(); }}
                   title="Remove ball"
               >
                   <X size={8} className="text-white" />
               </div>
           )}
        </div>
      )}

      {/* --- PLAYERS --- */}
      {slots.map((slot) => {
        const player = getPlayerInSlot(slot.id);
        const isInjured = player?.status === 'Injured';
        const isSuspended = player?.status === 'Suspended';
        
        let strokeColor = kitColor;
        let strokeWidth = 1.5;
        let dropShadowClass = '';
        let nameBorderClass = 'border-slate-500';

        if (isInjured) {
            strokeColor = '#facc15';
            strokeWidth = 2;
            dropShadowClass = 'filter drop-shadow-[0_0_3px_#facc15]';
            nameBorderClass = 'border-yellow-400 text-yellow-400';
        } else if (isSuspended) {
            strokeColor = '#ef4444';
            strokeWidth = 2;
            dropShadowClass = 'filter drop-shadow-[0_0_3px_#ef4444]';
            nameBorderClass = 'border-red-500 text-red-500';
        }

        return (
          <div
            key={slot.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${slotContainerClass} flex flex-col items-center justify-center transition-all hover:scale-105 z-10 cursor-move`}
            style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
            draggable={!isExport}
            onDragStart={(e) => handleDragStart(e, slot.id, player?.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnSlot(e, slot.id)}
            onMouseDown={(e) => e.stopPropagation()} 
          >
            {player ? (
              <div className="flex flex-col items-center group">
                {playerIconStyle === 'shirt' ? (
                  <div className="relative pointer-events-none">
                    <Shirt 
                      size={shirtSize} 
                      className={`drop-shadow-xl transition-all duration-300 ${dropShadowClass}`} 
                      strokeWidth={strokeWidth}
                      color={strokeColor}
                      fill={kitColor}
                    />
                     <span 
                      className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 font-bold transition-colors duration-300 ${isExport ? 'text-lg' : 'text-sm'}`}
                      style={{ color: numberColor }}
                     >
                      {player.number}
                    </span>
                  </div>
                ) : (
                  <div className="relative">
                    <div 
                        className={`${circleSizeClass} rounded-full flex items-center justify-center shadow-lg border-2 font-black z-10 transition-transform group-hover:scale-110 relative`}
                        style={{ 
                            backgroundColor: kitColor, 
                            color: numberColor, 
                            borderColor: strokeColor === kitColor ? 'white' : strokeColor 
                        }}
                    >
                        {player.number}
                    </div>
                    {onRemovePlayer && (
                        <button 
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-20 hover:bg-red-600"
                            onClick={(e) => { e.stopPropagation(); onRemovePlayer(player.id); }}
                            title="Remove from pitch"
                        >
                            <X size={10} />
                        </button>
                    )}
                  </div>
                )}
                
                {/* Conditionally render name only if NOT in small mode (Set Pieces) */}
                {!isSmallMode && (
                  <div className={`mt-0.5 bg-slate-900 text-white ${nameTextSize} ${namePadding} rounded shadow-lg border ${nameBorderClass} whitespace-nowrap z-20 pointer-events-none`}>
                    {player.name}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/30 bg-black/10 flex items-center justify-center pointer-events-none">
                 <span className="text-white/50 text-xs font-bold">{slot.label}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};