import React, { useState, useCallback, useEffect, useRef } from 'react';
import { NavMenu } from './NavMenu';
import { SquadList } from './SquadList';
import { Pitch, PitchArrow, PitchGoal, PitchSmallGoal, PitchCone, PitchMannequin, PitchGate, PitchPole, PitchLadder, PitchPlacedPlayer, PitchBall } from './Pitch';
import { Player, TacticalSlot } from '../types';
import { STORAGE_KEY } from '../constants';
import { useAuth } from '../supabaseAuth';
import { fetchDrillsForUser, saveDrillsForUser } from '../supabaseDrills';
import { Target, Users, Palette, ChevronDown, ZoomIn, ZoomOut, MoveRight, Square, LayoutGrid, Triangle, CircleDot, Columns, Minus, ListOrdered, Undo2, Send, User, Save, X, Trash2, Eye, Share2 } from 'lucide-react';

// Unicode-safe Base64 encoding (mirrors SetPieces safeBtoa)
const safeBtoa = (str: string) => {
  try {
    return btoa(
      encodeURIComponent(str).replace(
        /%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) { // eslint-disable-line @typescript-eslint/no-unused-vars
          return String.fromCharCode(parseInt(p1, 16));
        },
      ),
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Encoding error', e);
    return '';
  }
};

// Unicode-safe Base64 decoding (mirrors SetPieces safeAtob)
const safeAtob = (str: string) => {
  try {
    return decodeURIComponent(
      atob(str)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Decoding error', e);
    return '';
  }
};

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
  balls: PitchBall[];
  arrows: PitchArrow[];
  goals: PitchGoal[];
  smallGoals: PitchSmallGoal[];
  cones: PitchCone[];
  mannequins: PitchMannequin[];
  gates: PitchGate[];
  poles: PitchPole[];
  ladders: PitchLadder[];
  placedPlayers: PitchPlacedPlayer[];
  description: string;
};

interface SavedDrill {
  id: string;
  name: string;
  createdAt: number;
  snapshot: DrillsSnapshot;
  kitColor?: KitColor; // optional for backwards compatibility with existing saved drills
}

interface TrainingSession {
  id: string;
  name: string;
  createdAt: number;
  drills: { drillId: string; minutes: number }[];
}

interface SharedSessionDrillPayload {
  id: string;
  name: string;
  minutes: number;
  snapshot: DrillsSnapshot;
  kitColor: KitColor;
}

interface SharedTrainingSessionPayload {
  id: string;
  name: string;
  createdAt: number;
  totalMinutes: number;
  drills: SharedSessionDrillPayload[];
}

export const Drills: React.FC<DrillsProps> = ({ onNavigate, players: globalPlayers, setPlayers: updateGlobalPlayers }) => {
  const { user } = useAuth();
  const appliedRemoteDrillsRef = useRef<string | null>(null);
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

  // --- Shared Training Session View (public links) ---
  const [isSharedMode, setIsSharedMode] = useState(false);
  const [sharedPayload, setSharedPayload] = useState<SharedTrainingSessionPayload | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dataParam = params.get('ts_data');
    if (dataParam) {
      try {
        const jsonString = safeAtob(dataParam);
        if (jsonString) {
          const decoded = JSON.parse(jsonString) as SharedTrainingSessionPayload;
          setSharedPayload(decoded);
          setIsSharedMode(true);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to parse shared training session data', e);
      }
    }
  }, []);

  const handleBackFromShared = () => {
    setIsSharedMode(false);
    window.history.pushState({}, '', window.location.pathname);
  };

  const [viewMode, setViewMode] = useState<DrillViewMode>(saved?.viewMode ?? 'full');
  const [slots, setSlots] = useState<TacticalSlot[]>(saved?.slots ?? []);
  const [currentAssignments, setCurrentAssignments] = useState<Record<string, string>>(saved?.assignments ?? {});
  const initialBalls: PitchBall[] = saved?.balls
    ?? (saved?.ballPosition
      ? [{ id: `ball-${Date.now()}`, x: saved.ballPosition.x, y: saved.ballPosition.y, size: (saved.ballPosition as any).size }]
      : []);
  const [balls, setBalls] = useState<PitchBall[]>(initialBalls);
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
  const [description, setDescription] = useState<string>(saved?.description ?? '');
  const [savedDrills, setSavedDrills] = useState<SavedDrill[]>(
    Array.isArray(saved?.savedDrills) ? saved.savedDrills : [],
  );
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isClearPitchModalOpen, setIsClearPitchModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [drillView, setDrillView] = useState<'design' | 'bank' | 'sessions'>('design');
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>(
    Array.isArray(saved?.trainingSessions) ? saved.trainingSessions : [],
  );
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [previewDrill, setPreviewDrill] = useState<SavedDrill | null>(null);
  const [previewSession, setPreviewSession] = useState<SharedTrainingSessionPayload | null>(null);

  useEffect(() => {
    if (!activeSessionId && trainingSessions.length > 0) {
      setActiveSessionId(trainingSessions[0].id);
    }
  }, [trainingSessions, activeSessionId]);

  const buildSharedSessionPayload = (sessionId: string): SharedTrainingSessionPayload | null => {
    const session = trainingSessions.find((s) => s.id === sessionId);
    if (!session) return null;
    if (session.drills.length === 0) return null;

    const drillsPayload: SharedSessionDrillPayload[] = session.drills
      .map((d) => {
        const drill = savedDrills.find((sd) => sd.id === d.drillId);
        if (!drill) return null;
        return {
          id: drill.id,
          name: drill.name,
          minutes: d.minutes,
          snapshot: drill.snapshot,
          kitColor: getDrillKitColor(drill),
        };
      })
      .filter((d): d is SharedSessionDrillPayload => d !== null);

    if (drillsPayload.length === 0) return null;

    const totalMinutes = drillsPayload.reduce((sum, d) => sum + (d.minutes || 0), 0);

    return {
      id: session.id,
      name: session.name,
      createdAt: session.createdAt,
      totalMinutes,
      drills: drillsPayload,
    };
  };

  const handleShareSession = (sessionId: string) => {
    const payload = buildSharedSessionPayload(sessionId);
    if (!payload) {
      window.alert('Nothing to share in this session yet.');
      return;
    }

    try {
      const json = JSON.stringify(payload);
      const encoded = safeBtoa(json);
      if (!encoded) throw new Error('Encoding failed');

      const url = `${window.location.origin}${window.location.pathname}?ts_data=${encoded}`;
      navigator.clipboard.writeText(url);
      window.alert('Training session link copied to clipboard!');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to generate training session link', e);
      window.alert('Error generating training session link.');
    }
  };

  const handlePreviewSession = (sessionId: string) => {
    const payload = buildSharedSessionPayload(sessionId);
    if (!payload) {
      window.alert('Nothing to preview in this session yet.');
      return;
    }
    setPreviewSession(payload);
  };

  // Load drills from Supabase once per user session
  useEffect(() => {
    if (!user?.id) return;
    if (appliedRemoteDrillsRef.current === user.id) return;

    let cancelled = false;
    (async () => {
      const payload = await fetchDrillsForUser(user.id);
      if (cancelled || !payload) return;

      appliedRemoteDrillsRef.current = user.id;

      setViewMode((payload.viewMode as DrillViewMode) ?? 'full');
      setSlots(payload.slots ?? []);
      setCurrentAssignments(payload.assignments ?? {});
      setBalls(payload.balls ?? []);
      setArrows(payload.arrows ?? []);
      setGoals(payload.goals ?? []);
      setSmallGoals(payload.smallGoals ?? []);
      setCones(payload.cones ?? []);
      setMannequins(payload.mannequins ?? []);
      setGates(payload.gates ?? []);
      setPoles(payload.poles ?? []);
      setLadders(payload.ladders ?? []);
      setPlacedPlayers(payload.placedPlayers ?? []);
      setDescription(payload.description ?? '');
      setSavedDrills(Array.isArray(payload.savedDrills) ? payload.savedDrills as SavedDrill[] : []);
      setTrainingSessions(Array.isArray(payload.trainingSessions) ? payload.trainingSessions as TrainingSession[] : []);
      if (payload.kitColor) {
        const match = KIT_COLORS.find(k => k.hex === payload.kitColor.hex) ?? KIT_COLORS[0];
        setKitColor(match);
      }

      try {
        const existing = localStorage.getItem(STORAGE_KEY);
        const parsed = existing ? JSON.parse(existing) : {};
        parsed.drillsData = payload;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      } catch (e) {
        console.error('Failed to cache drills locally from Supabase', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const takeSnapshot = useCallback((): DrillsSnapshot => ({
    viewMode, slots: slots.map(s => ({ ...s })), assignments: { ...currentAssignments },
    balls: balls.map(b => ({ ...b })),
    arrows: arrows.map(a => ({ ...a })), goals: goals.map(g => ({ ...g })), smallGoals: smallGoals.map(sg => ({ ...sg })),
    cones: cones.map(c => ({ ...c })), mannequins: mannequins.map(m => ({ ...m })), gates: gates.map(g => ({ ...g })),
    poles: poles.map(p => ({ ...p })), ladders: ladders.map(l => ({ ...l })), placedPlayers: placedPlayers.map(p => ({ ...p })),
    description,
  }), [viewMode, slots, currentAssignments, balls, arrows, goals, smallGoals, cones, mannequins, gates, poles, ladders, placedPlayers, description]);

  const pushHistory = useCallback(() => {
    setHistory(prev => [...prev.slice(1 - MAX_UNDO), takeSnapshot()]);
  }, [takeSnapshot]);

  const SIZE_STEP = 0.15;
  const MIN_SIZE = 0.5;
  const MAX_SIZE = 2;
  useEffect(() => {
    if (!selectedElement) return;
    const handleKey = (e: KeyboardEvent) => {
      if (
        e.key !== 'ArrowUp' &&
        e.key !== 'ArrowDown' &&
        e.key !== 'ArrowLeft' &&
        e.key !== 'ArrowRight'
      ) {
        return;
      }
      e.preventDefault();

      // Resize with Up/Down
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const delta = e.key === 'ArrowUp' ? SIZE_STEP : -SIZE_STEP;
        const clamp = (v: number) => Math.max(MIN_SIZE, Math.min(MAX_SIZE, v));
        if (selectedElement.type === 'ball' && selectedElement.id) {
          pushHistory();
          setBalls(prev => prev.map(b => b.id === selectedElement.id ? { ...b, size: clamp((b.size ?? 1) + delta) } : b));
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
        return;
      }

      // Rotate with Left/Right for goals, small goals, gates and ladders
      const angleDelta = e.key === 'ArrowRight' ? 45 : -45;
      const normalize = (angle: number | undefined) => {
        const base = typeof angle === 'number' ? angle : 0;
        return ((base + angleDelta) % 360 + 360) % 360;
      };

      if (selectedElement.type === 'goal' && selectedElement.id) {
        pushHistory();
        setGoals(prev => prev.map(g => g.id === selectedElement.id ? { ...g, rotation: normalize(g.rotation) } : g));
      } else if (selectedElement.type === 'smallGoal' && selectedElement.id) {
        pushHistory();
        setSmallGoals(prev => prev.map(sg => sg.id === selectedElement.id ? { ...sg, rotation: normalize(sg.rotation) } : sg));
      } else if (selectedElement.type === 'gate' && selectedElement.id) {
        pushHistory();
        setGates(prev => prev.map(g => g.id === selectedElement.id ? { ...g, rotation: normalize(g.rotation) } : g));
      } else if (selectedElement.type === 'ladder' && selectedElement.id) {
        pushHistory();
        setLadders(prev => prev.map(l => l.id === selectedElement.id ? { ...l, rotation: normalize(l.rotation) } : l));
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
    setBalls(s.balls);
    setArrows(s.arrows);
    setGoals(s.goals);
    setSmallGoals(s.smallGoals);
    setCones(s.cones);
    setMannequins(s.mannequins);
    setGates(s.gates);
    setPoles(s.poles);
    setLadders(s.ladders);
    setPlacedPlayers(s.placedPlayers);
    setDescription(s.description);
    setHistory(prev => prev.slice(0, -1));
  }, [history.length]);

  const handleConfirmSaveDrill = () => {
    const name = saveName.trim();
    if (!name) return;
    const snapshot = takeSnapshot();
    const newDrill: SavedDrill = {
      id: `drill-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name,
      createdAt: Date.now(),
      snapshot,
      kitColor,
    };
    setSavedDrills(prev => [...prev, newDrill]);
    setIsSaveModalOpen(false);
  };

  const loadDrillIntoDesign = (drill: SavedDrill) => {
    const s = drill.snapshot;
    setViewMode(s.viewMode);
    setSlots(s.slots);
    setCurrentAssignments(s.assignments);
    setBalls(s.balls);
    setArrows(s.arrows);
    setGoals(s.goals);
    setSmallGoals(s.smallGoals);
    setCones(s.cones);
    setMannequins(s.mannequins);
    setGates(s.gates);
    setPoles(s.poles);
    setLadders(s.ladders);
    setPlacedPlayers(s.placedPlayers);
    setDescription(s.description);
    setKitColor(drill.kitColor ?? KIT_COLORS[0]);
    setDrillView('design');
  };

  const displayPlayers = globalPlayers.map(p => ({
    ...p,
    assignedSlot: currentAssignments[p.id] || null,
  }));

  useEffect(() => {
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      const parsed = existing ? JSON.parse(existing) : {};
      const drillsPayload = {
        viewMode,
        slots,
        assignments: currentAssignments,
        balls,
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
        description,
        savedDrills,
        trainingSessions,
      };
      parsed.drillsData = drillsPayload;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));

      if (user?.id) {
        saveDrillsForUser(user.id, drillsPayload as any).catch(err =>
          console.error('[Supabase] Drills save failed:', err?.message ?? err),
        );
      }
    } catch (e) {
      console.error('Failed to save drills', e);
    }
  }, [viewMode, slots, currentAssignments, balls, arrows, goals, smallGoals, cones, mannequins, gates, poles, ladders, placedPlayers, playerToolColor, kitColor, description, savedDrills, trainingSessions, user?.id]);

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

  const handleBallMoveById = (id: string, x: number, y: number) => {
    pushHistory();
    setBalls(prev => prev.map(b => b.id === id ? { ...b, x, y } : b));
  };
  const handleBallRemoveById = (id: string) => {
    pushHistory();
    setBalls(prev => prev.filter(b => b.id !== id));
  };

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

  const handleNewGoalDrop = (x: number, y: number) => {
    pushHistory();
    const id = `goal-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setGoals(prev => [...prev, { id, x, y }]);
    setSelectedElement({ type: 'goal', id });
  };
  const handleGoalMove = (id: string, x: number, y: number) => { pushHistory(); setGoals(prev => prev.map(g => g.id === id ? { ...g, x, y } : g)); };
  const handleGoalRemove = (id: string) => { pushHistory(); setGoals(prev => prev.filter(g => g.id !== id)); };

  const handleNewSmallGoalDrop = (x: number, y: number) => {
    pushHistory();
    const id = `smallGoal-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setSmallGoals(prev => [...prev, { id, x, y }]);
    setSelectedElement({ type: 'smallGoal', id });
  };
  const handleSmallGoalMove = (id: string, x: number, y: number) => { pushHistory(); setSmallGoals(prev => prev.map(sg => sg.id === id ? { ...sg, x, y } : sg)); };
  const handleSmallGoalRemove = (id: string) => { pushHistory(); setSmallGoals(prev => prev.filter(sg => sg.id !== id)); };

  const handleNewConeDrop = (x: number, y: number) => { pushHistory(); setCones(prev => [...prev, { id: `cone-${Date.now()}`, x, y }]); };
  const handleConeMove = (id: string, x: number, y: number) => { pushHistory(); setCones(prev => prev.map(c => c.id === id ? { ...c, x, y } : c)); };
  const handleConeRemove = (id: string) => { pushHistory(); setCones(prev => prev.filter(c => c.id !== id)); };

  const handleNewMannequinDrop = (x: number, y: number) => { pushHistory(); setMannequins(prev => [...prev, { id: `mannequin-${Date.now()}`, x, y }]); };
  const handleMannequinMove = (id: string, x: number, y: number) => { pushHistory(); setMannequins(prev => prev.map(m => m.id === id ? { ...m, x, y } : m)); };
  const handleMannequinRemove = (id: string) => { pushHistory(); setMannequins(prev => prev.filter(m => m.id !== id)); };

  const handleNewGateDrop = (x: number, y: number) => {
    pushHistory();
    const id = `gate-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setGates(prev => [...prev, { id, x, y }]);
    setSelectedElement({ type: 'gate', id });
  };
  const handleGateMove = (id: string, x: number, y: number) => { pushHistory(); setGates(prev => prev.map(g => g.id === id ? { ...g, x, y } : g)); };
  const handleGateRemove = (id: string) => { pushHistory(); setGates(prev => prev.filter(g => g.id !== id)); };

  const handleNewPoleDrop = (x: number, y: number) => { pushHistory(); setPoles(prev => [...prev, { id: `pole-${Date.now()}`, x, y }]); };
  const handlePoleMove = (id: string, x: number, y: number) => { pushHistory(); setPoles(prev => prev.map(p => p.id === id ? { ...p, x, y } : p)); };
  const handlePoleRemove = (id: string) => { pushHistory(); setPoles(prev => prev.filter(p => p.id !== id)); };

  const handleNewLadderDrop = (x: number, y: number) => {
    pushHistory();
    const id = `ladder-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setLadders(prev => [...prev, { id, x, y }]);
    setSelectedElement({ type: 'ladder', id });
  };
  const handleLadderMove = (id: string, x: number, y: number) => { pushHistory(); setLadders(prev => prev.map(l => l.id === id ? { ...l, x, y } : l)); };
  const handleLadderRemove = (id: string) => { pushHistory(); setLadders(prev => prev.filter(l => l.id !== id)); };

  const handleElementPlace = useCallback((x: number, y: number) => {
    if (!placementElement) return;
    pushHistory();
    switch (placementElement) {
      case 'ball': {
        const id = `ball-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setBalls(prev => [...prev, { id, x, y }]);
        setSelectedElement({ type: 'ball', id });
        break;
      }
      case 'goal': {
        const id = `goal-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setGoals(prev => [...prev, { id, x, y }]);
        setSelectedElement({ type: 'goal', id });
        break;
      }
      case 'smallGoal': {
        const id = `smallGoal-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setSmallGoals(prev => [...prev, { id, x, y }]);
        setSelectedElement({ type: 'smallGoal', id });
        break;
      }
      case 'cone': {
        const id = `cone-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setCones(prev => [...prev, { id, x, y }]);
        setSelectedElement({ type: 'cone', id });
        break;
      }
      case 'mannequin': {
        const id = `mannequin-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setMannequins(prev => [...prev, { id, x, y }]);
        setSelectedElement({ type: 'mannequin', id });
        break;
      }
      case 'gate': {
        const id = `gate-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setGates(prev => [...prev, { id, x, y }]);
        setSelectedElement({ type: 'gate', id });
        break;
      }
      case 'pole': {
        const id = `pole-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setPoles(prev => [...prev, { id, x, y }]);
        setSelectedElement({ type: 'pole', id });
        break;
      }
      case 'ladder': {
        const id = `ladder-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setLadders(prev => [...prev, { id, x, y }]);
        setSelectedElement({ type: 'ladder', id });
        break;
      }
    }
  }, [placementElement, pushHistory]);

  const handleNewPlacedPlayerDrop = (x: number, y: number) => {
    pushHistory();
    setPlacedPlayers(prev => [...prev, { id: `placedPlayer-${Date.now()}-${Math.random().toString(36).slice(2)}`, x, y, color: playerToolColor }]);
  };
  const handlePlacedPlayerMove = (id: string, x: number, y: number) => { pushHistory(); setPlacedPlayers(prev => prev.map(p => p.id === id ? { ...p, x, y } : p)); };
  const handlePlacedPlayerRemove = (id: string) => { pushHistory(); setPlacedPlayers(prev => prev.filter(p => p.id !== id)); };

  const handleClearPitch = () => {
    setIsClearPitchModalOpen(true);
  };

  const confirmClearPitch = () => {
    pushHistory();
    setSlots([]);
    setCurrentAssignments({});
    setBalls([]);
    setArrows([]);
    setGoals([]);
    setSmallGoals([]);
    setCones([]);
    setMannequins([]);
    setGates([]);
    setPoles([]);
    setLadders([]);
    setPlacedPlayers([]);
    setIsClearPitchModalOpen(false);
    setSelectedElement(null);
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

  const snapshotToPreviewPlayers = (snapshot: DrillsSnapshot): Player[] =>
    Object.entries(snapshot.assignments).map(([playerId, slotId]) => ({
      id: playerId,
      name: '',
      number: 0,
      naturalPosition: '',
      bestRole: '',
      condition: 100,
      sharpness: 100,
      roleFamiliarity: 0,
      roleAbility: 0,
      assignedSlot: slotId,
    }));

  const buildPreviewSnapshot = (snapshot: DrillsSnapshot, factor: number = 0.25): DrillsSnapshot => ({
    ...snapshot,
    balls: snapshot.balls.map(b => ({ ...b, size: b.size ? b.size * factor : b.size })),
    goals: snapshot.goals.map(g => ({ ...g, size: g.size ? g.size * factor : g.size })),
    smallGoals: snapshot.smallGoals.map(g => ({ ...g, size: g.size ? g.size * factor : g.size })),
    cones: snapshot.cones.map(c => ({ ...c, size: c.size ? c.size * factor : c.size })),
    mannequins: snapshot.mannequins.map(m => ({ ...m, size: m.size ? m.size * factor : m.size })),
    gates: snapshot.gates.map(g => ({ ...g, size: g.size ? g.size * factor : g.size })),
    poles: snapshot.poles.map(p => ({ ...p, size: p.size ? p.size * factor : p.size })),
    ladders: snapshot.ladders.map(l => ({ ...l, size: l.size ? l.size * factor : l.size })),
    placedPlayers: snapshot.placedPlayers.map(p => ({ ...p, size: (p as any).size ? (p as any).size * factor : (p as any).size })),
  });

  const getDrillKitColor = (drill: SavedDrill): KitColor =>
    drill.kitColor ?? KIT_COLORS[0];

  const handleOpenSaveDrill = () => {
    setSaveName('');
    setIsSaveModalOpen(true);
  };

  const handleCreateSession = () => {
    const name = window.prompt('Name for this training session:');
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const newSession: TrainingSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: trimmed,
      createdAt: Date.now(),
      drills: [],
    };
    setTrainingSessions(prev => [...prev, newSession]);
    setActiveSessionId(newSession.id);
  };

  const handleAddDrillToActiveSession = (drillId: string) => {
    if (!activeSessionId) return;
    setTrainingSessions(prev =>
      prev.map(s => {
        if (s.id !== activeSessionId) return s;
        if (s.drills.some(d => d.drillId === drillId)) return s;
        return { ...s, drills: [...s.drills, { drillId, minutes: 10 }] };
      }),
    );
  };

  const handleUpdateDrillMinutes = (sessionId: string, drillId: string, minutes: number) => {
    if (Number.isNaN(minutes) || minutes < 0) minutes = 0;
    setTrainingSessions(prev =>
      prev.map(s => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          drills: s.drills.map(d => (d.drillId === drillId ? { ...d, minutes } : d)),
        };
      }),
    );
  };

  const handleRemoveDrillFromSession = (sessionId: string, drillId: string) => {
    setTrainingSessions(prev =>
      prev
        .map(s =>
          s.id === sessionId ? { ...s, drills: s.drills.filter(d => d.drillId !== drillId) } : s,
        )
        .filter(s => s.drills.length > 0 || s.id !== sessionId),
    );
  };

  const handleDeleteDrill = (drillId: string) => {
    const drill = savedDrills.find(d => d.id === drillId);
    const name = drill?.name ?? 'this drill';
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;

    setSavedDrills(prev => prev.filter(d => d.id !== drillId));
    setTrainingSessions(prev =>
      prev
        .map(s => ({ ...s, drills: s.drills.filter(d => d.drillId !== drillId) }))
        .filter(s => s.drills.length > 0),
    );
  };

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
            <div className="flex rounded-lg border border-slate-600 overflow-hidden bg-slate-800">
              <button
                type="button"
                onClick={() => setDrillView('design')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${drillView === 'design' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
              >
                Design
              </button>
              <button
                type="button"
                onClick={() => setDrillView('bank')}
                className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${drillView === 'bank' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
              >
                Drill bank
                {savedDrills.length > 0 && (
                  <span className="text-[10px] bg-slate-600/80 px-1.5 py-0.5 rounded-full">
                    {savedDrills.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setDrillView('sessions')}
                className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${drillView === 'sessions' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
              >
                Training sessions
                {trainingSessions.length > 0 && (
                  <span className="text-[10px] bg-slate-600/80 px-1.5 py-0.5 rounded-full">
                    {trainingSessions.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {drillView === 'design' && (
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

              <button
                type="button"
                onClick={handleOpenSaveDrill}
                className="ml-3 px-3 py-1.5 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 shadow-lg flex items-center gap-2"
                title="Save this drill layout to your drill bank"
              >
                <Save size={16} />
                <span className="hidden sm:inline">Save drill</span>
                {savedDrills.length > 0 && (
                  <span className="text-[10px] bg-emerald-800/60 px-1.5 py-0.5 rounded-full">
                    {savedDrills.length}
                  </span>
                )}
              </button>
            </div>
          )}
        </header>

        {isSaveModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
              <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
                <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                  <Save size={18} className="text-amber-400" />
                  Save drill to bank
                </h3>
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Drill name
                </label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="e.g. 3v3 pressing gate, Rondos into finish"
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                />
                <p className="text-[10px] text-slate-500">
                  This will store the current pitch layout, players, equipment and description so you can reuse the drill later.
                </p>
              </div>
              <div className="p-3 bg-slate-800/60 border-t border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSaveDrill}
                  disabled={!saveName.trim()}
                  className="px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white border border-emerald-500 shadow-lg disabled:cursor-not-allowed"
                >
                  Save drill
                </button>
              </div>
            </div>
          </div>
        )}

        {isClearPitchModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 text-center flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Trash2 size={24} className="text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Clear Pitch?</h3>
                <p className="text-slate-400 text-sm">
                  This will remove all drills elements from the pitch. You can use Undo to restore.
                </p>
              </div>

              <div className="p-4 bg-slate-800/50 border-t border-slate-700 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsClearPitchModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    confirmClearPitch();
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg transition-colors shadow-lg"
                >
                  Clear Pitch
                </button>
              </div>
            </div>
          </div>
        )}

        {drillView === 'design' && (
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
            <div className="w-full flex gap-4 items-start">
              {/* Elements + Drawing tools side panel */}
              <div className="w-[260px] shrink-0 bg-slate-800/80 border border-slate-700 rounded-lg p-4 space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span>Elements</span>
                    <div className="h-px bg-slate-700 flex-grow" />
                  </h3>
                  <div className="flex gap-3 items-end justify-start flex-wrap">
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
                  <div className="flex gap-3 items-end justify-start flex-wrap">
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

                <p className="text-[10px] text-slate-500 pt-1">Players: drag from squad list onto the pitch</p>
                {selectedElement && (
                  <p className="text-[10px] text-amber-500/90 pt-0.5">
                    Selected: press ↑ or ↓ to resize, ← or → to rotate goals/gates/ladders
                  </p>
                )}
              </div>

              {/* Pitch */}
              <div className="flex-1 flex justify-center bg-slate-900/20 rounded-lg p-4 border border-slate-800 shrink-0 relative group">
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
                    balls={balls}
                    onBallMoveById={handleBallMoveById}
                    onBallRemoveById={handleBallRemoveById}
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
                  {slots.length === 0 && balls.length === 0 && arrows.length === 0 && goals.length === 0 && smallGoals.length === 0 && cones.length === 0 && mannequins.length === 0 && gates.length === 0 && poles.length === 0 && ladders.length === 0 && placedPlayers.length === 0 && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none text-white/20 font-bold text-xl uppercase tracking-widest text-center">
                      Click an element, then click the pitch to place
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Drill description box */}
            <div className="w-full bg-slate-800/80 border border-slate-700 rounded-lg p-3 shrink-0">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                Drill description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the objective, coaching points, and progression for this drill..."
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 resize-none"
                rows={3}
              />
            </div>
          </section>
        </div>
        )}

        {drillView === 'bank' && (
          <div className="flex-1 overflow-auto min-h-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-2">
              {savedDrills.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-500">
                  <p className="font-medium text-slate-400">No saved drills yet</p>
                  <p className="text-sm mt-1">Switch to Design, create a drill, and use &quot;Save drill&quot; to add it here.</p>
                </div>
              ) : (
                savedDrills.map((drill) => {
                  const s = buildPreviewSnapshot(drill.snapshot);
                  const previewViewMode = s.viewMode === 'penalty' ? 'penalty' : s.viewMode;
                  const kc = getDrillKitColor(drill);
                  const previewPlayers = snapshotToPreviewPlayers(s);
                  return (
                    <div
                      key={drill.id}
                      className="relative flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-amber-500/50 hover:bg-slate-800 transition-colors text-left w-full"
                    >
                      <button
                        type="button"
                        onClick={() => setPreviewDrill(drill)}
                        className="w-full flex flex-col items-center gap-2"
                        title="Preview drill"
                      >
                        <div className="w-full max-w-[220px] rounded-lg overflow-hidden border border-slate-600 bg-slate-900 flex items-center justify-center shrink-0">
                          <Pitch
                            slots={s.slots}
                            players={previewPlayers}
                            balls={s.balls}
                            arrows={s.arrows}
                            goals={s.goals}
                            smallGoals={s.smallGoals}
                            cones={s.cones}
                            mannequins={s.mannequins}
                            gates={s.gates}
                            poles={s.poles}
                            ladders={s.ladders}
                            placedPlayers={s.placedPlayers}
                            kitColor={kc.hex}
                            numberColor={kc.text}
                            viewMode={previewViewMode}
                            playerIconStyle="circle"
                            isExport
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-200 truncate w-full text-center" title={drill.name}>
                          {drill.name}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDeleteDrill(drill.id); }}
                        className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-900/80 border border-slate-700 text-slate-400 hover:text-white hover:border-red-500/60 hover:bg-red-900/20 transition-colors"
                        title="Delete drill"
                        aria-label={`Delete drill ${drill.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {drillView === 'sessions' && (
          <div className="flex-1 overflow-auto min-h-0">
            <div className="p-4 flex flex-col gap-4 h-full">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                    Training sessions
                  </span>
                  {trainingSessions.length > 0 && (
                    <select
                      value={activeSessionId ?? ''}
                      onChange={(e) =>
                        setActiveSessionId(e.target.value || null)
                      }
                      className="ml-2 bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-100"
                    >
                      {trainingSessions
                        .slice()
                        .sort((a, b) => b.createdAt - a.createdAt)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                    </select>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleCreateSession}
                  className="px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 shadow-sm"
                >
                  New training session
                </button>
              </div>

              {trainingSessions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500">
                  <p className="font-medium text-slate-300 mb-1">
                    No training sessions yet
                  </p>
                  <p className="text-sm max-w-md">
                    Create a training session, then add drills from your drill
                    bank and assign minutes to each drill.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {trainingSessions
                      .slice()
                      .sort((a, b) => b.createdAt - a.createdAt)
                      .map((session) => {
                        const totalMinutes = session.drills.reduce(
                          (sum, d) => sum + (d.minutes || 0),
                          0,
                        );
                        return (
                          <button
                            key={session.id}
                            type="button"
                            onClick={() => setActiveSessionId(session.id)}
                            className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 text-left hover:border-amber-500/60 hover:bg-slate-800 transition-colors flex flex-col gap-2"
                          >
                            <div className="flex items-center justify-between gap-3 mb-1">
                              <div className="min-w-0">
                                <h2
                                  className="text-sm font-semibold text-white truncate"
                                  title={session.name}
                                >
                                  {session.name}
                                </h2>
                                <p className="text-[11px] text-slate-500 mt-1">
                                  {session.drills.length} drill
                                  {session.drills.length === 1 ? '' : 's'} ·{' '}
                                  {totalMinutes} min total
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                  </div>

                  {(() => {
                    const session = trainingSessions.find(
                      (s) => s.id === activeSessionId,
                    );
                    if (!session) {
                      return (
                        <div className="text-slate-500 text-sm">
                          Selected session not found.
                        </div>
                      );
                    }
                    const totalMinutes = session.drills.reduce(
                      (sum, d) => sum + (d.minutes || 0),
                      0,
                    );
                    return (
                      <>
                        <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 flex flex-col gap-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <h2
                                className="text-sm font-semibold text-white truncate"
                                title={session.name}
                              >
                                {session.name}
                              </h2>
                              <p className="text-[11px] text-slate-500 mt-1">
                                {session.drills.length} drill
                                {session.drills.length === 1 ? '' : 's'} ·{' '}
                                {totalMinutes} min total
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-3">
                            {session.drills.length === 0 ? (
                              <p className="text-[12px] text-slate-500">
                                No drills added yet. Use the list below to add
                                drills from your drill bank.
                              </p>
                            ) : (
                              <table className="w-full text-xs text-slate-200 border-separate border-spacing-y-1">
                                <thead>
                                  <tr className="text-[10px] uppercase tracking-widest text-slate-500">
                                    <th className="text-left pl-1">Drill</th>
                                    <th className="text-right pr-2 w-24">
                                      Minutes
                                    </th>
                                    <th className="w-8" />
                                  </tr>
                                </thead>
                                <tbody>
                                  {session.drills.map((d) => {
                                    const drill = savedDrills.find(
                                      (sd) => sd.id === d.drillId,
                                    );
                                    const snap = drill?.snapshot;
                                    const kc = drill ? getDrillKitColor(drill) : KIT_COLORS[0];
                                    const previewViewMode =
                                      snap?.viewMode === 'penalty'
                                        ? 'penalty'
                                        : snap?.viewMode ?? 'full';
                                    const previewPlayers = snap
                                      ? snapshotToPreviewPlayers(snap)
                                      : [];
                                    return (
                                      <tr
                                        key={d.drillId}
                                        className="bg-slate-800/80 hover:bg-slate-800 align-top"
                                      >
                                        <td className="px-1 py-1.5">
                                          <div className="flex items-start gap-2">
                                            {snap && (
                                              <div className="w-[80px] h-[53px] rounded-md overflow-hidden border border-slate-600 bg-slate-900 flex-shrink-0">
                                                <div className="w-full h-full relative">
                                                  <Pitch
                                                    slots={snap.slots}
                                                    players={previewPlayers}
                                                    balls={snap.balls}
                                                    arrows={snap.arrows}
                                                    goals={snap.goals}
                                                    smallGoals={snap.smallGoals}
                                                    cones={snap.cones}
                                                    mannequins={snap.mannequins}
                                                    gates={snap.gates}
                                                    poles={snap.poles}
                                                    ladders={snap.ladders}
                                                    placedPlayers={snap.placedPlayers}
                                                    kitColor={kc.hex}
                                                    numberColor={kc.text}
                                                    viewMode={previewViewMode}
                                                    playerIconStyle="circle"
                                                    isExport
                                                    isSmallMode
                                                  />
                                                </div>
                                              </div>
                                            )}
                                            <div className="min-w-0">
                                              <div
                                                className="text-xs font-semibold text-slate-100 truncate"
                                                title={drill?.name}
                                              >
                                                {drill?.name ?? 'Unknown drill'}
                                              </div>
                                              {snap?.description && (
                                                <div
                                                  className="text-[11px] text-slate-400 line-clamp-2 mt-0.5"
                                                  title={snap.description}
                                                >
                                                  {snap.description}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-1 py-1.5 text-right">
                                          <input
                                            type="number"
                                            min={0}
                                            value={d.minutes}
                                            onChange={(e) =>
                                              handleUpdateDrillMinutes(
                                                session.id,
                                                d.drillId,
                                                Number(e.target.value),
                                              )
                                            }
                                            className="w-16 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-right text-xs text-slate-100"
                                          />{' '}
                                          <span className="text-[10px] text-slate-500">
                                            min
                                          </span>
                                        </td>
                                        <td className="px-1 py-1.5 text-center">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleRemoveDrillFromSession(
                                                session.id,
                                                d.drillId,
                                              )
                                            }
                                            className="text-slate-500 hover:text-red-400 text-xs"
                                          >
                                            Remove
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </div>

                        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                            Drill bank
                          </h3>
                          {savedDrills.length === 0 ? (
                            <p className="text-[12px] text-slate-500">
                              No drills saved yet. Go to the Drill bank tab and
                              save some drills first.
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {savedDrills.map((drill) => {
                                const inSession = session.drills.some(
                                  (d) => d.drillId === drill.id,
                                );
                                const snap = drill.snapshot;
                                const kc = getDrillKitColor(drill);
                                const previewViewMode =
                                  snap.viewMode === 'penalty'
                                    ? 'penalty'
                                    : snap.viewMode;
                                const previewPlayers =
                                  snapshotToPreviewPlayers(snap);
                                return (
                                  <button
                                    key={drill.id}
                                    type="button"
                                    disabled={inSession}
                                    onClick={() =>
                                      handleAddDrillToActiveSession(drill.id)
                                    }
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-xs ${
                                      inSession
                                        ? 'border-slate-700 bg-slate-800/60 text-slate-500 cursor-default'
                                        : 'border-slate-700 bg-slate-900/80 hover:border-emerald-500/70 hover:bg-slate-800 text-slate-200'
                                    }`}
                                  >
                                    <div className="w-[72px] h-[48px] rounded-md overflow-hidden border border-slate-600 bg-slate-900 flex-shrink-0">
                                      <div className="w-full h-full relative">
                                        <Pitch
                                          slots={snap.slots}
                                          players={previewPlayers}
                                          balls={snap.balls}
                                          arrows={snap.arrows}
                                          goals={snap.goals}
                                          smallGoals={snap.smallGoals}
                                          cones={snap.cones}
                                          mannequins={snap.mannequins}
                                          gates={snap.gates}
                                          poles={snap.poles}
                                          ladders={snap.ladders}
                                          placedPlayers={snap.placedPlayers}
                                          kitColor={kc.hex}
                                          numberColor={kc.text}
                                          viewMode={previewViewMode}
                                          playerIconStyle="circle"
                                          isExport
                                          isSmallMode
                                        />
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div
                                        className="truncate font-semibold text-slate-100"
                                        title={drill.name}
                                      >
                                        {drill.name}
                                      </div>
                                      {snap.description && (
                                        <div
                                          className="text-[11px] text-slate-400 line-clamp-2"
                                          title={snap.description}
                                        >
                                          {snap.description}
                                        </div>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-slate-500 pl-1">
                                      {inSession ? 'Added' : 'Add'}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        )}
      </div>
      {previewDrill && (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white truncate" title={previewDrill.name}>
                  {previewDrill.name}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { loadDrillIntoDesign(previewDrill); setPreviewDrill(null); }}
                  className="px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500"
                >
                  Open in designer
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDrill(null)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
                  aria-label="Close preview"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {(() => {
                const snap = previewDrill.snapshot;
                const kc = getDrillKitColor(previewDrill);
                const previewPlayers = snapshotToPreviewPlayers(snap);
                const previewViewMode = snap.viewMode === 'penalty' ? 'penalty' : snap.viewMode;
                return (
                  <>
                    <div className="w-full max-w-[420px] mx-auto rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
                      <Pitch
                        slots={snap.slots}
                        players={previewPlayers}
                        balls={snap.balls}
                        arrows={snap.arrows}
                        goals={snap.goals}
                        smallGoals={snap.smallGoals}
                        cones={snap.cones}
                        mannequins={snap.mannequins}
                        gates={snap.gates}
                        poles={snap.poles}
                        ladders={snap.ladders}
                        placedPlayers={snap.placedPlayers}
                        kitColor={kc.hex}
                        numberColor={kc.text}
                        viewMode={previewViewMode}
                        playerIconStyle="circle"
                        isExport
                      />
                    </div>
                    {snap.description && (
                      <div className="max-w-3xl mx-auto">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
                          Description
                        </h4>
                        <p className="text-sm text-slate-200 whitespace-pre-line">
                          {snap.description}
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
