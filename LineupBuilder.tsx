
import React, { useState, useCallback, useEffect } from 'react';
import { SquadList } from './components/SquadList';
import { Pitch } from './components/Pitch';
import { Substitutes } from './components/Substitutes';
import { SharedView } from './components/SharedView';
import { NavMenu } from './components/NavMenu';
import { Player, TacticalSlot } from './types';
import { MOCK_PLAYERS, FORMATIONS_11, FORMATIONS_8, BENCH_SLOTS, STORAGE_KEY } from './constants';
import { LayoutGrid, Users, MessageSquare, Calendar, Edit2, Check, X, Plus, Palette, Layers, ClipboardList, Link as LinkIcon, Eye, Shield, Swords, RotateCcw, ChevronLeft, ChevronDown, AlertTriangle, Share2, Copy } from 'lucide-react';

interface NextMatch {
  opponent: string;
  isHome: boolean;
  date: string;
}

interface KitColor {
  name: string;
  hex: string;
  text: string;
}

interface Gameplan {
  onBall: string;
  offBall: string;
}

// Updated Draft interface to support two states
interface LineupDraft {
  players: Player[]; // Storing a snapshot of players
  formationInPossession: string;
  formationOutPossession: string;
  slotsInPossession: TacticalSlot[];
  slotsOutPossession: TacticalSlot[];
  kitColor: KitColor;
  gameplan: Gameplan;
  subCount: number;
  teamSize: 11 | 8;
}

const KIT_COLORS: KitColor[] = [
  { name: 'Red', hex: '#b91c1c', text: 'white' },       // red-700
  { name: 'Blue', hex: '#1d4ed8', text: 'white' },      // blue-700
  { name: 'White', hex: '#f8fafc', text: '#1e293b' },   // slate-50
  { name: 'Black', hex: '#171717', text: 'white' },     // neutral-900
  { name: 'Yellow', hex: '#facc15', text: '#1e293b' },  // yellow-400
  { name: 'Green', hex: '#15803d', text: 'white' },     // green-700
  { name: 'Orange', hex: '#ea580c', text: 'white' },    // orange-600
  { name: 'Purple', hex: '#7e22ce', text: 'white' },    // purple-700
  { name: 'Sky', hex: '#0ea5e9', text: 'white' },       // sky-500
];

interface LineupBuilderProps {
  onNavigate: (page: 'home' | 'builder' | 'setpieces' | 'articles' | 'minutes' | 'drills') => void;
  globalPlayers: Player[];
  onGlobalPlayersUpdate: (newPlayers: Player[] | ((prev: Player[]) => Player[])) => void;
}

export const LineupBuilder: React.FC<LineupBuilderProps> = ({ 
    onNavigate, 
    globalPlayers: players, // Rename prop to 'players' for internal convenience
    onGlobalPlayersUpdate: setPlayers 
}) => {
  // --- Initialization Logic ---
  const loadSavedState = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Failed to load state", e);
      return null;
    }
  };

  const savedState = loadSavedState();

  const DEFAULT_DRAFTS: LineupDraft[] = [
    { 
      players: MOCK_PLAYERS, 
      formationInPossession: '4-4-2',
      formationOutPossession: '4-4-2',
      slotsInPossession: FORMATIONS_11['4-4-2'], 
      slotsOutPossession: FORMATIONS_11['4-4-2'], 
      kitColor: KIT_COLORS[0], 
      gameplan: { onBall: '', offBall: '' }, 
      subCount: 7,
      teamSize: 11
    },
    { 
      players: MOCK_PLAYERS, 
      formationInPossession: '3-5-2',
      formationOutPossession: '5-3-2', 
      slotsInPossession: FORMATIONS_11['3-5-2'], 
      slotsOutPossession: FORMATIONS_11['3-5-2'], 
      kitColor: KIT_COLORS[0], 
      gameplan: { onBall: '', offBall: '' }, 
      subCount: 7,
      teamSize: 11
    },
    { 
      players: MOCK_PLAYERS, 
      formationInPossession: '4-3-3 DM',
      formationOutPossession: '4-1-4-1',
      slotsInPossession: FORMATIONS_11['4-3-3 DM'], 
      slotsOutPossession: FORMATIONS_11['4-3-3 DM'], 
      kitColor: KIT_COLORS[0], 
      gameplan: { onBall: '', offBall: '' }, 
      subCount: 7,
      teamSize: 11
    }
  ];

  // --- Shared View Logic ---
  const [isSharedMode, setIsSharedMode] = useState(false);
  const [sharedState, setSharedState] = useState<{
      players: Player[];
      slots: TacticalSlot[]; 
      formation: string;
      kitColor: KitColor;
      gameplan: Gameplan;
      nextMatch: NextMatch | null;
      subCount: number;
  } | null>(null);

  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const dataParam = params.get('data');
      if (dataParam) {
          try {
              const decoded = JSON.parse(atob(dataParam));
              setSharedState(decoded);
              setIsSharedMode(true);
          } catch (e) {
              console.error("Failed to parse shared data", e);
          }
      }
  }, []);

  const handleRemix = () => {
      setIsSharedMode(false);
      window.history.pushState({}, '', window.location.pathname);
  };

  // --- Editor State (Initialized from LocalStorage or Defaults) ---
  const [drafts, setDrafts] = useState<LineupDraft[]>(savedState?.drafts || DEFAULT_DRAFTS);
  const [currentDraftIndex, setCurrentDraftIndex] = useState(savedState?.currentDraftIndex || 0);

  // Tactical Phase State
  const [tacticalPhase, setTacticalPhase] = useState<'in_possession' | 'out_possession'>(savedState?.tacticalPhase || 'in_possession');

  // Team Size State
  const [teamSize, setTeamSize] = useState<11 | 8>(savedState?.teamSize || 11);
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);

  // Note: 'players' state is now managed by App.tsx and passed as prop
  
  // Separate states for In/Out
  const [currentFormationInPossession, setCurrentFormationInPossession] = useState<string>(savedState?.currentFormationInPossession || '4-4-2');
  const [currentFormationOutPossession, setCurrentFormationOutPossession] = useState<string>(savedState?.currentFormationOutPossession || '4-4-2');
  
  const [slotsInPossession, setSlotsInPossession] = useState<TacticalSlot[]>(savedState?.slotsInPossession || FORMATIONS_11['4-4-2']);
  const [slotsOutPossession, setSlotsOutPossession] = useState<TacticalSlot[]>(savedState?.slotsOutPossession || FORMATIONS_11['4-4-2']);

  const [kitColor, setKitColor] = useState<KitColor>(savedState?.kitColor || KIT_COLORS[0]);
  const [gameplan, setGameplan] = useState<Gameplan>(savedState?.gameplan || { onBall: '', offBall: '' });
  const [subCount, setSubCount] = useState<number>(savedState?.subCount || 7);
  
  // Next Match State
  const [nextMatch, setNextMatch] = useState<NextMatch | null>(savedState?.nextMatch || null);
  const [isEditingMatch, setIsEditingMatch] = useState(false);
  const [tempMatch, setTempMatch] = useState<NextMatch>({ 
    opponent: '', 
    isHome: true, 
    date: new Date().toISOString().split('T')[0] 
  });
  
  // Notification State
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [copyToastMessage, setCopyToastMessage] = useState('');
  
  // Modal & Dropdown State
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isShareWarningOpen, setIsShareWarningOpen] = useState(false);
  const [isShareDropdownOpen, setIsShareDropdownOpen] = useState(false);

  // Computed Values
  const availableFormations = teamSize === 11 ? FORMATIONS_11 : FORMATIONS_8;

  // Persistence Effect
  useEffect(() => {
    if (isSharedMode) return; // Don't save if viewing a shared link

    // CRITICAL: Retrieve existing data to merge, otherwise we lose Set Pieces data
    const existingData = localStorage.getItem(STORAGE_KEY);
    const parsedData = existingData ? JSON.parse(existingData) : {};

    const stateToSave = {
      ...parsedData, // Merge existing storage (Set Pieces etc)
      drafts,
      currentDraftIndex,
      tacticalPhase,
      players, // Save current players state to storage
      currentFormationInPossession,
      currentFormationOutPossession,
      slotsInPossession,
      slotsOutPossession,
      kitColor,
      gameplan,
      subCount,
      nextMatch,
      teamSize
    };
    
    // Debounce slightly or just save (localStorage is sync and fast enough for this data size)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [
    drafts, currentDraftIndex, tacticalPhase, players, 
    currentFormationInPossession, currentFormationOutPossession, 
    slotsInPossession, slotsOutPossession, kitColor, gameplan, subCount, nextMatch, isSharedMode, teamSize
  ]);

  const handleResetData = () => {
    if (confirm("Are you sure you want to reset all data to defaults? This cannot be undone.")) {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    }
  };

  // Helper to get current active slots
  const activeSlots = tacticalPhase === 'in_possession' ? slotsInPossession : slotsOutPossession;
  const activeFormation = tacticalPhase === 'in_possession' ? currentFormationInPossession : currentFormationOutPossession;

  const handlePreviewSharedView = () => {
    const slotsToShare = activeSlots;
    const formationToShare = activeFormation;

    const data = {
        players,
        slots: slotsToShare,
        formation: formationToShare,
        kitColor,
        gameplan,
        nextMatch,
        subCount
    };
    setSharedState(data);
    setIsSharedMode(true);
  };

  // --- Remapping Logic to prevent disappearing players ---
  const remapPlayers = (currentPlayers: Player[], fromSlots: TacticalSlot[], toSlots: TacticalSlot[]) => {
      const benchPlayers = currentPlayers.filter(p => p.assignedSlot && BENCH_SLOTS.includes(p.assignedSlot));
      const pitchPlayers = currentPlayers.filter(p => p.assignedSlot && !BENCH_SLOTS.includes(p.assignedSlot));
      
      const availableNewSlots = [...toSlots];
      const newAssignments = new Map<string, string | null>();
      const playersToRemap: Player[] = [];

      // 1. Direct ID Match (e.g. GK -> GK)
      pitchPlayers.forEach(p => {
          const matchIndex = availableNewSlots.findIndex(s => s.id === p.assignedSlot);
          if (matchIndex !== -1) {
              newAssignments.set(p.id, p.assignedSlot!);
              availableNewSlots.splice(matchIndex, 1);
          } else {
              playersToRemap.push(p);
          }
      });

      // 2. Spatial Match for remaining players
      const getSlotCoords = (slotId: string | null) => {
          // Try to find in provided 'fromSlots'
          let s = fromSlots.find(slot => slot.id === slotId);
          // Fallback: Check global formation definitions if the player was assigned to a slot not currently visible
          if (!s && slotId) {
             const allFormations = { ...FORMATIONS_11, ...FORMATIONS_8 };
             for (const key in allFormations) {
                 const found = allFormations[key].find(fSlot => fSlot.id === slotId);
                 if (found) {
                     s = found;
                     break;
                 }
             }
          }
          return s || { x: 50, y: 50 };
      };

      // Sort by previous Y (Back to Front) then X
      playersToRemap.sort((a, b) => {
          const posA = getSlotCoords(a.assignedSlot);
          const posB = getSlotCoords(b.assignedSlot);
          return (posB.y - posA.y) || (posA.x - posB.x);
      });

      // Sort available new slots similarly
      availableNewSlots.sort((a, b) => (b.y - a.y) || (a.x - b.x));

      // 3. Assign to nearest available slot or overflow to bench
      const usedBenchSet = new Set(benchPlayers.map(bp => bp.assignedSlot));
      playersToRemap.forEach((p, i) => {
          if (i < availableNewSlots.length) {
              newAssignments.set(p.id, availableNewSlots[i].id);
          } else {
              // Find free bench slot dynamically
              const freeBench = BENCH_SLOTS.find(bs => !usedBenchSet.has(bs));
              if (freeBench) {
                  newAssignments.set(p.id, freeBench);
                  usedBenchSet.add(freeBench);
              } else {
                  newAssignments.set(p.id, null);
              }
          }
      });

      return currentPlayers.map(p => {
           if (newAssignments.has(p.id)) {
               return { ...p, assignedSlot: newAssignments.get(p.id)! };
           }
           return p;
      });
  };

  const handleSizeChange = (newSize: 11 | 8) => {
    if (newSize === teamSize) {
      setIsSizeDropdownOpen(false);
      return;
    }

    const newFormations = newSize === 11 ? FORMATIONS_11 : FORMATIONS_8;
    const defaultFormationName = Object.keys(newFormations)[0];
    const defaultFormationSlots = newFormations[defaultFormationName];

    // Simple remapping: First N players go to pitch, rest to bench
    // This strictly follows the requirement to fill first N spots on player list
    const remappedPlayers = players.map((p, index) => {
        if (index < defaultFormationSlots.length) {
            return { ...p, assignedSlot: defaultFormationSlots[index].id };
        } else {
            // Assign remaining players to consecutive bench slots
            const benchIndex = index - defaultFormationSlots.length;
            const benchSlotId = BENCH_SLOTS[benchIndex] || null;
            return { ...p, assignedSlot: benchSlotId };
        }
    });

    setTeamSize(newSize);
    setPlayers(remappedPlayers);
    
    // Reset both phases to the default formation of the new size
    setCurrentFormationInPossession(defaultFormationName);
    setCurrentFormationOutPossession(defaultFormationName);
    setSlotsInPossession(defaultFormationSlots);
    setSlotsOutPossession(defaultFormationSlots);
    
    setIsSizeDropdownOpen(false);
  };

  const handleSwitchDraft = (newIndex: number) => {
    if (newIndex === currentDraftIndex) return;

    // Save current state to drafts array
    const updatedDrafts = [...drafts];
    updatedDrafts[currentDraftIndex] = {
      players: players,
      formationInPossession: currentFormationInPossession,
      formationOutPossession: currentFormationOutPossession,
      slotsInPossession: slotsInPossession,
      slotsOutPossession: slotsOutPossession,
      kitColor: kitColor,
      gameplan: gameplan,
      subCount: subCount,
      teamSize: teamSize
    };

    // Load new draft
    const targetDraft = updatedDrafts[newIndex];
    
    // Remap Loaded Players:
    const targetPhaseSlots = tacticalPhase === 'in_possession' ? targetDraft.slotsInPossession : targetDraft.slotsOutPossession;
    const allDraftSlots = [...targetDraft.slotsInPossession, ...targetDraft.slotsOutPossession];
    const remappedPlayers = remapPlayers(targetDraft.players, allDraftSlots, targetPhaseSlots);

    setPlayers(remappedPlayers);
    setSlotsInPossession(targetDraft.slotsInPossession);
    setSlotsOutPossession(targetDraft.slotsOutPossession);
    setCurrentFormationInPossession(targetDraft.formationInPossession);
    setCurrentFormationOutPossession(targetDraft.formationOutPossession);
    setKitColor(targetDraft.kitColor);
    setGameplan(targetDraft.gameplan || { onBall: '', offBall: '' });
    setSubCount(targetDraft.subCount || 7);
    setTeamSize(targetDraft.teamSize || 11);

    setDrafts(updatedDrafts);
    setCurrentDraftIndex(newIndex);
  };

  const handleGameplanChange = (type: 'onBall' | 'offBall', value: string) => {
    setGameplan(prev => ({ ...prev, [type]: value }));
  };

  const handlePlayerDrop = useCallback((draggedPlayerId: string, targetSlotId: string) => {
    setPlayers((prevPlayers) => {
      const draggedPlayer = prevPlayers.find(p => p.id === draggedPlayerId);
      if (!draggedPlayer) return prevPlayers;

      const targetPlayer = prevPlayers.find(p => p.assignedSlot === targetSlotId);
      const newPlayers = [...prevPlayers];
      
      if (targetPlayer) {
        const oldSlot = draggedPlayer.assignedSlot;
        const targetPlayerIndex = newPlayers.findIndex(p => p.id === targetPlayer.id);
        newPlayers[targetPlayerIndex] = { ...targetPlayer, assignedSlot: oldSlot };
      }

      const draggedPlayerIndex = newPlayers.findIndex(p => p.id === draggedPlayerId);
      newPlayers[draggedPlayerIndex] = { ...draggedPlayer, assignedSlot: targetSlotId };

      return newPlayers;
    });
  }, []);

  const handleSlotMove = (slotId: string, x: number, y: number) => {
    if (tacticalPhase === 'in_possession') {
      setSlotsInPossession(prev => prev.map(s => s.id === slotId ? { ...s, x, y } : s));
    } else {
      setSlotsOutPossession(prev => prev.map(s => s.id === slotId ? { ...s, x, y } : s));
    }
  };

  const handlePhaseSwitch = (newPhase: 'in_possession' | 'out_possession') => {
      if (newPhase === tacticalPhase) return;
      
      const targetSlots = newPhase === 'in_possession' ? slotsInPossession : slotsOutPossession;
      
      // Remap current players to the new phase's slots
      setPlayers(prev => remapPlayers(prev, activeSlots, targetSlots));
      setTacticalPhase(newPhase);
  };

  const handleFormationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const formationName = e.target.value;
    const newSlots = availableFormations[formationName];
    
    // Update the relevant formation state
    if (tacticalPhase === 'in_possession') {
        setCurrentFormationInPossession(formationName);
        setSlotsInPossession(newSlots);
    } else {
        setCurrentFormationOutPossession(formationName);
        setSlotsOutPossession(newSlots);
    }
    
    // Remap players to fit the new formation
    setPlayers(prev => remapPlayers(prev, activeSlots, newSlots));
  };

  const handleUpdatePlayerName = (playerId: string, newName: string) => {
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, name: newName } : p));
  };

  const handleUpdatePlayerNumber = (playerId: string, newNumber: number) => {
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, number: newNumber } : p));
  };

  const handleUpdatePlayerStatus = (playerId: string, newStatus: string) => {
    setPlayers(prev => prev.map(p => {
        if (p.id === playerId) {
            return { ...p, status: newStatus };
        }
        return p;
    }));
  };

  const handleAddPlayer = (slotId: string) => {
    const maxNumber = players.reduce((max, p) => (p.number > max ? p.number : max), 0);
    const newPlayer: Player = {
        id: `new-${Date.now()}`,
        name: 'New Player',
        number: maxNumber + 1,
        naturalPosition: '?',
        bestRole: '?',
        condition: 100,
        sharpness: 50,
        roleFamiliarity: 5,
        roleAbility: 3,
        status: 'Ready',
        assignedSlot: slotId
    };
    setPlayers(prev => [...prev, newPlayer]);
  };

  const getDaysUntilText = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 0) return `in ${diffDays} days`;
    if (diffDays === -1) return 'Yesterday';
    return `${Math.abs(diffDays)} days ago`;
  };

  const saveNextMatch = () => {
      if (tempMatch.opponent.trim()) {
          setNextMatch(tempMatch);
          setIsEditingMatch(false);
      }
  };

  const confirmShareLineup = () => {
    const minPlayers = players.map(p => ({
        id: p.id,
        name: p.name,
        number: p.number,
        assignedSlot: p.assignedSlot,
        status: p.status,
        naturalPosition: p.naturalPosition
    }));

    const data = {
        players: minPlayers,
        slots: activeSlots, 
        formation: activeFormation,
        kitColor,
        gameplan,
        nextMatch,
        subCount
    };
    
    const json = JSON.stringify(data);
    const encoded = btoa(json);
    const url = `${window.location.origin}${window.location.pathname}?data=${encoded}`;
    
    navigator.clipboard.writeText(url);
    setCopyToastMessage('Public lineup link copied to clipboard!');
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 3000);
    setIsShareWarningOpen(false);
  };

  const handleShareBuilder = () => {
    const url = `${window.location.origin}${window.location.pathname}`;
    navigator.clipboard.writeText(url);
    setCopyToastMessage('Builder link copied to clipboard!');
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 3000);
  };

  // --- RENDER SHARED VIEW ---
  if (isSharedMode && sharedState) {
      return (
          <SharedView 
              players={sharedState.players} 
              slots={sharedState.slots} 
              formation={sharedState.formation}
              kitColor={sharedState.kitColor}
              gameplan={sharedState.gameplan}
              nextMatch={sharedState.nextMatch}
              subCount={sharedState.subCount}
              onRemix={handleRemix}
          />
      );
  }

  // --- RENDER EDITOR ---
  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-200 font-sans p-4 flex flex-col overflow-hidden relative items-center">
      
      {/* Toast Notification - Copy */}
      <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[110] bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-xl flex items-center gap-2 transition-all duration-300 ${showCopyToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'}`}>
          <Check size={18} />
          <span className="font-bold text-sm">{copyToastMessage}</span>
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
                        You are about to create a public link. Anyone with this link will be able to see your lineup and tactics.
                    </p>
                </div>
                
                <div className="p-4 bg-slate-800/50 border-t border-slate-700 flex gap-3">
                    <button 
                        onClick={() => setIsShareWarningOpen(false)}
                        className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmShareLineup}
                        className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition-colors shadow-lg"
                    >
                        Confirm & Copy
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Feedback Modal */}
      {isFeedbackOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <MessageSquare size={18} className="text-emerald-500"/>
                        Feedback
                    </h3>
                    <button onClick={() => setIsFeedbackOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-8 text-center flex flex-col items-center gap-4">
                    <p className="text-slate-300 text-lg font-medium">Have you found an issue or got an idea?</p>
                    <p className="text-slate-400">Send us a mail at</p>
                    <a href="mailto:jeppe@tapticsapp.com" className="text-emerald-400 hover:text-emerald-300 font-bold text-xl transition-colors">
                        jeppe@tapticsapp.com
                    </a>
                </div>
                
                <div className="p-4 bg-slate-800/50 border-t border-slate-700 flex justify-center">
                    <button 
                        onClick={() => setIsFeedbackOpen(false)}
                        className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}

      <div className="w-full max-w-[1600px] flex flex-col h-full flex-1 min-h-0">
          {/* Top Bar */}
          <header className="h-14 bg-slate-900 border-b border-slate-700 flex items-center px-6 justify-between mb-4 rounded-lg shadow-lg shrink-0">
            <div className="flex items-center gap-4">
                <NavMenu onNavigate={onNavigate} currentPage="builder" />
                <div className="flex items-center gap-4">
                    <div className="bg-red-700 p-2 rounded">
                        <LayoutGrid size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white leading-none flex items-center gap-2">
                            Taptics
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 uppercase tracking-wider">Beta</span>
                        </h1>
                        <span className="text-xs text-slate-400">Squad Management</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
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
                
                {/* Team Size Dropdown - Replaces Reset Button */}
                <div className="relative mr-2">
                    <button 
                        onClick={() => setIsSizeDropdownOpen(!isSizeDropdownOpen)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded text-sm font-bold shadow transition-colors flex items-center gap-2 border border-slate-700 min-w-[90px] justify-between"
                        title="Change Team Size"
                    >
                        <span>{teamSize} v {teamSize}</span>
                        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isSizeDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isSizeDropdownOpen && (
                        <div className="absolute top-full mt-1 right-0 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 w-full overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                            <button 
                                onClick={() => handleSizeChange(11)}
                                className={`w-full text-left px-3 py-2 text-sm font-medium hover:bg-slate-700 transition-colors ${teamSize === 11 ? 'text-emerald-400 bg-slate-700/50' : 'text-slate-300'}`}
                            >
                                11 v 11
                            </button>
                            <button 
                                onClick={() => handleSizeChange(8)}
                                className={`w-full text-left px-3 py-2 text-sm font-medium hover:bg-slate-700 transition-colors ${teamSize === 8 ? 'text-emerald-400 bg-slate-700/50' : 'text-slate-300'}`}
                            >
                                8 v 8
                            </button>
                        </div>
                    )}
                </div>

                <button 
                    onClick={() => setIsFeedbackOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded text-sm font-bold shadow-lg transition-colors flex items-center gap-2"
                >
                    <MessageSquare size={16} />
                    Feedback
                </button>

                <button 
                    onClick={handlePreviewSharedView}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-sm font-bold shadow-lg transition-colors flex items-center gap-2 ml-2 border border-slate-600"
                    title="Preview what the shared link looks like"
                >
                    <Eye size={16} />
                    Preview
                </button>

                {/* Share Dropdown */}
                <div className="relative ml-2">
                    <button 
                        onClick={() => setIsShareDropdownOpen(!isShareDropdownOpen)}
                        className={`bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-sm font-bold shadow-lg transition-colors flex items-center gap-2 ${isShareDropdownOpen ? 'ring-2 ring-white' : ''}`}
                    >
                        <Share2 size={16} />
                        Share
                        <ChevronDown size={14} className={`transition-transform ${isShareDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isShareDropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsShareDropdownOpen(false)}></div>
                            <div className="absolute top-full right-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                <button 
                                    onClick={() => {
                                        setIsShareDropdownOpen(false);
                                        setIsShareWarningOpen(true);
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm font-medium text-slate-200 hover:bg-slate-700 hover:text-white flex items-center gap-2 border-b border-slate-700/50"
                                >
                                    <LinkIcon size={16} className="text-blue-400" />
                                    Share Lineup
                                </button>
                                <button 
                                    onClick={() => {
                                        setIsShareDropdownOpen(false);
                                        handleShareBuilder();
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm font-medium text-slate-200 hover:bg-slate-700 hover:text-white flex items-center gap-2"
                                >
                                    <Copy size={16} className="text-emerald-400" />
                                    Share Builder
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
          </header>

          {/* Main Content Area */}
          <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
            
            {/* Left Pane: Squad List */}
            <section className="flex-grow w-[48%] flex flex-col">
            <div className="bg-slate-800/50 p-2 rounded-t-lg border border-slate-700 border-b-0 flex justify-between items-center shrink-0">
                <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                    <Users size={16} />
                    Selection Info
                </h2>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-semibold">Subs:</span>
                    <select 
                        value={subCount}
                        onChange={(e) => setSubCount(Number(e.target.value))}
                        className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded px-1.5 py-0.5 outline-none focus:border-emerald-500 cursor-pointer hover:bg-slate-800"
                    >
                        {[3, 5, 7, 9, 12, 15, 20].map(num => (
                            <option key={num} value={num}>{num}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="flex-1 overflow-hidden">
                {/* Note: We pass activeSlots so the list knows which rows to render for current view */}
                <SquadList 
                    players={players} 
                    slots={activeSlots} 
                    benchSlots={BENCH_SLOTS}
                    subCount={subCount}
                    onPlayerDrop={handlePlayerDrop}
                    onUpdatePlayerName={handleUpdatePlayerName}
                    onUpdatePlayerNumber={handleUpdatePlayerNumber}
                    onUpdatePlayerStatus={handleUpdatePlayerStatus}
                    onAddPlayer={handleAddPlayer}
                />
            </div>
            </section>

            {/* Right Pane: Pitch & Subs */}
            <section className="w-[52%] flex gap-2">
            
            <div className="flex-grow flex flex-col gap-2 overflow-y-auto pr-1">
                {/* Tactical Phase Toggle */}
                <div className="flex items-center justify-between bg-slate-800/50 p-1 rounded-lg border border-slate-700 shrink-0 mb-1">
                    <button
                        onClick={() => handlePhaseSwitch('in_possession')}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                            tacticalPhase === 'in_possession' 
                            ? 'bg-emerald-600 text-white shadow' 
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                        }`}
                    >
                        <Swords size={14} />
                        In Possession
                    </button>
                    <div className="w-[1px] h-6 bg-slate-700 mx-1"></div>
                    <button
                        onClick={() => handlePhaseSwitch('out_possession')}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                            tacticalPhase === 'out_possession' 
                            ? 'bg-blue-600 text-white shadow' 
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                        }`}
                    >
                        <Shield size={14} />
                        Out of Possession
                    </button>
                </div>

                {/* Formation & Match Header */}
                <div className="bg-slate-800/80 border border-slate-700 rounded p-2 flex items-center justify-between min-h-[3rem] shrink-0">
                    {/* Formation Select for CURRENT phase */}
                    <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded border border-slate-600 text-sm">
                        <span className={`w-2 h-2 rounded-full ${tacticalPhase === 'in_possession' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                        <select 
                            value={activeFormation}
                            onChange={handleFormationChange}
                            className="bg-transparent border-none text-slate-200 text-sm font-semibold focus:ring-0 cursor-pointer outline-none"
                        >
                            {Object.keys(availableFormations).map(fmt => (
                                <option key={fmt} value={fmt} className="bg-slate-800">{fmt}</option>
                            ))}
                        </select>
                    </div>

                    {!isEditingMatch && !nextMatch ? (
                        <button 
                            onClick={() => setIsEditingMatch(true)}
                            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white px-2 py-1 transition-colors"
                        >
                            <Plus size={16} />
                            <span>Opponent</span>
                        </button>
                    ) : isEditingMatch ? (
                        <div className="flex items-center gap-2 w-full ml-2">
                            <input 
                                type="text" 
                                placeholder="Opponent" 
                                className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:border-emerald-500 outline-none flex-grow w-24"
                                value={tempMatch.opponent}
                                onChange={(e) => setTempMatch({...tempMatch, opponent: e.target.value})}
                                autoFocus
                            />
                            <div className="flex bg-slate-900 rounded border border-slate-600 overflow-hidden shrink-0">
                                <button 
                                    className={`px-2 py-1 text-xs font-bold ${tempMatch.isHome ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                                    onClick={() => setTempMatch({...tempMatch, isHome: true})}
                                >
                                    H
                                </button>
                                <button 
                                    className={`px-2 py-1 text-xs font-bold ${!tempMatch.isHome ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                                    onClick={() => setTempMatch({...tempMatch, isHome: false})}
                                >
                                    A
                                </button>
                            </div>
                            <input 
                                type="date"
                                className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:border-emerald-500 outline-none w-28"
                                value={tempMatch.date}
                                onChange={(e) => setTempMatch({...tempMatch, date: e.target.value})}
                            />
                            <button onClick={saveNextMatch} className="p-1 hover:bg-emerald-600/20 text-emerald-500 rounded">
                                <Check size={16} />
                            </button>
                            <button onClick={() => setIsEditingMatch(false)} className="p-1 hover:bg-red-600/20 text-red-500 rounded">
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-end flex-grow px-2 gap-2">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm">
                                    {nextMatch?.opponent} <span className="text-slate-400 text-xs ml-0.5">({nextMatch?.isHome ? 'H' : 'A'})</span>
                                </span>
                                <span className="text-[10px] text-slate-400 bg-slate-900/50 px-1.5 py-0.5 rounded border border-slate-700">
                                    {nextMatch && getDaysUntilText(nextMatch.date)}
                                </span>
                            </div>
                            <button onClick={() => { setTempMatch(nextMatch!); setIsEditingMatch(true); }} className="p-1 text-slate-500 hover:text-white transition-colors">
                                <Edit2 size={14} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Pitch Visualization Area */}
                <div className="relative w-full bg-slate-900/20 rounded-lg shrink-0 flex justify-center p-2">
                    <div className="w-full max-w-[450px] mx-auto">
                        <Pitch 
                            slots={activeSlots} 
                            players={players} 
                            onPlayerDrop={handlePlayerDrop}
                            onSlotMove={handleSlotMove}
                            kitColor={kitColor.hex} 
                            numberColor={kitColor.text}
                        />
                    </div>
                </div>
                
                {/* Draft Selection Tabs */}
                <div className="flex bg-slate-800 rounded-lg p-1 gap-1.5 border border-slate-700 shrink-0">
                    {drafts.map((draft, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSwitchDraft(idx)}
                            className={`flex-1 py-1.5 px-3 rounded-md transition-all flex items-center justify-center gap-3 ${
                                currentDraftIndex === idx 
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-700/50'
                            }`}
                        >
                            <Layers size={16} className={currentDraftIndex === idx ? 'text-emerald-100' : 'text-slate-500'} />
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-[10px] font-bold tracking-widest uppercase mb-0.5 opacity-90">Draft {idx + 1}</span>
                                <span className={`text-xs font-medium ${currentDraftIndex === idx ? 'text-emerald-50' : 'text-slate-500'}`}>
                                    {/* Show primary formation */}
                                    {draft.formationInPossession}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Gameplan Section */}
                <div className="bg-slate-800 p-3 rounded border border-slate-700 shadow-md shrink-0 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        <ClipboardList size={14} />
                        <span>Gameplan</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-slate-400 font-semibold pl-1">On the ball</label>
                            <textarea 
                                className="bg-slate-900/50 border border-slate-700 rounded p-2 text-xs text-slate-200 resize-none h-20 focus:outline-none focus:border-emerald-500 focus:bg-slate-900 transition-all placeholder:text-slate-600"
                                placeholder="Possession instructions..."
                                value={gameplan.onBall}
                                onChange={(e) => handleGameplanChange('onBall', e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-slate-400 font-semibold pl-1">Off the ball</label>
                            <textarea 
                                className="bg-slate-900/50 border border-slate-700 rounded p-2 text-xs text-slate-200 resize-none h-20 focus:outline-none focus:border-emerald-500 focus:bg-slate-900 transition-all placeholder:text-slate-600"
                                placeholder="Defensive shape instructions..."
                                value={gameplan.offBall}
                                onChange={(e) => handleGameplanChange('offBall', e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Sub Sidebar */}
            <div className="w-20 flex-shrink-0 flex flex-col h-full">
                <Substitutes 
                    benchSlots={BENCH_SLOTS} 
                    players={players} 
                    onPlayerDrop={handlePlayerDrop}
                    kitColor={kitColor.hex}
                    numberColor={kitColor.text}
                    subCount={subCount}
                />
            </div>

            </section>
          </div>
      </div>
    </div>
  );
}
