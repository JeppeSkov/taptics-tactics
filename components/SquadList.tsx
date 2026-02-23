import React, { useState } from 'react';
import { Player, TacticalSlot } from '../types';
import { Info, GripVertical, Plus } from 'lucide-react';

interface StatusOption {
    label: string;
    value: string;
    className: string;
}

interface SquadListProps {
  players: Player[];
  slots: TacticalSlot[];
  benchSlots: string[];
  subCount: number;
  onPlayerDrop: (draggedPlayerId: string, targetSlotId: string) => void;
  onUnassignPlayer?: (playerId: string) => void; // New optional prop for handling unassignment
  onUpdatePlayerName: (playerId: string, newName: string) => void;
  onUpdatePlayerNumber: (playerId: string, newNumber: number) => void;
  onUpdatePlayerStatus: (playerId: string, newStatus: string) => void;
  onAddPlayer: (slotId: string) => void;
  customStatusConfig?: StatusOption[]; // New prop for custom statuses (roles)
}

export const SquadList: React.FC<SquadListProps> = ({ 
    players, 
    slots, 
    benchSlots,
    subCount,
    onPlayerDrop,
    onUnassignPlayer,
    onUpdatePlayerName,
    onUpdatePlayerNumber,
    onUpdatePlayerStatus,
    onAddPlayer,
    customStatusConfig
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNumberId, setEditingNumberId] = useState<string | null>(null);

  const getPlayerInSlot = (slotId: string) => players.find(p => p.assignedSlot === slotId);

  // Active bench slots based on selected subCount
  const activeBenchSlots = benchSlots.slice(0, subCount);

  // Filter players who are NOT in the active formation or active bench slots (Unassigned)
  const activeSlotIds = new Set([...slots.map(s => s.id), ...activeBenchSlots]);
  
  const unassignedPlayers = players
    .filter(p => !p.assignedSlot || !activeSlotIds.has(p.assignedSlot));

  const handleDragStart = (e: React.DragEvent, playerId: string) => {
    e.dataTransfer.setData('playerId', playerId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetSlotId: string) => {
    e.preventDefault();
    const playerId = e.dataTransfer.getData('playerId');
    if (playerId) {
      onPlayerDrop(playerId, targetSlotId);
    }
  };

  const handleUnassignDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const playerId = e.dataTransfer.getData('playerId');
    if (playerId && onUnassignPlayer) {
        onUnassignPlayer(playerId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, playerId: string, newName: string) => {
      if (e.key === 'Enter') {
          onUpdatePlayerName(playerId, newName);
          setEditingId(null);
      }
  };

  const getStatusColor = (status: string = 'Ready') => {
      if (customStatusConfig) {
          const opt = customStatusConfig.find(o => o.value === status);
          if (opt) return opt.className.replace('bg-slate-800', ''); // Strip bg if present for text color match
          return 'text-slate-400';
      }

      switch(status) {
          case 'Ready': return 'text-green-500';
          case 'Injured': return 'text-yellow-400';
          case 'Suspended': return 'text-red-500';
          case 'Not in form': return 'text-gray-400';
          default: return 'text-slate-400';
      }
  };

  // Helper to render a player row content, shared between standard slots and reserves
  const renderPlayerContent = (player: Player | undefined, positionLabel: string, slotId?: string) => {
      return (
        <>
            {/* COL 1: Position */}
            <div className="w-8 flex-shrink-0 font-bold text-slate-500 flex flex-col justify-center leading-tight text-[10px]">
                <span className="text-slate-300 pl-1">{positionLabel}</span>
            </div>

            {/* COL 2: Name (Editable, Draggable) */}
            <div className="flex-grow flex items-center gap-2 border-r border-slate-700/50 pr-2 mr-2 overflow-hidden">
                {player ? (
                    <div 
                        className="flex items-center gap-2 w-full overflow-hidden"
                        draggable={!editingId}
                        onDragStart={(e) => handleDragStart(e, player.id)}
                    >
                        <div className="cursor-move text-slate-600 hover:text-slate-400 shrink-0">
                            <GripVertical size={12} />
                        </div>
                        
                        {/* Editable Number */}
                        {editingNumberId === player.id ? (
                            <input 
                                autoFocus
                                type="text"
                                className="bg-slate-900 text-white text-[9px] w-6 h-4 text-center rounded border border-emerald-500 outline-none p-0 shrink-0"
                                defaultValue={player.number}
                                onBlur={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (!isNaN(val)) onUpdatePlayerNumber(player.id, val);
                                    setEditingNumberId(null);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const val = parseInt(e.currentTarget.value);
                                        if (!isNaN(val)) onUpdatePlayerNumber(player.id, val);
                                        setEditingNumberId(null);
                                    }
                                }}
                            />
                        ) : (
                            <div 
                                className="bg-slate-700 text-slate-300 w-4 h-4 flex items-center justify-center rounded text-[9px] font-bold shrink-0 cursor-pointer hover:bg-slate-600 hover:text-white transition-colors"
                                onClick={() => setEditingNumberId(player.id)}
                                title="Click to edit number"
                            >
                                {player.number}
                            </div>
                        )}
                        
                        {editingId === player.id ? (
                            <input 
                                autoFocus
                                className="bg-slate-900 text-white text-xs px-1 py-0.5 rounded w-full border border-emerald-500 outline-none"
                                defaultValue={player.name}
                                onBlur={(e) => {
                                    onUpdatePlayerName(player.id, e.target.value);
                                    setEditingId(null);
                                }}
                                onKeyDown={(e) => handleKeyDown(e, player.id, e.currentTarget.value)}
                            />
                        ) : (
                            <span 
                                className={`font-medium truncate cursor-text hover:text-emerald-400 transition-colors select-none w-full block text-xs ${!player.name ? 'text-slate-500 italic' : 'text-slate-200'}`}
                                onDoubleClick={() => setEditingId(player.id)}
                                title="Double click to edit name"
                            >
                                {player.name || "Enter Name"}
                            </span>
                        )}
                    </div>
                ) : (
                    <button 
                        onClick={() => slotId && onAddPlayer(slotId)}
                        className="text-slate-600 italic text-[10px] ml-6 hover:text-emerald-400 hover:underline bg-transparent border-none cursor-pointer flex items-center gap-1 transition-colors outline-none"
                    >
                        <Plus size={10} /> Add Player
                    </button>
                )}
            </div>

            {/* COL 3: Status/Role (Dropdown) */}
            <div className="w-24 flex-shrink-0 flex items-center justify-center border-r border-slate-700/50 pr-2 mr-2">
                {player ? (
                    <select 
                        className={`bg-transparent text-[10px] font-bold outline-none cursor-pointer ${getStatusColor(player.status)}`}
                        value={player.status || (customStatusConfig ? customStatusConfig[0].value : 'Ready')}
                        onChange={(e) => onUpdatePlayerStatus(player.id, e.target.value)}
                    >
                        {customStatusConfig ? (
                            customStatusConfig.map(opt => (
                                <option key={opt.value} value={opt.value} className={opt.className}>{opt.label}</option>
                            ))
                        ) : (
                            <>
                                <option value="Ready" className="text-green-500 bg-slate-800">Ready</option>
                                <option value="Injured" className="text-yellow-400 bg-slate-800">Injured</option>
                                <option value="Suspended" className="text-red-500 bg-slate-800">Suspended</option>
                                <option value="Not in form" className="text-gray-400 bg-slate-800">Not in form</option>
                            </>
                        )}
                    </select>
                ) : (
                    <span className="text-slate-700">-</span>
                )}
            </div>

            {/* COL 4: Info */}
            {player && (
                <div className="flex items-center justify-center w-6 flex-shrink-0">
                    <Info size={12} className="text-slate-600 hover:text-slate-400 cursor-pointer" />
                </div>
            )}
        </>
      );
  };

  const rowClass = "group flex items-center border-b border-slate-700/50 bg-slate-800/40 hover:bg-slate-700/50 transition-colors h-8 px-2";

  const renderRow = (slotId: string, label?: string, isSub: boolean = false) => {
    const player = getPlayerInSlot(slotId);
    
    // Find slot definition to use its label if available (e.g. for dynamic slots 1, 2, 3...)
    // For Set Pieces, slots are dynamic, we can just use the index + 1 as label if label is 'SP'
    const index = slots.findIndex(s => s.id === slotId);
    const slotDef = slots[index];
    
    // Create a dynamic position label (e.g., "1", "2") if it's a dynamic set piece slot
    let positionLabel = label || slotId;
    if (!label && slotDef && slotDef.label === 'SP') {
        positionLabel = (index + 1).toString();
    } else if (slotDef) {
        positionLabel = slotDef.id; // Use ID (e.g. "GK") instead of label (e.g. "Goalkeeper")
    }

    return (
      <div 
        key={slotId}
        className={rowClass}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, slotId)}
      >
        {renderPlayerContent(player, positionLabel, slotId)}
      </div>
    );
  };

  const renderAvailableRow = (player: Player) => {
    const availableRowClass = "group flex items-center border-b border-slate-700/50 bg-slate-800/20 hover:bg-slate-700/30 transition-colors h-8 px-2";
    return (
        <div key={player.id} className={availableRowClass}>
            {renderPlayerContent(player, "AVL")}
        </div>
    );
  };

  const renderInjuredRow = (player: Player) => {
    const injuredRowClass = "group flex items-center border-b border-slate-700/50 bg-yellow-900/10 hover:bg-yellow-900/20 transition-colors h-8 px-2";
    return (
        <div key={player.id} className={injuredRowClass}>
            {renderPlayerContent(player, "INJ")}
        </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 overflow-hidden rounded-lg border border-slate-700 shadow-xl">
      {/* Header */}
      <div className="bg-slate-800 px-2 py-1.5 border-b border-slate-700 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        <div className="flex items-center flex-grow">
            <span className="w-8 pl-1">Pos</span>
            <span className="flex-grow pl-2">Name</span>
            <span className="w-24 text-center mr-2">{customStatusConfig ? 'Role' : 'Status'}</span>
        </div>
        <div className="flex justify-center w-6">
            <span>Inf</span>
        </div>
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {slots.map(slot => renderRow(slot.id))}
        
        {(activeBenchSlots.length > 0) && <div className="border-t border-slate-700 my-0.5"></div>}
        
        {activeBenchSlots.map((slotId, index) => renderRow(slotId, `S${index + 1}`, true))}

        {/* Drop Zone for Unassigning Players (Dragging from Pitch back to List) */}
        <div 
            className={`transition-colors ${onUnassignPlayer ? 'min-h-[50px] bg-slate-900/50' : ''}`}
            onDragOver={onUnassignPlayer ? handleDragOver : undefined}
            onDrop={onUnassignPlayer ? handleUnassignDrop : undefined}
        >
             {/* Divider for Unassigned */}
             {(slots.length > 0 || activeBenchSlots.length > 0) && <div className="border-t border-slate-700 my-0.5 opacity-50"></div>}
             
            {unassignedPlayers.map(player => (
                player.status === 'Injured' 
                    ? renderInjuredRow(player)
                    : renderAvailableRow(player)
            ))}
            
            {onUnassignPlayer && unassignedPlayers.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-600 italic">
                    All players assigned.
                </div>
            )}
        </div>
      </div>
    </div>
  );
};