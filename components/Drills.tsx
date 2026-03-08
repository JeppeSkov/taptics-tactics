import React, { useState, useCallback, useEffect } from 'react';
import { NavMenu } from './NavMenu';
import { SquadList } from './SquadList';
import { Pitch, PitchArrow, PitchGoal, PitchSmallGoal, PitchCone, PitchMannequin, PitchGate, PitchPole, PitchLadder, PitchPlacedPlayer } from './Pitch';
import { Player, TacticalSlot } from '../types';
import { STORAGE_KEY } from '../constants';
import { Target, Users, Palette, ChevronDown, ZoomIn, ZoomOut, MoveRight, Square, LayoutGrid, Triangle, CircleDot, Columns, Minus, ListOrdered, Undo2, Send, User } from 'lucide-react';

type DrillViewMode = 'full' | 'offensive' | 'defensive' | 'penalty';

interface DrillsProps {
  onNavigate: (page: 'home' | 'builder' | 'setpieces' | 'articles' | 'minutes' | 'drills') => void;
  players: Player[];
  setPlayers: (newPlayers: Player[] | ((prev: Player[]) => Player[])) => void;
}

interface KitColor {
  name: string;
  hex: string;
  text: string;
}

const KIT_COLORS: KitColor[] = [
  { name: 'Red', hex: '#b91c1c', text: 'white' },
  { name: 'Blue', hex: '#1d4ed8', text: 'white' },
  { name: 'White', hex: '#f8fafc', text: '#1e293b' },
  { name: 'Black', hex: '#171717', text: 'white' },
  { name: 'Yellow', hex: '#facc15', text: '#1e293b' },
  { name: 'Green', hex: '#15803d', text: 'white' },
  { name: 'Orange', hex: '#ea580c', text: 'white' },
  { name: 'Purple', hex: '#7e22ce', text: 'white' },
  { name: 'Sky', hex: '#0ea5e9', text: 'white' },
];

const VIEW_OPTIONS: { value: DrillViewMode; label: string }[] = [
  { value: 'full', label: 'Full pitch' },
  { value: 'offensive', label: 'Top (attacking) half' },
  { value: 'defensive', label: 'Bottom (defending) half' },
  { value: 'penalty', label: 'Penalty box' },
];

const MAX_UNDO = 50;
type DrillsSnapshot = {
  viewMode: DrillViewMode;
  slots: TacticalSlot[];
  assignments: Record<string, string>;
  ballPosition: { x: number; y: number } | null;
  arrows: PitchArrow[];
  goals: PitchGoal[];
  smallGoals: PitchSmallGoal[];
  cones: PitchCone[];
  mannequins: PitchMannequin[];
  gates: PitchGate[];
  poles: PitchPole[];
  ladders: PitchLadder[];
  placedPlayers: PitchPlacedPlayer[];
};

export const Drills: React.FC<DrillsProps> = ({ onNavigate, players: globalPlayers, setPlayers: updateGlobalPlayers }) => {
  const loadSaved = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.drillsData || null;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const saved = loadSaved();

  const [viewMode, setViewMode] = useState<DrillViewMode>(saved?.viewMode ?? 'full');
  const [slots, setSlots] = useState<TacticalSlot[]>(saved?.slots ?? []);
  const [currentAssignments, setCurrentAssignments] = useState<Record<string, string>>(saved?.assignments ?? {});
  const [ballPosition, setBallPosition] = useState<{ x: number; y: number } | null>(saved?.ballPosition ?? null);
  const [arrows, setArrows] = useState<PitchArrow[]>(saved?.arrows ?? []);
  const [goals, setGoals] = useState<PitchGoal[]>(saved?.goals ?? []);
  const [smallGoals, setSmallGoals] = useState<PitchSmallGoal[]>(saved?.smallGoals ?? []);
  const [cones, setCones] = useState<PitchCone[]>(saved?.cones ?? []);
  const [mannequins, setMannequins] = useState<PitchMannequin[]>(saved?.mannequins ?? []);
  const [gates, setGates] = useState<PitchGate[]>(saved?.gates ?? []);
  const [poles, setPoles] = useState<PitchPole[]>(saved?.poles ?? []);
  const [ladders, setLadders] = useState<PitchLadder[]>(saved?.ladders ?? []);
  const [placedPlayers, setPlacedPlayers] = useState<PitchPlacedPlayer[]>(saved?.placedPlayers ?? []);
  const [playerToolActive, setPlayerToolActive] = useState(false);
  const [playerToolColor, setPlayerToolColor] = useState<string>(saved?.playerToolColor ?? KIT_COLORS[0].hex);
  const [kitColor, setKitColor] = useState<KitColor>(saved?.kitColor ? KIT_COLORS.find(k => k.hex === saved.kitColor.hex) || KIT_COLORS[0] : KIT_COLORS[0]);
  const [pitchSize, setPitchSize] = useState(500);
  const [arrowToolActive, setArrowToolActive] = useState<false | 'solid' | 'dashed'>(false);
  const [history, setHistory] = useState<DrillsSnapshot[]>([]);
  const [selectedElement, setSelectedElement] = useState<{ type: 'ball' | 'goal' | 'smallGoal' | 'cone' | 'mannequin' | 'gate' | 'pole' | 'ladder' | 'placedPlayer' | 'arrow'; id?: string } | null>(null);
  const [playerColorPickerOpen, setPlayerColorPickerOpen] = useState(false);
  type PlacementElement = 'ball' | 'goal' | 'smallGoal' | 'cone' | 'mannequin' | 'gate' | 'pole' | 'ladder';
  const [placementElement, setPlacementElement] = useState<PlacementElement | null>(null);

  const takeSnapshot = useCallback((): DrillsSnapshot => ({
    viewMode, slots: slots.map(s => ({ ...s })), assignments: { ...currentAssignments },
    ballPosition: ballPosition ? { ...ballPosition } : null,
    arrows: arrows.map(a => ({ ...a })), goals: goals.map(g => ({ ...g })), smallGoals: smallGoals.map(sg => ({ ...sg })),
    cones: cones.map(c => ({ ...c })), mannequins: mannequins.map(m => ({ ...m })), gates: gates.map(g => ({ ...g })),
    poles: poles.map(p => ({ ...p })), ladders: ladders.map(l => ({ ...l })), placedPlayers: placedPlayers.map(p => ({ ...p })),
  }), [viewMode, slots, currentAssignments, ballPosition, arrows, goals, smallGoals, cones, mannequins, gates, poles, ladders, placedPlayers]);

  const pushHistory = useCallback(() => {
    setHistory(prev => [...prev.slice(1 - MAX_UNDO), takeSnapshot()]);
  }, [takeSnapshot]);

  const SIZE_STEP = 0.15;
  const MIN_SIZE = 0.5;
  const MAX_SIZE = 2;
  useEffect(() => {
    if (!selectedElement) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      const delta = e.key === 'ArrowUp' ? SIZE_STEP : -SIZE_STEP;
      const clamp = (v: number) => Math.max(MIN_SIZE, Math.min(MAX_SIZE, v));
      if (selectedElement.type === 'ball') {
        pushHistory();
        setBallPosition(prev => prev ? { ...prev, size: clamp((prev.size ?? 1) + delta) } : null);
      } else if (selectedElement.type === 'goal' && selectedElement.id) {
        pushHistory();
        setGoals(prev => prev.map(g => g.id === selectedElement.id ? { ...g, size: clamp((g.size ?? 1) + delta) } : g));
      } else if (selectedElement.type === 'smallGoal' && selectedElement.id) {
        pushHistory();
        setSmallGoals(prev => prev.map(sg => sg.id === selectedElement.id ? { ...sg, size: clamp((sg.size ?? 1) + delta) } : sg));
      } else if (selectedElement.type === 'cone' && selectedElement.id) {
        pushHistory();
        setCones(prev => prev.map(c => c.id === selectedElement.id ? { ...c, size: clamp((c.size ?? 1) + delta) } : c));
      } else if (selectedElement.type === 'mannequin' && selectedElement.id) {
        pushHistory();
        setMannequins(prev => prev.map(m => m.id === selectedElement.id ? { ...m, size: clamp((m.size ?? 1) + delta) } : m));
      } else if (selectedElement.type === 'gate' && selectedElement.id) {
        pushHistory();
        setGates(prev => prev.map(g => g.id === selectedElement.id ? { ...g, size: clamp((g.size ?? 1) + delta) } : g));
      } else if (selectedElement.type === 'pole' && selectedElement.id) {
        pushHistory();
        setPoles(prev => prev.map(p => p.id === selectedElement.id ? { ...p, size: clamp((p.size ?? 1) + delta) } : p));
      } else if (selectedElement.type === 'ladder' && selectedElement.id) {
        pushHistory();
        setLadders(prev => prev.map(l => l.id === selectedElement.id ? { ...l, size: clamp((l.size ?? 1) + delta) } : l));
      } else if (selectedElement.type === 'arrow' && selectedElement.id) {
        pushHistory();
        setArrows(prev => prev.map(a => a.id === selectedElement.id ? { ...a, size: clamp((a.size ?? 1) + delta) } : a));
      } else if (selectedElement.type === 'placedPlayer' && selectedElement.id) {
        pushHistory();
        setPlacedPlayers(prev => prev.map(p => p.id === selectedElement.id ? { ...p, size: clamp((p.size ?? 1) + delta) } : p));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedElement, pushHistory]);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const s = history[history.length - 1];
    setViewMode(s.viewMode);
    setSlots(s.slots);
    setCurrentAssignments(s.assignments);
    setBallPosition(s.ballPosition);
    setArrows(s.arrows);
    setGoals(s.goals);
    setSmallGoals(s.smallGoals);
    setCones(s.cones);
    setMannequins(s.mannequins);
    setGates(s.gates);
    setPoles(s.poles);
    setLadders(s.ladders);
    setPlacedPlayers(s.placedPlayers);
    setHistory(prev => prev.slice(0, -1));
  }, [history.length]);

  const displayPlayers = globalPlayers.map(p => ({
    ...p,
    assignedSlot: currentAssignments[p.id] || null,
  }));

  useEffect(() => {
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      const parsed = existing ? JSON.parse(existing) : {};
      parsed.drillsData = {
        viewMode,
        slots,
        assignments: currentAssignments,
        ballPosition,
        arrows,
        goals,
        smallGoals,
        cones,
        mannequins,
        gates,
        poles,
        ladders,
        placedPlayers,
        playerToolColor,
        kitColor,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } catch (e) {
      console.error('Failed to save drills', e);
    }
  }, [viewMode, slots, currentAssignments, ballPosition, arrows, goals, smallGoals, cones, mannequins, gates, poles, ladders, placedPlayers, playerToolColor, kitColor]);

  const handleNewPlayerDrop = (playerId: string, x: number, y: number) => {
    pushHistory();
    const newSlotId = `drill-${Date.now()}`;
    setSlots(prev => [...prev, { id: newSlotId, label: 'P', defaultRole: 'Custom', positionGroup: 'D', x, y }]);
    setCurrentAssignments(prev => ({ ...prev, [playerId]: newSlotId }));
  };

  const handlePlayerDrop = useCallback((draggedPlayerId: string, targetSlotId: string) => {
    pushHistory();
    setCurrentAssignments(prev => {
      const targetPlayerId = Object.keys(prev).find(key => prev[key] === targetSlotId);
      const oldSlotId = prev[draggedPlayerId];
      const newAssignments = { ...prev };
      newAssignments[draggedPlayerId] = targetSlotId;
      if (targetPlayerId) {
        if (oldSlotId) newAssignments[targetPlayerId] = oldSlotId;
        else delete newAssignments[targetPlayerId];
      }
      return newAssignments;
    });
  }, [pushHistory]);

  const handleRemovePlayer = (playerId: string) => {
    const assignedSlotId = currentAssignments[playerId];
    if (!assignedSlotId) return;
    pushHistory();
    setSlots(prev => prev.filter(s => s.id !== assignedSlotId));
    setCurrentAssignments(prev => {
      const next = { ...prev };
      delete next[playerId];
      return next;
    });
  };

  const handleSlotMove = (slotId: string, x: number, y: number) => {
    pushHistory();
    setSlots(prev => prev.map(s => s.id === slotId ? { ...s, x, y } : s));
  };

  const handleBallMove = (x: number, y: number) => { pushHistory(); setBallPosition({ x, y }); };
  const handleBallRemove = () => { pushHistory(); setBallPosition(null); };

  const MIN_ARROW_LENGTH = 3; // minimum length in % of pitch (avoids zero-length arrowheads)
  const handleNewArrowDrop = (startX: number, startY: number, endX?: number, endY?: number, dropStyle?: 'solid' | 'dashed') => {
    const ex = endX ?? Math.min(100, startX + 10);
    const ey = endY ?? startY;
    const len = Math.hypot(ex - startX, ey - startY);
    if (len < MIN_ARROW_LENGTH) return;
    const style = dropStyle ?? (arrowToolActive === 'dashed' ? 'dashed' : 'solid');
    pushHistory();
    setArrows(prev => [...prev, { id: `arrow-${Date.now()}`, startX, startY, endX: ex, endY: ey, style }]);
  };
  const handleArrowUpdate = (updatedArrow: PitchArrow) => {
    setArrows(prev => prev.map(a => a.id === updatedArrow.id ? updatedArrow : a));
  };
  const handleArrowRemove = (id: string) => { pushHistory(); setArrows(prev => prev.filter(a => a.id !== id)); };

  const handleNewGoalDrop = (x: number, y: number) => { pushHistory(); setGoals(prev => [...prev, { id: `goal-${Date.now()}`, x, y }]); };
  const handleGoalMove = (id: string, x: number, y: number) => { pushHistory(); setGoals(prev => prev.map(g => g.id === id ? { ...g, x, y } : g)); };
  const handleGoalRemove = (id: string) => { pushHistory(); setGoals(prev => prev.filter(g => g.id !== id)); };

  const handleNewSmallGoalDrop = (x: number, y: number) => { pushHistory(); setSmallGoals(prev => [...prev, { id: `smallGoal-${Date.now()}`, x, y }]); };
  const handleSmallGoalMove = (id: string, x: number, y: number) => { pushHistory(); setSmallGoals(prev => prev.map(sg => sg.id === id ? { ...sg, x, y } : sg)); };
  const handleSmallGoalRemove = (id: string) => { pushHistory(); setSmallGoals(prev => prev.filter(sg => sg.id !== id)); };

  const handleNewConeDrop = (x: number, y: number) => { pushHistory(); setCones(prev => [...prev, { id: `cone-${Date.now()}`, x, y }]); };
  const handleConeMove = (id: string, x: number, y: number) => { pushHistory(); setCones(prev => prev.map(c => c.id === id ? { ...c, x, y } : c)); };
  const handleConeRemove = (id: string) => { pushHistory(); setCones(prev => prev.filter(c => c.id !== id)); };

  const handleNewMannequinDrop = (x: number, y: number) => { pushHistory(); setMannequins(prev => [...prev, { id: `mannequin-${Date.now()}`, x, y }]); };
  const handleMannequinMove = (id: string, x: number, y: number) => { pushHistory(); setMannequins(prev => prev.map(m => m.id === id ? { ...m, x, y } : m)); };
  const handleMannequinRemove = (id: string) => { pushHistory(); setMannequins(prev => prev.filter(m => m.id !== id)); };

  const handleNewGateDrop = (x: number, y: number) => { pushHistory(); setGates(prev => [...prev, { id: `gate-${Date.now()}`, x, y }]); };
  const handleGateMove = (id: string, x: number, y: number) => { pushHistory(); setGates(prev => prev.map(g => g.id === id ? { ...g, x, y } : g)); };
  const handleGateRemove = (id: string) => { pushHistory(); setGates(prev => prev.filter(g => g.id !== id)); };

  const handleNewPoleDrop = (x: number, y: number) => { pushHistory(); setPoles(prev => [...prev, { id: `pole-${Date.now()}`, x, y }]); };
  const handlePoleMove = (id: string, x: number, y: number) => { pushHistory(); setPoles(prev => prev.map(p => p.id === id ? { ...p, x, y } : p)); };
  const handlePoleRemove = (id: string) => { pushHistory(); setPoles(prev => prev.filter(p => p.id !== id)); };

  const handleNewLadderDrop = (x: number, y: number) => { pushHistory(); setLadders(prev => [...prev, { id: `ladder-${Date.now()}`, x, y }]); };
  const handleLadderMove = (id: string, x: number, y: number) => { pushHistory(); setLadders(prev => prev.map(l => l.id === id ? { ...l, x, y } : l)); };
  const handleLadderRemove = (id: string) => { pushHistory(); setLadders(prev => prev.filter(l => l.id !== id)); };

  const handleElementPlace = useCallback((x: number, y: number) => {
    if (!placementElement) return;
    pushHistory();
    switch (placementElement) {
      case 'ball':
        setBallPosition(prev => ({ x, y, size: prev?.size ?? 1 }));
        break;
      case 'goal':
        setGoals(prev => [...prev, { id: `goal-${Date.now()}`, x, y }]);
        break;
      case 'smallGoal':
        setSmallGoals(prev => [...prev, { id: `smallGoal-${Date.now()}`, x, y }]);
        break;
      case 'cone':
        setCones(prev => [...prev, { id: `cone-${Date.now()}`, x, y }]);
        break;
      case 'mannequin':
        setMannequins(prev => [...prev, { id: `mannequin-${Date.now()}`, x, y }]);
        break;
      case 'gate':
        setGates(prev => [...prev, { id: `gate-${Date.now()}`, x, y }]);
        break;
      case 'pole':
        setPoles(prev => [...prev, { id: `pole-${Date.now()}`, x, y }]);
        break;
      case 'ladder':
        setLadders(prev => [...prev, { id: `ladder-${Date.now()}`, x, y }]);
        break;
    }
  }, [placementElement, pushHistory]);

  const handleNewPlacedPlayerDrop = (x: number, y: number) => {
    pushHistory();
    setPlacedPlayers(prev => [...prev, { id: `placedPlayer-${Date.now()}-${Math.random().toString(36).slice(2)}`, x, y, color: playerToolColor }]);
  };
  const handlePlacedPlayerMove = (id: string, x: number, y: number) => { pushHistory(); setPlacedPlayers(prev => prev.map(p => p.id === id ? { ...p, x, y } : p)); };
  const handlePlacedPlayerRemove = (id: string) => { pushHistory(); setPlacedPlayers(prev => prev.filter(p => p.id !== id)); };

  const handleClearPitch = () => {
    if (!window.confirm('Remove everything on the pitch? You can use Undo to restore.')) return;
    pushHistory();
    setSlots([]);
    setCurrentAssignments({});
    setBallPosition(null);
    setArrows([]);
    setGoals([]);
    setSmallGoals([]);
    setCones([]);
    setMannequins([]);
    setGates([]);
    setPoles([]);
    setLadders([]);
    setPlacedPlayers([]);
  };

  const handleUpdatePlayerName = (playerId: string, newName: string) => {
    updateGlobalPlayers(prev => prev.map(p => p.id === playerId ? { ...p, name: newName } : p));
  };
  const handleUpdatePlayerNumber = (playerId: string, newNumber: number) => {
    updateGlobalPlayers(prev => prev.map(p => p.id === playerId ? { ...p, number: newNumber } : p));
  };
  const handleUpdatePlayerStatus = () => {};
  const handleAddPlayer = () => {};

  const pitchViewMode = viewMode === 'penalty' ? 'penalty' : viewMode;
  const pitchScenario = viewMode === 'offensive' ? 'offensive' : viewMode === 'defensive' ? 'defensive' : 'full';

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-200 font-sans p-4 flex flex-col overflow-hidden relative items-center">
      <div className="w-full max-w-[1600px] flex flex-col h-full flex-1 min-h-0">
        <header className="h-14 bg-slate-900 border-b border-slate-700 flex items-center px-6 justify-between mb-4 rounded-lg shadow-lg shrink-0">
          <div className="flex items-center gap-4">
            <NavMenu onNavigate={onNavigate} currentPage="drills" />
            <div className="flex items-center gap-4">
              <div className="bg-amber-600 p-2 rounded">
                <Target size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-none flex items-center gap-2">
                  Drills
                  <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30 uppercase tracking-wider">Beta</span>
                </h1>
                <span className="text-xs text-slate-400">Design & share exercises</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={undo}
              disabled={history.length === 0}
              className="p-2 rounded-lg border border-slate-600 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-800 disabled:hover:text-slate-300 transition-colors"
              title="Undo last change"
            >
              <Undo2 size={18} />
            </button>
            <div className="relative">
              <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
                <LayoutGrid size={16} className="text-amber-400" />
                <select
                  value={viewMode}
                  onChange={(e) => { pushHistory(); setViewMode(e.target.value as DrillViewMode); }}
                  className="bg-transparent text-white text-sm font-bold outline-none cursor-pointer appearance-none pr-6 z-10"
                >
                  {VIEW_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="text-slate-400 absolute right-3 pointer-events-none" />
              </div>
            </div>

            <div className="h-8 w-[1px] bg-slate-700 mx-2" />

            <div className="flex items-center gap-1.5 bg-slate-800 px-2 py-1.5 rounded border border-slate-700">
              <Palette size={14} className="text-slate-400 mr-1" />
              {KIT_COLORS.map(c => (
                <button
                  key={c.name}
                  onClick={() => setKitColor(c)}
                  className={`w-4 h-4 rounded-full border border-slate-600 hover:scale-110 transition-transform ${kitColor.name === c.name ? 'ring-2 ring-white scale-110' : ''}`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        </header>

        <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
          <section className="flex-grow w-[30%] flex flex-col">
            <div className="bg-slate-800/50 p-2 rounded-t-lg border border-slate-700 border-b-0 shrink-0">
              <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <Users size={16} />
                Squad
              </h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <SquadList
                players={displayPlayers}
                slots={slots}
                benchSlots={[]}
                subCount={0}
                onPlayerDrop={handlePlayerDrop}
                onUnassignPlayer={handleRemovePlayer}
                onUpdatePlayerName={handleUpdatePlayerName}
                onUpdatePlayerNumber={handleUpdatePlayerNumber}
                onUpdatePlayerStatus={handleUpdatePlayerStatus}
                onAddPlayer={handleAddPlayer}
              />
            </div>
          </section>

          <section className="w-[70%] flex flex-col gap-4 overflow-y-auto pr-2">
            <div className="w-full flex justify-center bg-slate-900/20 rounded-lg p-4 border border-slate-800 shrink-0 relative group">
              <div className="absolute top-4 right-4 flex flex-col gap-1 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                <button type="button" onClick={() => setPitchSize(prev => Math.min(prev + 50, 900))} className="p-2 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg border border-slate-600 shadow-lg" title="Zoom In">
                  <ZoomIn size={16} />
                </button>
                <button type="button" onClick={() => setPitchSize(prev => Math.max(prev - 50, 300))} className="p-2 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg border border-slate-600 shadow-lg" title="Zoom Out">
                  <ZoomOut size={16} />
                </button>
                <button type="button" onClick={handleClearPitch} className="px-2 py-1 bg-slate-800 text-[10px] font-bold text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg border border-slate-600 shadow-lg mt-1" title="Clear pitch (removes all elements)">
                  Reset
                </button>
              </div>

              <div className="relative transition-all duration-300" style={{ width: `${pitchSize}px`, maxWidth: '100%' }}>
                {viewMode !== 'full' && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-slate-400 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-slate-700 shadow-lg">
                    {viewMode === 'offensive' ? 'Attacking half' : viewMode === 'defensive' ? 'Defending half' : 'Penalty box'}
                  </div>
                )}
                <Pitch
                  slots={slots}
                  players={displayPlayers}
                  onPlayerDrop={handlePlayerDrop}
                  onSlotMove={handleSlotMove}
                  onNewPlayerDrop={handleNewPlayerDrop}
                  onRemovePlayer={handleRemovePlayer}
                  ballPosition={ballPosition}
                  onBallMove={handleBallMove}
                  onBallRemove={handleBallRemove}
                  arrows={arrows}
                  onNewArrowDrop={handleNewArrowDrop}
                  onArrowUpdate={handleArrowUpdate}
                  onArrowRemove={handleArrowRemove}
                  arrowDrawingMode={!!arrowToolActive}
                  arrowDrawStyle={arrowToolActive === 'dashed' ? 'dashed' : 'solid'}
                  onArrowDragStart={pushHistory}
                  onArrowSelect={(id) => setSelectedElement({ type: 'arrow', id })}
                  onElementClick={(type, id) => setSelectedElement({ type, id })}
                  onPitchBackgroundClick={() => { setSelectedElement(null); setPlayerColorPickerOpen(false); setPlacementElement(null); }}
                  goals={goals}
                  onNewGoalDrop={handleNewGoalDrop}
                  onGoalMove={handleGoalMove}
                  onGoalRemove={handleGoalRemove}
                  smallGoals={smallGoals}
                  onNewSmallGoalDrop={handleNewSmallGoalDrop}
                  onSmallGoalMove={handleSmallGoalMove}
                  onSmallGoalRemove={handleSmallGoalRemove}
                  cones={cones}
                  onNewConeDrop={handleNewConeDrop}
                  onConeMove={handleConeMove}
                  onConeRemove={handleConeRemove}
                  mannequins={mannequins}
                  onNewMannequinDrop={handleNewMannequinDrop}
                  onMannequinMove={handleMannequinMove}
                  onMannequinRemove={handleMannequinRemove}
                  gates={gates}
                  onNewGateDrop={handleNewGateDrop}
                  onGateMove={handleGateMove}
                  onGateRemove={handleGateRemove}
                  poles={poles}
                  onNewPoleDrop={handleNewPoleDrop}
                  onPoleMove={handlePoleMove}
                  onPoleRemove={handlePoleRemove}
                  ladders={ladders}
                  onNewLadderDrop={handleNewLadderDrop}
                  onLadderMove={handleLadderMove}
                  onLadderRemove={handleLadderRemove}
                  placedPlayers={placedPlayers}
                  placedPlayerDrawingMode={playerToolActive}
                  onNewPlacedPlayerDrop={handleNewPlacedPlayerDrop}
                  onPlacedPlayerMove={handlePlacedPlayerMove}
                  onPlacedPlayerRemove={handlePlacedPlayerRemove}
                  onPlacedPlayerDragStart={pushHistory}
                  elementPlacementMode={!!placementElement}
                  onElementPlace={handleElementPlace}
                  kitColor={kitColor.hex}
                  numberColor={kitColor.text}
                  viewMode={pitchViewMode}
                  playerIconStyle="circle"
                  isSmallMode={true}
                />
                {slots.length === 0 && !ballPosition && arrows.length === 0 && goals.length === 0 && smallGoals.length === 0 && cones.length === 0 && mannequins.length === 0 && gates.length === 0 && poles.length === 0 && ladders.length === 0 && placedPlayers.length === 0 && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none text-white/20 font-bold text-xl uppercase tracking-widest text-center">
                    Click an element, then click the pitch to place
                  </div>
                )}
              </div>
            </div>

            <div className="w-full max-w-[600px] mx-auto bg-slate-800/80 border border-slate-700 rounded-lg p-4 shrink-0 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <span>Elements</span>
                  <div className="h-px bg-slate-700 flex-grow" />
                </h3>
                <div className="flex gap-3 items-end justify-center flex-wrap">
                  {(['ball', 'goal', 'smallGoal', 'cone', 'mannequin', 'gate', 'pole', 'ladder'] as const).map((el) => {
                    const active = placementElement === el;
                    const toggle = () => {
                      if (placementElement === el) {
                        setPlacementElement(null);
                      } else {
                        setPlacementElement(el);
                        setPlayerToolActive(false);
                        setArrowToolActive(false);
                        setPlayerColorPickerOpen(false);
                        setSelectedElement(null);
                      }
                    };
                    const label = el === 'ball' ? 'Ball' : el === 'goal' ? 'Goal' : el === 'smallGoal' ? 'Small goal' : el === 'cone' ? 'Cone' : el === 'mannequin' ? 'Mannequin' : el === 'gate' ? 'Gate' : el === 'pole' ? 'Pole' : 'Ladder';
                    const icon = el === 'ball' ? <span className="text-xl leading-none">⚽</span> : el === 'goal' ? <Square size={20} className="text-white" /> : el === 'smallGoal' ? <LayoutGrid size={18} className="text-slate-400" /> : el === 'cone' ? <Triangle size={20} fill="currentColor" /> : el === 'mannequin' ? <CircleDot size={20} /> : el === 'gate' ? <Columns size={20} /> : el === 'pole' ? <Minus size={20} className="rotate-90" /> : <ListOrdered size={20} />;
                    return (
                      <div key={el} className="flex flex-col items-center gap-1">
                        <button
                          type="button"
                          onClick={toggle}
                          className={`w-11 h-11 rounded-lg flex items-center justify-center border transition-all shrink-0 ${active ? 'bg-amber-600/30 border-amber-500 text-amber-200 ring-2 ring-amber-500/70' : 'bg-slate-900 hover:bg-slate-700 text-slate-300 border-slate-600 hover:border-amber-500/50 hover:text-white'}`}
                          title={active ? `Click pitch to place ${label} — click again to turn off` : `${label} — click then click pitch to place`}
                        >
                          {icon}
                        </button>
                        <span className="text-[10px] text-slate-500">{label}</span>
                      </div>
                    );
                  })}
                  <div className="flex flex-col items-center gap-1 relative">
                    <button
                      type="button"
                      onClick={() => {
                        if (playerToolActive) {
                          setPlayerToolActive(false);
                        } else {
                          setPlacementElement(null);
                          setArrowToolActive(false);
                          setPlayerColorPickerOpen(prev => !prev);
                        }
                      }}
                      className={`w-11 h-11 rounded-lg flex items-center justify-center border transition-all shrink-0 relative ${playerToolActive ? 'bg-amber-600/30 border-amber-500 text-amber-200 ring-2 ring-amber-500/70' : 'bg-slate-900 hover:bg-slate-700 text-slate-300 border-slate-600 hover:border-amber-500/50 hover:text-white'} ${playerColorPickerOpen ? 'ring-2 ring-amber-500/70' : ''}`}
                      title={playerToolActive ? 'Click pitch to place player — click again to turn off' : 'Player — choose color, then click pitch to place'}
                    >
                      <User size={20} />
                      <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border border-white shadow-inner" style={{ backgroundColor: playerToolColor }} />
                    </button>
                    {playerColorPickerOpen && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 p-2 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 flex flex-wrap gap-1.5 justify-center min-w-[120px]">
                        {KIT_COLORS.map(c => (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => {
                              setPlayerToolColor(c.hex);
                              setPlayerToolActive(true);
                              setPlacementElement(null);
                              setArrowToolActive(false);
                              setPlayerColorPickerOpen(false);
                            }}
                            className={`w-6 h-6 rounded-full border-2 hover:scale-110 transition-transform ${playerToolColor === c.hex ? 'ring-2 ring-white border-white scale-110' : 'border-slate-600'}`}
                            style={{ backgroundColor: c.hex }}
                            title={c.name}
                          />
                        ))}
                      </div>
                    )}
                    <span className="text-[10px] text-slate-500">Player</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <span>Drawing tools</span>
                  <div className="h-px bg-slate-700 flex-grow" />
                </h3>
                <div className="flex gap-3 items-end justify-center flex-wrap">
                  <div className="flex flex-col items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (arrowToolActive === 'solid') setArrowToolActive(false);
                        else {
                          setArrowToolActive('solid');
                          setPlacementElement(null);
                          setPlayerToolActive(false);
                          setPlayerColorPickerOpen(false);
                          setSelectedElement(null);
                        }
                      }}
                      className={`w-11 h-11 rounded-lg flex items-center justify-center border transition-all shrink-0 ${arrowToolActive === 'solid' ? 'bg-amber-600/30 border-amber-500 text-amber-200 ring-2 ring-amber-500/70' : 'bg-slate-900 hover:bg-slate-700 text-slate-300 border-slate-600 hover:border-amber-500/50 hover:text-white'}`}
                      title={arrowToolActive === 'solid' ? 'Run/movement — click again to turn off' : 'Arrow (run) — click then draw on pitch'}
                    >
                      <MoveRight size={20} />
                    </button>
                    <span className="text-[10px] text-slate-500">Arrow</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (arrowToolActive === 'dashed') setArrowToolActive(false);
                        else {
                          setArrowToolActive('dashed');
                          setPlacementElement(null);
                          setPlayerToolActive(false);
                          setPlayerColorPickerOpen(false);
                          setSelectedElement(null);
                        }
                      }}
                      className={`w-11 h-11 rounded-lg flex items-center justify-center border transition-all shrink-0 ${arrowToolActive === 'dashed' ? 'bg-amber-600/30 border-amber-500 text-amber-200 ring-2 ring-amber-500/70' : 'bg-slate-900 hover:bg-slate-700 text-slate-300 border-slate-600 hover:border-amber-500/50 hover:text-white'}`}
                      title={arrowToolActive === 'dashed' ? 'Pass — click again to turn off' : 'Pass (dotted arrow) — click then draw on pitch'}
                    >
                      <Send size={18} />
                    </button>
                    <span className="text-[10px] text-slate-500">Pass</span>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 text-center pt-1">Players: drag from squad list onto the pitch</p>
              {selectedElement && (
                <p className="text-[10px] text-amber-500/90 text-center pt-0.5">Selected: press ↑ or ↓ to resize</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
