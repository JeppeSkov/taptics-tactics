
import React, { useState, useCallback, useEffect } from 'react';
import { NavMenu } from './NavMenu';
import { SquadList } from './SquadList';
import { Pitch, PitchArrow, PitchZone, PitchOpponent } from './Pitch';
import { SetPieceSharedView, SharedSetPiecePayload } from './SetPieceSharedView';
import { Player, TacticalSlot } from '../types';
import { STORAGE_KEY } from '../constants';
import { Flag, Users, Trash2, Palette, ChevronDown, CornerUpRight, Shield, MoveRight, User, CircleDashed, ClipboardEdit, Save, Play, Clock, Layout, X, AlertTriangle, Check, RefreshCw, Plus, Share2, Copy, Link as LinkIcon, ZoomIn, ZoomOut, Eye } from 'lucide-react';

interface SetPiecesProps {
  onNavigate: (page: 'home' | 'builder' | 'setpieces' | 'articles' | 'minutes') => void;
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

const SET_PIECE_ROLES = [
    { label: 'Select Role', value: 'Ready', className: 'text-slate-400 bg-slate-800' },
    { label: 'Taker', value: 'Taker', className: 'text-emerald-400 font-bold bg-slate-800' },
    { label: 'Target Man', value: 'Target', className: 'text-blue-400 font-bold bg-slate-800' },
    { label: 'Near Post', value: 'Near Post', className: 'text-orange-400 bg-slate-800' },
    { label: 'Far Post', value: 'Far Post', className: 'text-indigo-400 bg-slate-800' },
    { label: 'Blocker', value: 'Blocker', className: 'text-red-400 bg-slate-800' },
    { label: 'Recovery', value: 'Recovery', className: 'text-slate-400 bg-slate-800' },
    { label: 'Short Option', value: 'Short', className: 'text-yellow-400 bg-slate-800' },
    { label: 'Edge of Box', value: 'Edge', className: 'text-pink-400 bg-slate-800' },
];

type ScenarioType = 'offensive' | 'defensive';

interface ScenarioData {
    slots: TacticalSlot[];
    assignments: Record<string, string>; // playerId -> slotId
    roles: Record<string, string>; // playerId -> role (New field)
    ballPosition: { x: number, y: number } | null;
    arrows: PitchArrow[];
    zones: PitchZone[];
    opponents: PitchOpponent[];
    notes: string;
    plan?: string;
}

export interface SavedRoutine {
    id: string;
    name: string;
    scenario: ScenarioType;
    data: ScenarioData;
    createdAt: number;
}

// Unicode-safe Base64 encoding
const safeBtoa = (str: string) => {
    try {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
            function toSolidBytes(match, p1) {
                return String.fromCharCode(parseInt(p1, 16));
            }));
    } catch (e) {
        console.error("Encoding error", e);
        return '';
    }
};

// Unicode-safe Base64 decoding
const safeAtob = (str: string) => {
    try {
        return decodeURIComponent(atob(str).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    } catch (e) {
        console.error("Decoding error", e);
        return '';
    }
};

export const SetPieces: React.FC<SetPiecesProps> = ({ 
    onNavigate, 
    players: globalPlayers, 
    setPlayers: updateGlobalPlayers 
}) => {
  // --- Shared View Logic ---
  const [isSharedMode, setIsSharedMode] = useState(false);
  const [sharedPayload, setSharedPayload] = useState<SharedSetPiecePayload | null>(null);

  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const dataParam = params.get('sp_data');
      if (dataParam) {
          try {
              const jsonString = safeAtob(dataParam);
              if (jsonString) {
                  const decoded = JSON.parse(jsonString);
                  setSharedPayload(decoded);
                  setIsSharedMode(true);
              }
          } catch (e) {
              console.error("Failed to parse shared set piece data", e);
          }
      }
  }, []);

  const handleBackFromShared = () => {
      setIsSharedMode(false);
      // Clean URL
      window.history.pushState({}, '', window.location.pathname);
  };

  // --- Initialization Helper ---
  const loadInitialState = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch(e) { console.error(e); }
    return null;
  };
  
  const savedState = loadInitialState();
  const savedSetPieces = savedState?.setPiecesData;
  const savedScenario = savedState?.setPiecesCurrentScenario || 'offensive';
  const savedKitColor = savedState?.setPiecesKitColor;

  const initialScenariosData = savedSetPieces || {
      offensive: { slots: [], assignments: {}, roles: {}, ballPosition: null, arrows: [], zones: [], opponents: [], notes: '', plan: '' },
      defensive: { slots: [], assignments: {}, roles: {}, ballPosition: null, arrows: [], zones: [], opponents: [], notes: '', plan: '' }
  };
  
  // Active Data for initialization
  const activeData: ScenarioData = initialScenariosData[savedScenario];

  // --- State Initialization ---
  const [kitColor, setKitColor] = useState<KitColor>(savedKitColor || KIT_COLORS[0]);
  
  // Scenario Management
  const [scenario, setScenario] = useState<ScenarioType>(savedScenario);
  const [scenariosData, setScenariosData] = useState<Record<ScenarioType, ScenarioData>>(initialScenariosData);
  
  // Local State for Current Scenario
  const [slots, setSlots] = useState<TacticalSlot[]>(activeData.slots || []);
  const [ballPosition, setBallPosition] = useState<{ x: number, y: number } | null>(activeData.ballPosition || null);
  const [arrows, setArrows] = useState<PitchArrow[]>(activeData.arrows || []);
  const [zones, setZones] = useState<PitchZone[]>(activeData.zones || []);
  const [opponents, setOpponents] = useState<PitchOpponent[]>(activeData.opponents || []);
  const [notes, setNotes] = useState<string>(activeData.notes || '');
  const [plan, setPlan] = useState<string>(activeData.plan || '');
  const [currentAssignments, setCurrentAssignments] = useState<Record<string, string>>(activeData.assignments || {});
  const [currentRoles, setCurrentRoles] = useState<Record<string, string>>(activeData.roles || {});

  // Saved Routines State (with safety check for array type)
  const [savedRoutines, setSavedRoutines] = useState<SavedRoutine[]>(
      Array.isArray(savedState?.savedRoutines) ? savedState.savedRoutines : []
  );

  // Track currently loaded routine for editing
  const [loadedRoutineId, setLoadedRoutineId] = useState<string | null>(null);

  // Modal & UI States
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isClearBoardModalOpen, setIsClearBoardModalOpen] = useState(false);
  const [isShareDropdownOpen, setIsShareDropdownOpen] = useState(false);
  const [isShareWarningOpen, setIsShareWarningOpen] = useState(false);
  const [pendingShareMode, setPendingShareMode] = useState<'single' | 'all' | null>(null);
  const [saveName, setSaveName] = useState('');
  
  // Local UI State (not persisted)
  const [pitchSize, setPitchSize] = useState(500); // px width
  
  const [deleteRoutineId, setDeleteRoutineId] = useState<string | null>(null);

  // Toast State
  const [toast, setToast] = useState<{ message: string, visible: boolean }>({ message: '', visible: false });

  // Computed Players for Display
  const displayPlayers = globalPlayers.map(p => ({
      ...p,
      assignedSlot: currentAssignments[p.id] || null,
      status: currentRoles[p.id] || 'Ready'
  }));

  const showToast = (message: string) => {
      setToast({ message, visible: true });
      setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  // --- Persistence Effect ---
  // Save whenever relevant state changes
  useEffect(() => {
    if (isSharedMode) return;

    // Construct the full data object representing current visual state
    const currentSnapshot: ScenarioData = {
        slots,
        assignments: currentAssignments,
        roles: currentRoles,
        ballPosition,
        arrows,
        zones,
        opponents,
        notes,
        plan
    };

    // Update the master data object
    const fullScenariosData = {
        ...scenariosData,
        [scenario]: currentSnapshot
    };

    try {
        const existing = localStorage.getItem(STORAGE_KEY);
        const parsed = existing ? JSON.parse(existing) : {};
        
        // Merge set pieces data into global storage
        const newState = {
            ...parsed,
            setPiecesData: fullScenariosData,
            setPiecesCurrentScenario: scenario,
            setPiecesKitColor: kitColor,
            savedRoutines: savedRoutines // Save list of routines
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
        console.error("Failed to save set pieces", e);
    }
  }, [
      slots, currentAssignments, currentRoles, ballPosition, arrows, zones, opponents, notes, plan,
      scenario, scenariosData, kitColor, savedRoutines, isSharedMode
  ]);

  // Helper to switch scenario
  const switchScenario = (newScenario: ScenarioType) => {
      if (newScenario === scenario) return;
      
      setLoadedRoutineId(null); // Clear loaded routine when switching context to avoid accidental overwrites
      
      // 1. Save current state to local variable
      const updatedScenariosData = {
          ...scenariosData,
          [scenario]: {
              slots,
              assignments: currentAssignments,
              roles: currentRoles,
              ballPosition,
              arrows,
              zones,
              opponents,
              notes,
              plan
          }
      };
      
      // 2. Load new state
      const targetData = updatedScenariosData[newScenario];
      
      // 3. Update all states
      setScenariosData(updatedScenariosData);
      setScenario(newScenario);
      setSlots(targetData.slots || []);
      setCurrentAssignments(targetData.assignments || {});
      setCurrentRoles(targetData.roles || {});
      setBallPosition(targetData.ballPosition || null);
      setArrows(targetData.arrows || []);
      setZones(targetData.zones || []);
      setOpponents(targetData.opponents || []);
      setNotes(targetData.notes || '');
      setPlan(targetData.plan || '');
  };

  const handleNewPlayerDrop = (playerId: string, x: number, y: number) => {
    const newSlotId = `sp-${Date.now()}`;
    const newSlot: TacticalSlot = {
        id: newSlotId,
        label: 'SP',
        defaultRole: 'Custom',
        positionGroup: 'SP',
        x,
        y
    };

    setSlots(prev => [...prev, newSlot]);
    setCurrentAssignments(prev => ({ ...prev, [playerId]: newSlotId }));
  };

  const handlePlayerDrop = useCallback((draggedPlayerId: string, targetSlotId: string) => {
    setCurrentAssignments((prev) => {
      const targetPlayerId = Object.keys(prev).find(key => prev[key] === targetSlotId);
      const oldSlotId = prev[draggedPlayerId];
      const newAssignments = { ...prev };
      
      newAssignments[draggedPlayerId] = targetSlotId;

      if (targetPlayerId) {
          if (oldSlotId) {
              newAssignments[targetPlayerId] = oldSlotId;
          } else {
              delete newAssignments[targetPlayerId];
          }
      }
      return newAssignments;
    });
  }, []);

  const handleRemovePlayer = (playerId: string) => {
      const assignedSlotId = currentAssignments[playerId];
      if (!assignedSlotId) return;

      setSlots(prev => prev.filter(s => s.id !== assignedSlotId));
      setCurrentAssignments(prev => {
          const next = { ...prev };
          delete next[playerId];
          return next;
      });
  };

  const handleSlotMove = (slotId: string, x: number, y: number) => {
    setSlots(prev => prev.map(s => s.id === slotId ? { ...s, x, y } : s));
  };

  const handleBallMove = (x: number, y: number) => {
      setBallPosition({ x, y });
  };
  
  const handleBallRemove = () => {
      setBallPosition(null);
  };

  // --- Arrow Handlers ---
  const handleNewArrowDrop = (x: number, y: number) => {
      const newArrow: PitchArrow = {
          id: `arrow-${Date.now()}`,
          startX: x,
          startY: y,
          endX: Math.min(100, x + 10),
          endY: y
      };
      setArrows(prev => [...prev, newArrow]);
  };

  const handleArrowUpdate = (updatedArrow: PitchArrow) => {
      setArrows(prev => prev.map(a => a.id === updatedArrow.id ? updatedArrow : a));
  };

  const handleArrowRemove = (id: string) => {
      setArrows(prev => prev.filter(a => a.id !== id));
  };

  // --- Zone Handlers ---
  const handleNewZoneDrop = (x: number, y: number) => {
      const newZone: PitchZone = {
          id: `zone-${Date.now()}`,
          x,
          y
      };
      setZones(prev => [...prev, newZone]);
  };

  const handleZoneMove = (id: string, x: number, y: number) => {
      setZones(prev => prev.map(z => z.id === id ? { ...z, x, y } : z));
  };

  const handleZoneRemove = (id: string) => {
      setZones(prev => prev.filter(z => z.id !== id));
  };

  // --- Opponent Handlers ---
  const handleNewOpponentDrop = (x: number, y: number) => {
      const newOpp: PitchOpponent = {
          id: `opp-${Date.now()}`,
          x,
          y
      };
      setOpponents(prev => [...prev, newOpp]);
  };

  const handleOpponentMove = (id: string, x: number, y: number) => {
      setOpponents(prev => prev.map(o => o.id === id ? { ...o, x, y } : o));
  };

  const handleOpponentRemove = (id: string) => {
      setOpponents(prev => prev.filter(o => o.id !== id));
  };

  const handleClearBoardClick = () => {
      setIsClearBoardModalOpen(true);
  };

  const confirmClearBoard = () => {
      setSlots([]);
      setCurrentAssignments({});
      setCurrentRoles({});
      setBallPosition(null);
      setArrows([]);
      setZones([]);
      setOpponents([]);
      setNotes('');
      setPlan('');
      setLoadedRoutineId(null); // Clear loaded routine ID as board is wiped
      setIsClearBoardModalOpen(false);
      showToast('Pitch cleared');
  };

  // --- Routine Management ---
  const handleSaveClick = () => {
      // Logic: If we have a loaded routine, we open modal to Update or Save as New
      if (loadedRoutineId) {
          const routine = savedRoutines.find(r => r.id === loadedRoutineId);
          if (routine) {
            setSaveName(routine.name);
          }
          setIsSaveModalOpen(true);
      } else {
          // If no routine is loaded, we act as creating a new one
          if (savedRoutines.length >= 5) {
              alert("You can only save up to 5 routines. Please delete one to save a new one.");
              return;
          }
          setSaveName('');
          setIsSaveModalOpen(true);
      }
  };

  const handleUpdateRoutine = () => {
      if (!saveName.trim() || !loadedRoutineId) return;

      setSavedRoutines(prev => prev.map(r => {
          if (r.id === loadedRoutineId) {
              return {
                  ...r,
                  name: saveName.trim(),
                  scenario, // Update scenario just in case
                  data: {
                      slots,
                      assignments: currentAssignments,
                      roles: currentRoles,
                      ballPosition,
                      arrows,
                      zones,
                      opponents,
                      notes,
                      plan
                  }
              };
          }
          return r;
      }));

      setIsSaveModalOpen(false);
      showToast(`Routine "${saveName}" updated!`);
  };

  const handleSaveNewRoutine = () => {
      if (!saveName.trim()) return;
      if (savedRoutines.length >= 5) {
          alert("Limit reached. Cannot save as new.");
          return;
      }

      const newRoutine: SavedRoutine = {
          id: `routine-${Date.now()}`,
          name: saveName.trim(),
          scenario, // Capture whether it's offensive or defensive
          data: {
              slots,
              assignments: currentAssignments,
              roles: currentRoles,
              ballPosition,
              arrows,
              zones,
              opponents,
              notes,
              plan
          },
          createdAt: Date.now()
      };

      // Update state immediately
      setSavedRoutines(prev => {
          const updated = [newRoutine, ...prev].slice(0, 5);
          return updated;
      });
      
      setLoadedRoutineId(newRoutine.id); // Set as currently loaded
      setIsSaveModalOpen(false);
      showToast(`Routine "${newRoutine.name}" saved!`);
  };

  const handleLoadRoutine = (routine: SavedRoutine) => {
      // Immediate load without confirmation to ensure smoother UX
      // Update scenario type first
      setScenario(routine.scenario);
      
      // Load data
      const data = routine.data;
      setSlots(data.slots || []);
      setCurrentAssignments(data.assignments || {});
      setCurrentRoles(data.roles || {});
      setBallPosition(data.ballPosition || null);
      setArrows(data.arrows || []);
      setZones(data.zones || []);
      setOpponents(data.opponents || []);
      setNotes(data.notes || '');
      setPlan(data.plan || '');
      
      setLoadedRoutineId(routine.id); // Mark as loaded

      // We also need to update the background scenariosData object so if we switch tabs immediately it's synced
      setScenariosData(prev => ({
          ...prev,
          [routine.scenario]: data
      }));

      showToast(`Loaded "${routine.name}"`);
  };

  const handleDeleteClick = (id: string) => {
      setDeleteRoutineId(id);
  };

  const confirmDeleteRoutine = () => {
      if (deleteRoutineId) {
          setSavedRoutines(prev => prev.filter(r => r.id !== deleteRoutineId));
          if (loadedRoutineId === deleteRoutineId) {
              setLoadedRoutineId(null);
          }
          setDeleteRoutineId(null);
          showToast('Routine deleted');
      }
  };

  // --- Preview Logic ---
  const handlePreview = () => {
      // Construct single routine payload from current board for preview
      const previewRoutine = {
          id: 'preview-temp', 
          name: (loadedRoutineId ? savedRoutines.find(r => r.id === loadedRoutineId)?.name : 'Current Set Piece') || 'Untitled Set Piece',
          scenario: scenario,
          data: {
              slots,
              assignments: currentAssignments,
              roles: currentRoles,
              ballPosition,
              arrows,
              zones,
              opponents,
              notes,
              plan
          }
      };

      const roster = globalPlayers.map(p => ({
          id: p.id,
          name: p.name,
          number: p.number,
          naturalPosition: p.naturalPosition
      }));

      setSharedPayload({
          routines: [previewRoutine], // Array required by shared view
          roster,
          kitColor,
          generatedAt: Date.now()
      });
      setIsSharedMode(true);
  };

  // --- Sharing Logic ---
  const initiateShare = (mode: 'single' | 'all') => {
      setPendingShareMode(mode);
      setIsShareDropdownOpen(false);
      setIsShareWarningOpen(true);
  };

  const confirmShare = () => {
      if (pendingShareMode) {
          generateShareLink(pendingShareMode);
      }
      setIsShareWarningOpen(false);
      setPendingShareMode(null);
  };

  const generateShareLink = (mode: 'single' | 'all') => {
      // 1. Prepare Routines
      let routinesToShare: SavedRoutine[] = [];
      
      if (mode === 'single') {
          // Construct current state as a routine
          routinesToShare = [{
              id: loadedRoutineId || `shared-${Date.now()}`,
              name: (loadedRoutineId ? savedRoutines.find(r => r.id === loadedRoutineId)?.name : 'Current Set Piece') || 'Untitled',
              scenario: scenario,
              data: {
                  slots,
                  assignments: currentAssignments,
                  roles: currentRoles,
                  ballPosition,
                  arrows,
                  zones,
                  opponents,
                  notes,
                  plan
              },
              createdAt: Date.now()
          }];
      } else {
          routinesToShare = savedRoutines;
      }

      if (routinesToShare.length === 0) {
          showToast("Nothing to share");
          return;
      }

      // 2. Prepare Roster Snapshot (Minimal data to reconstruct players)
      const rosterSnapshot = globalPlayers.map(p => ({
          id: p.id,
          name: p.name,
          number: p.number,
          naturalPosition: p.naturalPosition
      }));

      // 3. Construct Payload
      const payload: SharedSetPiecePayload = {
          routines: routinesToShare,
          roster: rosterSnapshot,
          kitColor,
          generatedAt: Date.now()
      };

      // 4. Encode & Copy
      try {
          const json = JSON.stringify(payload);
          const encoded = safeBtoa(json); // Use safe Base64
          if (!encoded) throw new Error("Encoding failed");
          
          const url = `${window.location.origin}${window.location.pathname}?sp_data=${encoded}`;
          
          navigator.clipboard.writeText(url);
          showToast(mode === 'single' ? "Set piece link copied!" : "Playbook link copied!");
      } catch (e) {
          console.error("Failed to generate link", e);
          showToast("Error generating link");
      }
  };

  // Player editing handlers
  const handleUpdatePlayerStatus = (playerId: string, newStatus: string) => {
      setCurrentRoles(prev => ({
          ...prev,
          [playerId]: newStatus
      }));
  };

  // THESE UPDATE GLOBAL STATE via App.tsx
  const handleUpdatePlayerName = (playerId: string, newName: string) => {
    updateGlobalPlayers(prev => prev.map(p => p.id === playerId ? { ...p, name: newName } : p));
  };
  
  const handleUpdatePlayerNumber = (playerId: string, newNumber: number) => {
    updateGlobalPlayers(prev => prev.map(p => p.id === playerId ? { ...p, number: newNumber } : p));
  };
  
  const handleAddPlayer = () => {};

  if (isSharedMode && sharedPayload) {
      return <SetPieceSharedView payload={sharedPayload} onBack={handleBackFromShared} />;
  }

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-200 font-sans p-4 flex flex-col overflow-hidden relative items-center">
      
      {/* Toast Notification */}
      <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[120] bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-xl flex items-center gap-2 transition-all duration-300 pointer-events-none ${toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <Check size={18} />
          <span className="font-bold text-sm">{toast.message}</span>
      </div>

      {/* Share Warning Modal */}
      {isShareWarningOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 text-center flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <AlertTriangle size={24} className="text-yellow-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Public Link Warning</h3>
                    <p className="text-slate-400 text-sm">
                        You are about to create a public link. Anyone with this link will be able to see your set piece routines.
                    </p>
                </div>
                
                <div className="p-4 bg-slate-800/50 border-t border-slate-700 flex gap-3">
                    <button 
                        onClick={() => { setIsShareWarningOpen(false); setPendingShareMode(null); }}
                        className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmShare}
                        className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition-colors shadow-lg"
                    >
                        Confirm & Copy
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteRoutineId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 text-center flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                        <AlertTriangle size={24} className="text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Delete Routine?</h3>
                    <p className="text-slate-400 text-sm">
                        Are you sure you want to delete this routine? This action cannot be undone.
                    </p>
                </div>
                
                <div className="p-4 bg-slate-800/50 border-t border-slate-700 flex gap-3">
                    <button 
                        onClick={() => setDeleteRoutineId(null)}
                        className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmDeleteRoutine}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg transition-colors shadow-lg"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Clear Board Confirmation Modal */}
      {isClearBoardModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 text-center flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                        <AlertTriangle size={24} className="text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Clear Pitch?</h3>
                    <p className="text-slate-400 text-sm">
                        Are you sure you want to remove all players and elements from the pitch? This action cannot be undone.
                    </p>
                </div>
                
                <div className="p-4 bg-slate-800/50 border-t border-slate-700 flex gap-3">
                    <button 
                        onClick={() => setIsClearBoardModalOpen(false)}
                        className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmClearBoard}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg transition-colors shadow-lg"
                    >
                        Clear Pitch
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Save Modal */}
      {isSaveModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
                      <h3 className="font-bold text-white flex items-center gap-2">
                          <Save size={18} className="text-emerald-500"/>
                          {loadedRoutineId ? 'Update Routine' : 'Save Routine'}
                      </h3>
                      <button onClick={() => setIsSaveModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="p-6">
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Routine Name</label>
                      <input 
                          autoFocus
                          type="text" 
                          value={saveName}
                          onChange={(e) => setSaveName(e.target.value)}
                          placeholder="e.g. Near Post Corner, Deep Free Kick"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder:text-slate-600 focus:border-emerald-500 outline-none transition-colors"
                          onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                  if (loadedRoutineId) handleUpdateRoutine();
                                  else handleSaveNewRoutine();
                              }
                          }}
                      />
                  </div>
                  
                  <div className="p-4 bg-slate-800/50 border-t border-slate-700 flex gap-2">
                      <button 
                          onClick={() => setIsSaveModalOpen(false)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold rounded-lg transition-colors"
                      >
                          Cancel
                      </button>
                      
                      {loadedRoutineId ? (
                        <>
                             {/* Save as New Button (Only if space allows) */}
                             <button 
                                onClick={handleSaveNewRoutine}
                                disabled={!saveName.trim() || savedRoutines.length >= 5}
                                className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                                title={savedRoutines.length >= 5 ? "Max 5 routines allowed" : "Save as copy"}
                             >
                                <Plus size={14} /> New
                             </button>
                             
                             {/* Update Button (Primary) */}
                             <button 
                                onClick={handleUpdateRoutine}
                                disabled={!saveName.trim()}
                                className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-colors shadow-lg flex items-center justify-center gap-1"
                             >
                                <RefreshCw size={14} /> Update
                             </button>
                        </>
                      ) : (
                         <button 
                            onClick={handleSaveNewRoutine}
                            disabled={!saveName.trim()}
                            className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-bold rounded-lg transition-colors shadow-lg"
                         >
                            Save
                         </button>
                      )}
                  </div>
              </div>
          </div>
      )}

      <div className="w-full max-w-[1600px] flex flex-col h-full flex-1 min-h-0">
          
          {/* Header */}
          <header className="h-14 bg-slate-900 border-b border-slate-700 flex items-center px-6 justify-between mb-4 rounded-lg shadow-lg shrink-0">
            <div className="flex items-center gap-4">
                <NavMenu onNavigate={onNavigate} currentPage="setpieces" />
                <div className="flex items-center gap-4">
                    <div className="bg-orange-600 p-2 rounded">
                        <Flag size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white leading-none flex items-center gap-2">
                            Set Pieces
                            <span className="text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/30 uppercase tracking-wider">Beta</span>
                        </h1>
                        <span className="text-xs text-slate-400">Dead Ball Specialist</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                 {/* Scenario Dropdown */}
                 <div className="relative group">
                     <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-slate-700 transition-colors">
                        {scenario === 'offensive' ? (
                            <CornerUpRight size={16} className="text-emerald-400" />
                        ) : (
                            <Shield size={16} className="text-blue-400" />
                        )}
                        <select 
                            value={scenario}
                            onChange={(e) => switchScenario(e.target.value as ScenarioType)}
                            className="bg-transparent text-white text-sm font-bold outline-none cursor-pointer appearance-none pr-6 z-10"
                        >
                            <option value="offensive">Offensive set-piece</option>
                            <option value="defensive">Defensive set-piece</option>
                        </select>
                        <ChevronDown size={14} className="text-slate-400 absolute right-3 pointer-events-none" />
                     </div>
                 </div>

                 <div className="h-8 w-[1px] bg-slate-700 mx-2"></div>

                 <div className="flex items-center gap-1.5 bg-slate-800 px-2 py-1.5 rounded border border-slate-700">
                    <Palette size={14} className="text-slate-400 mr-1" />
                    {KIT_COLORS.map((c) => (
                    <button
                        key={c.name}
                        onClick={() => setKitColor(c)}
                        className={`w-4 h-4 rounded-full border border-slate-600 hover:scale-110 transition-transform ${kitColor.name === c.name ? 'ring-2 ring-white scale-110' : ''}`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                    />
                    ))}
                </div>

                <div className="h-8 w-[1px] bg-slate-700 mx-2"></div>
                
                <button 
                    onClick={handleSaveClick}
                    className={`px-3 py-1.5 rounded text-sm font-bold shadow transition-colors flex items-center gap-2 border ${
                        savedRoutines.length >= 5 && !loadedRoutineId
                        ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-75' 
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                    }`}
                    title={savedRoutines.length >= 5 && !loadedRoutineId ? "Max 5 routines allowed" : "Save Routine"}
                >
                    <Save size={16} />
                    <span className="hidden sm:inline">{loadedRoutineId ? 'Update' : 'Save'}</span>
                </button>

                <button 
                    onClick={handlePreview}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-sm font-bold shadow transition-colors flex items-center gap-2 border border-slate-600 ml-2"
                    title="Preview Shared View"
                >
                    <Eye size={16} />
                    <span className="hidden sm:inline">Preview</span>
                </button>

                {/* Share Dropdown */}
                <div className="relative">
                    <button 
                        onClick={() => setIsShareDropdownOpen(!isShareDropdownOpen)}
                        className={`px-3 py-1.5 rounded text-sm font-bold shadow transition-colors flex items-center gap-2 border bg-blue-600 hover:bg-blue-500 text-white border-blue-500 ml-2`}
                    >
                        <Share2 size={16} />
                        <span className="hidden sm:inline">Share</span>
                        <ChevronDown size={14} className={`transition-transform ${isShareDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isShareDropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsShareDropdownOpen(false)}></div>
                            <div className="absolute top-full right-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                <button 
                                    onClick={() => initiateShare('single')}
                                    className="w-full text-left px-4 py-3 text-sm font-medium text-slate-200 hover:bg-slate-700 hover:text-white flex items-center gap-2 border-b border-slate-700/50"
                                >
                                    <LinkIcon size={16} className="text-blue-400" />
                                    Share This Set Piece
                                </button>
                                <button 
                                    onClick={() => initiateShare('all')}
                                    className="w-full text-left px-4 py-3 text-sm font-medium text-slate-200 hover:bg-slate-700 hover:text-white flex items-center gap-2"
                                >
                                    <Copy size={16} className="text-emerald-400" />
                                    Share All Set Pieces
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <button 
                    onClick={handleClearBoardClick}
                    className="bg-slate-800 hover:bg-red-900/50 text-slate-300 hover:text-red-400 px-3 py-1.5 rounded text-sm font-bold shadow transition-colors flex items-center gap-2 border border-slate-700 ml-2"
                    title="Clear Pitch"
                >
                    <Trash2 size={16} />
                </button>
            </div>
          </header>

          {/* Content */}
          <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
            
            {/* Left Pane: Squad List */}
            <section className="flex-grow w-[30%] flex flex-col">
                <div className="bg-slate-800/50 p-2 rounded-t-lg border border-slate-700 border-b-0 flex justify-between items-center shrink-0">
                    <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                        <Users size={16} />
                        Squad List
                    </h2>
                </div>
                <div className="flex-1 overflow-hidden">
                    <SquadList 
                        players={displayPlayers} 
                        slots={slots} 
                        benchSlots={[]} 
                        subCount={0}
                        onPlayerDrop={handlePlayerDrop}
                        onUnassignPlayer={handleRemovePlayer} // Allow drop to unassign
                        onUpdatePlayerName={handleUpdatePlayerName}
                        onUpdatePlayerNumber={handleUpdatePlayerNumber}
                        onUpdatePlayerStatus={handleUpdatePlayerStatus}
                        onAddPlayer={handleAddPlayer}
                        customStatusConfig={SET_PIECE_ROLES} // Pass custom roles
                    />
                    
                    {/* Coach Notes */}
                    <div className="mt-4 bg-slate-800/80 rounded-lg border border-slate-700 flex flex-col overflow-hidden max-h-[300px]">
                        <div className="p-2 bg-slate-800 border-b border-slate-700 flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            <ClipboardEdit size={14} />
                            Coach Notes
                        </div>
                        <textarea 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add specific instructions, signal triggers, or key matchups here..."
                            className="bg-slate-900/50 text-slate-300 text-xs p-3 resize-none outline-none min-h-[100px] flex-grow"
                        />
                    </div>
                </div>
            </section>

            {/* Right Pane: Pitch */}
            <section className="w-[70%] flex flex-col gap-4 overflow-y-auto pr-2">
                 
                 <div className="w-full flex justify-center bg-slate-900/20 rounded-lg p-4 border border-slate-800 shrink-0 relative group">
                     {/* Zoom Controls */}
                     <div className="absolute top-4 right-4 flex flex-col gap-1 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => setPitchSize(prev => Math.min(prev + 50, 900))}
                            className="p-2 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg border border-slate-600 shadow-lg"
                            title="Zoom In"
                        >
                            <ZoomIn size={16} />
                        </button>
                        <button 
                            onClick={() => setPitchSize(prev => Math.max(prev - 50, 300))}
                            className="p-2 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg border border-slate-600 shadow-lg"
                            title="Zoom Out"
                        >
                            <ZoomOut size={16} />
                        </button>
                         <button 
                            onClick={() => setPitchSize(500)}
                            className="px-2 py-1 bg-slate-800 text-[10px] font-bold text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg border border-slate-600 shadow-lg mt-1"
                            title="Reset Zoom"
                        >
                            Reset
                        </button>
                     </div>

                     <div 
                         className="relative transition-all duration-300"
                         style={{ width: `${pitchSize}px`, maxWidth: '100%' }}
                     >
                        {/* Perspective Label */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-slate-400 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-slate-700 shadow-lg">
                            {scenario === 'offensive' ? 'Attacking Goal' : 'Defending Goal'}
                        </div>

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
                            zones={zones}
                            onNewZoneDrop={handleNewZoneDrop}
                            onZoneMove={handleZoneMove}
                            onZoneRemove={handleZoneRemove}
                            opponents={opponents}
                            onNewOpponentDrop={handleNewOpponentDrop}
                            onOpponentMove={handleOpponentMove}
                            onOpponentRemove={handleOpponentRemove}
                            kitColor={kitColor.hex}
                            numberColor={kitColor.text}
                            viewMode={scenario}
                            playerIconStyle="circle" // Use circle icons
                            isSmallMode={true} // Enable smaller 20% icons for Set Pieces
                        />
                        
                        {slots.length === 0 && !ballPosition && arrows.length === 0 && (
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none text-white/20 font-bold text-xl uppercase tracking-widest text-center">
                                Drag Players Here<br/>to Start Routine
                            </div>
                        )}
                     </div>
                 </div>

                 <div className="flex gap-4 items-start justify-center flex-wrap w-full">
                     {/* Saved Routines List - Placed first to ensure visibility */}
                     <div className="w-full max-w-[500px] bg-slate-800/80 border border-slate-700 rounded-lg p-4 order-2 lg:order-1">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span>Saved Routines</span>
                            <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-white">{savedRoutines.length}/5</span>
                            <div className="h-px bg-slate-700 flex-grow"></div>
                        </h3>
                        
                        {savedRoutines.length === 0 ? (
                            <div className="text-center py-6 text-slate-500 text-sm italic bg-slate-900/50 rounded border border-dashed border-slate-700">
                                No saved routines. Set up the board and click Save.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-2">
                                {savedRoutines.map((routine) => (
                                    <div key={routine.id} className={`bg-slate-900 border p-3 rounded-lg flex items-center justify-between group transition-colors ${loadedRoutineId === routine.id ? 'border-emerald-500 bg-slate-800' : 'border-slate-700 hover:border-emerald-500/50'}`}>
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className={`p-2 rounded-md ${routine.scenario === 'offensive' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-blue-900/30 text-blue-400'}`}>
                                                {routine.scenario === 'offensive' ? <CornerUpRight size={14} /> : <Shield size={14} />}
                                            </div>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className={`text-sm font-bold truncate ${loadedRoutineId === routine.id ? 'text-emerald-400' : 'text-slate-200'}`}>{routine.name}</span>
                                                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                                    <Clock size={10} />
                                                    {new Date(routine.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button 
                                                onClick={() => handleLoadRoutine(routine)}
                                                className={`p-1.5 rounded transition-colors ${loadedRoutineId === routine.id ? 'text-emerald-400 bg-emerald-900/30' : 'text-slate-400 hover:text-white hover:bg-emerald-600'}`}
                                                title={loadedRoutineId === routine.id ? "Currently Loaded" : "Show"}
                                            >
                                                <Play size={14} fill={loadedRoutineId === routine.id ? "currentColor" : "none"} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteClick(routine.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/30 rounded transition-colors"
                                                title="Delete Routine"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                     </div>

                     {/* Right Column: Elements + Plan Stack */}
                     <div className="w-full max-w-[500px] flex flex-col gap-4 order-1 lg:order-2">
                         
                        {/* Elements Box */}
                        <div className="w-full bg-slate-800/80 border border-slate-700 rounded-lg p-4 shrink-0">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span>Elements</span>
                                <div className="h-px bg-slate-700 flex-grow"></div>
                            </h3>
                            <div className="flex gap-4 items-center justify-center">
                                {/* Draggable Ball */}
                                <div 
                                    className="bg-slate-900 hover:bg-slate-700 text-slate-300 w-12 h-12 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center justify-center border border-slate-600 cursor-grab active:cursor-grabbing hover:border-emerald-500/50 hover:text-white"
                                    draggable
                                    onDragStart={(e) => e.dataTransfer.setData('type', 'ball')}
                                    title="Ball"
                                >
                                    <span className="text-2xl leading-none drop-shadow-md">⚽</span>
                                </div>

                                {/* Draggable Arrow */}
                                <div 
                                    className="bg-slate-900 hover:bg-slate-700 text-slate-300 w-12 h-12 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center justify-center border border-slate-600 cursor-grab active:cursor-grabbing hover:border-emerald-500/50 hover:text-white"
                                    draggable
                                    onDragStart={(e) => e.dataTransfer.setData('type', 'arrow')}
                                    title="Action Arrow"
                                >
                                    <MoveRight size={24} />
                                </div>

                                {/* Draggable Zone */}
                                <div 
                                    className="bg-slate-900 hover:bg-slate-700 text-slate-300 w-12 h-12 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center justify-center border border-slate-600 cursor-grab active:cursor-grabbing hover:border-emerald-500/50 hover:text-white"
                                    draggable
                                    onDragStart={(e) => e.dataTransfer.setData('type', 'zone')}
                                    title="Target Zone"
                                >
                                    <CircleDashed size={24} className="text-yellow-400" />
                                </div>

                                {/* Draggable Opponent */}
                                <div 
                                    className="bg-slate-900 hover:bg-slate-700 text-slate-300 w-12 h-12 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center justify-center border border-slate-600 cursor-grab active:cursor-grabbing hover:border-emerald-500/50 hover:text-white"
                                    draggable
                                    onDragStart={(e) => e.dataTransfer.setData('type', 'opponent')}
                                    title="Opposition Player"
                                >
                                    <User size={24} className="text-slate-400" />
                                </div>
                            </div>
                        </div>

                        {/* Set Piece Plan Box */}
                        <div className="w-full bg-slate-800/80 border border-slate-700 rounded-lg p-4 shrink-0 flex flex-col">
                             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span>Set Piece Plan</span>
                                <div className="h-px bg-slate-700 flex-grow"></div>
                            </h3>
                            <textarea 
                                value={plan}
                                onChange={(e) => setPlan(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded p-3 text-xs text-slate-200 resize-none outline-none focus:border-emerald-500/50 min-h-[80px]"
                                placeholder="Describe the routine plan here..."
                            />
                        </div>

                     </div>
                 </div>

            </section>

          </div>

      </div>
    </div>
  );
};
