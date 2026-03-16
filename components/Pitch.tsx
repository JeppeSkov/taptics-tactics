import React, { useState, useRef, useEffect } from 'react';
import { Player, TacticalSlot } from '../types';
import { Shirt, X, User } from 'lucide-react';

export interface PitchArrow {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color?: string;
  /** 'dashed' = pass, default = run/movement */
  style?: 'solid' | 'dashed';
  /** Scale for stroke and arrowhead (0.5–2), default 1 */
  size?: number;
}

/** Training balls (Drills etc.) – supports multiple balls */
export interface PitchBall {
  id: string;
  x: number;
  y: number;
  size?: number;
}

export interface PitchZone {
    id: string;
    x: number;
    y: number;
    radius?: number;
}

export interface PitchOpponent {
    id: string;
    x: number;
    y: number;
    label?: string;
}

export interface PitchGoal {
    id: string;
    x: number;
    y: number;
    size?: number;
    /** Rotation in degrees (0–359). */
    rotation?: number;
}

export interface PitchSmallGoal {
    id: string;
    x: number;
    y: number;
    size?: number;
    /** Rotation in degrees (0–359). */
    rotation?: number;
}

/** Cone marker (Hudl/XPS-style equipment) */
export interface PitchCone {
    id: string;
    x: number;
    y: number;
    size?: number;
}

/** Standing mannequin / dummy (passive defender) */
export interface PitchMannequin {
    id: string;
    x: number;
    y: number;
    size?: number;
}

/** Passing gate: two poles with gap */
export interface PitchGate {
    id: string;
    x: number;
    y: number;
    size?: number;
    /** Rotation in degrees (0–359). */
    rotation?: number;
}

/** Single pole / stick marker */
export interface PitchPole {
    id: string;
    x: number;
    y: number;
    size?: number;
}

/** Agility ladder segment */
export interface PitchLadder {
    id: string;
    x: number;
    y: number;
    size?: number;
    /** Rotation in degrees (0–359). */
    rotation?: number;
}

/** Placed player marker (no number, click-to-place, color only) */
export interface PitchPlacedPlayer {
    id: string;
    x: number;
    y: number;
    color: string;
    /** Scale 0.5–2, default 1 */
    size?: number;
}

interface PitchProps {
  slots: TacticalSlot[];
  players: Player[];
  onPlayerDrop: (draggedPlayerId: string, targetSlotId: string) => void;
  onSlotMove: (slotId: string, x: number, y: number) => void;
  onNewPlayerDrop?: (playerId: string, x: number, y: number) => void;
  onRemovePlayer?: (playerId: string) => void;
  
  // Ball Props (legacy single-ball + multi-ball for drills)
  /** Legacy single-ball position (used by Set Pieces / existing flows). */
  ballPosition?: { x: number, y: number; size?: number } | null;
  /** Legacy single-ball move handler (no id – assumes only one ball). */
  onBallMove?: (x: number, y: number) => void;
  /** Legacy single-ball remove handler. */
  onBallRemove?: () => void;
  /** Optional multi-ball API (Drills). When provided, balls render in addition to any legacy single ball. */
  balls?: PitchBall[];
  onBallMoveById?: (id: string, x: number, y: number) => void;
  onBallRemoveById?: (id: string) => void;

  // Arrow Props
  arrows?: PitchArrow[];
  onArrowUpdate?: (arrow: PitchArrow) => void;
  onNewArrowDrop?: (startX: number, startY: number, endX?: number, endY?: number, style?: 'solid' | 'dashed') => void;
  onArrowRemove?: (id: string) => void;
  /** When true, clicking the pitch background adds a new arrow (drawing mode). */
  arrowDrawingMode?: boolean;
  /** Style of arrow to draw when in drawing mode (solid or dashed). */
  arrowDrawStyle?: 'solid' | 'dashed';
  /** Called when user starts dragging an existing arrow (for undo: push state once per drag). */
  onArrowDragStart?: () => void;
  /** Called when user selects an arrow (e.g. for resize with keyboard). */
  onArrowSelect?: (id: string) => void;

  // Zone Props
  zones?: PitchZone[];
  onNewZoneDrop?: (x: number, y: number) => void;
  onZoneMove?: (id: string, x: number, y: number) => void;
  onZoneResize?: (id: string, radius: number) => void;
  onZoneRemove?: (id: string) => void;

  // Opponent Props
  opponents?: PitchOpponent[];
  onNewOpponentDrop?: (x: number, y: number) => void;
  onOpponentMove?: (id: string, x: number, y: number) => void;
  onOpponentRemove?: (id: string) => void;

  // Goal Props (for Drills)
  goals?: PitchGoal[];
  onNewGoalDrop?: (x: number, y: number) => void;
  onGoalMove?: (id: string, x: number, y: number) => void;
  onGoalRemove?: (id: string) => void;
  smallGoals?: PitchSmallGoal[];
  onNewSmallGoalDrop?: (x: number, y: number) => void;
  onSmallGoalMove?: (id: string, x: number, y: number) => void;
  onSmallGoalRemove?: (id: string) => void;

  // Pro coaching equipment (Hudl / XPS style)
  cones?: PitchCone[];
  onNewConeDrop?: (x: number, y: number) => void;
  onConeMove?: (id: string, x: number, y: number) => void;
  onConeRemove?: (id: string) => void;
  mannequins?: PitchMannequin[];
  onNewMannequinDrop?: (x: number, y: number) => void;
  onMannequinMove?: (id: string, x: number, y: number) => void;
  onMannequinRemove?: (id: string) => void;
  gates?: PitchGate[];
  onNewGateDrop?: (x: number, y: number) => void;
  onGateMove?: (id: string, x: number, y: number) => void;
  onGateRemove?: (id: string) => void;
  poles?: PitchPole[];
  onNewPoleDrop?: (x: number, y: number) => void;
  onPoleMove?: (id: string, x: number, y: number) => void;
  onPoleRemove?: (id: string) => void;
  ladders?: PitchLadder[];
  onNewLadderDrop?: (x: number, y: number) => void;
  onLadderMove?: (id: string, x: number, y: number) => void;
  onLadderRemove?: (id: string) => void;

  // Placed players (click-to-place, no number, color only)
  placedPlayers?: PitchPlacedPlayer[];
  /** When true, clicking the pitch background places a new player. */
  placedPlayerDrawingMode?: boolean;
  onNewPlacedPlayerDrop?: (x: number, y: number) => void;
  onPlacedPlayerMove?: (id: string, x: number, y: number) => void;
  onPlacedPlayerRemove?: (id: string) => void;
  onPlacedPlayerDragStart?: () => void;

  /** When true, clicking the pitch background places one instance of the current element (Drills click-to-place). */
  elementPlacementMode?: boolean;
  onElementPlace?: (x: number, y: number) => void;

  /** Called when user clicks an element (for selection / size adjust). type + id (id undefined for legacy single ball). */
  onElementClick?: (type: 'ball' | 'goal' | 'smallGoal' | 'cone' | 'mannequin' | 'gate' | 'pole' | 'ladder' | 'placedPlayer', id?: string) => void;
  /** Called when user clicks the pitch background (e.g. to deselect). */
  onPitchBackgroundClick?: () => void;

  kitColor: string;
  numberColor: string;
  isExport?: boolean;
  viewMode?: 'full' | 'offensive' | 'defensive' | 'penalty';
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
  balls = [],
  onBallMoveById,
  onBallRemoveById,
  arrows = [],
  onArrowUpdate,
  onNewArrowDrop,
  onArrowRemove,
  arrowDrawingMode = false,
  arrowDrawStyle = 'solid',
  onArrowDragStart,
  onArrowSelect,
  zones = [],
  onNewZoneDrop,
  onZoneMove,
  onZoneResize,
  onZoneRemove,
  opponents = [],
  onNewOpponentDrop,
  onOpponentMove,
  onOpponentRemove,
  goals = [],
  onNewGoalDrop,
  onGoalMove,
  onGoalRemove,
  smallGoals = [],
  onNewSmallGoalDrop,
  onSmallGoalMove,
  onSmallGoalRemove,
  cones = [],
  onNewConeDrop,
  onConeMove,
  onConeRemove,
  mannequins = [],
  onNewMannequinDrop,
  onMannequinMove,
  onMannequinRemove,
  gates = [],
  onNewGateDrop,
  onGateMove,
  onGateRemove,
  poles = [],
  onNewPoleDrop,
  onPoleMove,
  onPoleRemove,
  ladders = [],
  onNewLadderDrop,
  onLadderMove,
  onLadderRemove,
  placedPlayers = [],
  placedPlayerDrawingMode = false,
  onNewPlacedPlayerDrop,
  onPlacedPlayerMove,
  onPlacedPlayerRemove,
  onPlacedPlayerDragStart,
  elementPlacementMode = false,
  onElementPlace,
  onElementClick,
  onPitchBackgroundClick,
  kitColor, 
  numberColor,
  isExport = false,
  viewMode = 'full',
  playerIconStyle = 'shirt',
  isSmallMode = false
}) => {
  const getPlayerInSlot = (slotId: string) => players.find(p => p.assignedSlot === slotId);
  const scaleVal = (s: number | undefined | null): number => (typeof s === 'number' && Number.isFinite(s) && s > 0 ? s : 1);

  // -- Drag Logic for Arrows --
  const [dragState, setDragState] = useState<{
    type: 'arrow';
    id: string;
    mode: 'start' | 'end' | 'move';
    lastX: number;
    lastY: number;
  } | null>(null);

  // -- Drag Logic for rotatable equipment (goals, small goals, gates, ladders) --
  const [equipmentDrag, setEquipmentDrag] = useState<{
    kind: 'goal' | 'smallGoal' | 'gate' | 'ladder';
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  // Track selected arrow to show handles/delete button
  const [selectedArrowId, setSelectedArrowId] = useState<string | null>(null);
  // Drag-to-draw arrow (start on mousedown, end on mouseup)
  const [drawingArrow, setDrawingArrow] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);

  const [zoneResizeState, setZoneResizeState] = useState<{ id: string } | null>(null);

  // Figma-style alignment guides: show when drop snaps to another element's line
  const [alignmentGuides, setAlignmentGuides] = useState<{ vertical?: number; horizontal?: number } | null>(null);
  useEffect(() => {
    if (!alignmentGuides) return;
    const t = setTimeout(() => setAlignmentGuides(null), 400);
    return () => clearTimeout(t);
  }, [alignmentGuides]);

  const containerRef = useRef<HTMLDivElement>(null);

  const ALIGN_THRESHOLD = 2; // snap when within 2% of pitch
  function getAlignmentTargets(excludeX?: number, excludeY?: number): { xs: number[]; ys: number[] } {
    const xs: number[] = [];
    const ys: number[] = [];
    const add = (x: number, y: number) => {
      if (excludeX === undefined || excludeY === undefined || Math.abs(x - excludeX) > 0.01 || Math.abs(y - excludeY) > 0.01) {
        xs.push(x); ys.push(y);
      }
    };
    slots.forEach(s => add(s.x, s.y));
    // Legacy single ball
    if (ballPosition) add(ballPosition.x, ballPosition.y);
    // Multi-balls (Drills)
    balls.forEach(b => add(b.x, b.y));
    goals.forEach(g => add(g.x, g.y));
    smallGoals.forEach(sg => add(sg.x, sg.y));
    cones.forEach(c => add(c.x, c.y));
    mannequins.forEach(m => add(m.x, m.y));
    gates.forEach(g => add(g.x, g.y));
    poles.forEach(p => add(p.x, p.y));
    ladders.forEach(l => add(l.x, l.y));
    opponents.forEach(o => add(o.x, o.y));
    zones.forEach(z => add(z.x, z.y));
    xs.push(50); ys.push(50); // pitch center
    return { xs: [...new Set(xs)], ys: [...new Set(ys)] };
  }
  function snapToAlignment(rawX: number, rawY: number, xs: number[], ys: number[]): { x: number; y: number; guideV?: number; guideH?: number } {
    let x = rawX, y = rawY;
    let guideV: number | undefined, guideH: number | undefined;
    for (const tx of xs) {
      if (Math.abs(rawX - tx) <= ALIGN_THRESHOLD) { x = tx; guideV = tx; break; }
    }
    for (const ty of ys) {
      if (Math.abs(rawY - ty) <= ALIGN_THRESHOLD) { y = ty; guideH = ty; break; }
    }
    return { x, y, guideV, guideH };
  }
  function applyAlignment(rawX: number, rawY: number, excludeX?: number, excludeY?: number): { x: number; y: number } {
    const { xs, ys } = getAlignmentTargets(excludeX, excludeY);
    const result = snapToAlignment(rawX, rawY, xs, ys);
    if (result.guideV !== undefined || result.guideH !== undefined) {
      setAlignmentGuides({ vertical: result.guideV, horizontal: result.guideH });
    }
    return { x: result.x, y: result.y };
  }


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
    const type = e.dataTransfer.getData('type');
    if (type) {
        const raw = calculateCoords(e);
        const getExcludeSlot = (): { x: number; y: number } | undefined => {
          if (type === 'ball' && ballPosition) return ballPosition;
          if (type === 'ball-multi') {
            const ballId = e.dataTransfer.getData('ballId');
            if (ballId) {
              const b = balls.find(bb => bb.id === ballId);
              if (b) return { x: b.x, y: b.y };
            }
          }
          const zoneId = e.dataTransfer.getData('zoneId');
          if (zoneId) { const z = zones.find(zo => zo.id === zoneId); return z ? { x: z.x, y: z.y } : undefined; }
          const oppId = e.dataTransfer.getData('opponentId');
          if (oppId) { const o = opponents.find(op => op.id === oppId); return o ? { x: o.x, y: o.y } : undefined; }
          const goalId = e.dataTransfer.getData('goalId');
          if (goalId) { const g = goals.find(go => go.id === goalId); return g ? { x: g.x, y: g.y } : undefined; }
          const smallGoalId = e.dataTransfer.getData('smallGoalId');
          if (smallGoalId) { const sg = smallGoals.find(sgo => sgo.id === smallGoalId); return sg ? { x: sg.x, y: sg.y } : undefined; }
          const coneId = e.dataTransfer.getData('coneId');
          if (coneId) { const c = cones.find(co => co.id === coneId); return c ? { x: c.x, y: c.y } : undefined; }
          const mannequinId = e.dataTransfer.getData('mannequinId');
          if (mannequinId) { const m = mannequins.find(mo => mo.id === mannequinId); return m ? { x: m.x, y: m.y } : undefined; }
          const gateId = e.dataTransfer.getData('gateId');
          if (gateId) { const g = gates.find(go => go.id === gateId); return g ? { x: g.x, y: g.y } : undefined; }
          const poleId = e.dataTransfer.getData('poleId');
          if (poleId) { const p = poles.find(po => po.id === poleId); return p ? { x: p.x, y: p.y } : undefined; }
          const ladderId = e.dataTransfer.getData('ladderId');
          if (ladderId) { const l = ladders.find(lo => lo.id === ladderId); return l ? { x: l.x, y: l.y } : undefined; }
          const placedPlayerId = e.dataTransfer.getData('placedPlayerId');
          if (placedPlayerId) { const p = placedPlayers.find(po => po.id === placedPlayerId); return p ? { x: p.x, y: p.y } : undefined; }
          return undefined;
        };
        const excl = getExcludeSlot();
        const { x, y } = applyAlignment(raw.x, raw.y, excl?.x, excl?.y);
        if (type === 'ball' && onBallMove) onBallMove(x, y);
        if (type === 'ball-multi' && onBallMoveById) {
          const ballId = e.dataTransfer.getData('ballId');
          if (ballId) onBallMoveById(ballId, x, y);
        }
        if (type === 'zone' && onZoneMove) {
             const zoneId = e.dataTransfer.getData('zoneId');
             if(zoneId) onZoneMove(zoneId, x, y);
        }
        if (type === 'opponent' && onOpponentMove) {
            const oppId = e.dataTransfer.getData('opponentId');
            if(oppId) onOpponentMove(oppId, x, y);
        }
        if (type === 'arrow' && onNewArrowDrop) onNewArrowDrop(raw.x, raw.y, undefined, undefined, (e.dataTransfer.getData('arrowStyle') || 'solid') as 'solid' | 'dashed');
        if (type === 'goal') {
            const goalId = e.dataTransfer.getData('goalId');
            if (goalId && onGoalMove) onGoalMove(goalId, x, y);
            else if (onNewGoalDrop) onNewGoalDrop(x, y);
            return;
        }
        if (type === 'smallGoal') {
            const smallGoalId = e.dataTransfer.getData('smallGoalId');
            if (smallGoalId && onSmallGoalMove) onSmallGoalMove(smallGoalId, x, y);
            else if (onNewSmallGoalDrop) onNewSmallGoalDrop(x, y);
            return;
        }
        if (type === 'cone') {
            const id = e.dataTransfer.getData('coneId');
            if (id && onConeMove) onConeMove(id, x, y);
            else if (onNewConeDrop) onNewConeDrop(x, y);
            return;
        }
        if (type === 'mannequin') {
            const id = e.dataTransfer.getData('mannequinId');
            if (id && onMannequinMove) onMannequinMove(id, x, y);
            else if (onNewMannequinDrop) onNewMannequinDrop(x, y);
            return;
        }
        if (type === 'gate') {
            const id = e.dataTransfer.getData('gateId');
            if (id && onGateMove) onGateMove(id, x, y);
            else if (onNewGateDrop) onNewGateDrop(x, y);
            return;
        }
        if (type === 'pole') {
            const id = e.dataTransfer.getData('poleId');
            if (id && onPoleMove) onPoleMove(id, x, y);
            else if (onNewPoleDrop) onNewPoleDrop(x, y);
            return;
        }
        if (type === 'ladder') {
            const id = e.dataTransfer.getData('ladderId');
            if (id && onLadderMove) onLadderMove(id, x, y);
            else if (onNewLadderDrop) onNewLadderDrop(x, y);
            return;
        }
        if (type === 'placedPlayer' && onPlacedPlayerMove) {
            const id = e.dataTransfer.getData('placedPlayerId');
            if (id) onPlacedPlayerMove(id, x, y);
            return;
        }
        return;
    }

    const draggedSlotId = e.dataTransfer.getData('slotId');
    const slotExcl = draggedSlotId ? slots.find(s => s.id === draggedSlotId) : undefined;

    // 2. Handle "Self-Move" (Dragging the player slightly onto themselves)
    if (draggedSlotId === targetSlotId) {
         const raw = calculateCoords(e);
         const { x, y } = applyAlignment(raw.x, raw.y, slotExcl?.x, slotExcl?.y);
         onSlotMove(draggedSlotId, x, y);
         return;
    }

    // 3. Handle Slot-to-Slot Dragging
    if (isSmallMode && draggedSlotId) {
         const raw = calculateCoords(e);
         const { x, y } = applyAlignment(raw.x, raw.y, slotExcl?.x, slotExcl?.y);
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
    const raw = calculateCoords(e);
    const type = e.dataTransfer.getData('type');
    const slotId = e.dataTransfer.getData('slotId');
    const zoneId = e.dataTransfer.getData('zoneId');
    const opponentId = e.dataTransfer.getData('opponentId');
    const goalId = e.dataTransfer.getData('goalId');
    const smallGoalId = e.dataTransfer.getData('smallGoalId');
    const coneId = e.dataTransfer.getData('coneId');
    const mannequinId = e.dataTransfer.getData('mannequinId');
    const gateId = e.dataTransfer.getData('gateId');
    const poleId = e.dataTransfer.getData('poleId');
    const ladderId = e.dataTransfer.getData('ladderId');
    const playerId = e.dataTransfer.getData('playerId');
    const placedPlayerId = e.dataTransfer.getData('placedPlayerId');
    const ballId = e.dataTransfer.getData('ballId');
    const getExclude = (): { x: number; y: number } | undefined => {
      if (type === 'ball' && ballPosition) return ballPosition;
      if (type === 'ball-multi' && ballId) {
        const b = balls.find(bb => bb.id === ballId);
        if (b) return { x: b.x, y: b.y };
      }
      if (slotId) { const s = slots.find(sl => sl.id === slotId); return s ? { x: s.x, y: s.y } : undefined; }
      if (zoneId) { const z = zones.find(zo => zo.id === zoneId); return z ? { x: z.x, y: z.y } : undefined; }
      if (opponentId) { const o = opponents.find(op => op.id === opponentId); return o ? { x: o.x, y: o.y } : undefined; }
      if (goalId) { const g = goals.find(go => go.id === goalId); return g ? { x: g.x, y: g.y } : undefined; }
      if (smallGoalId) { const sg = smallGoals.find(sgo => sgo.id === smallGoalId); return sg ? { x: sg.x, y: sg.y } : undefined; }
      if (coneId) { const c = cones.find(co => co.id === coneId); return c ? { x: c.x, y: c.y } : undefined; }
      if (mannequinId) { const m = mannequins.find(mo => mo.id === mannequinId); return m ? { x: m.x, y: m.y } : undefined; }
      if (gateId) { const g = gates.find(go => go.id === gateId); return g ? { x: g.x, y: g.y } : undefined; }
      if (poleId) { const p = poles.find(po => po.id === poleId); return p ? { x: p.x, y: p.y } : undefined; }
      if (ladderId) { const l = ladders.find(lo => lo.id === ladderId); return l ? { x: l.x, y: l.y } : undefined; }
      if (placedPlayerId) { const p = placedPlayers.find(po => po.id === placedPlayerId); return p ? { x: p.x, y: p.y } : undefined; }
      return undefined;
    };
    const excl = getExclude();
    const { x, y } = applyAlignment(raw.x, raw.y, excl?.x, excl?.y);

    // Handle Ball Drop (legacy single ball)
    if (type === 'ball' && onBallMove) {
        onBallMove(x, y);
        return;
    }
    // Handle multi-ball Drop (Drills)
    if (type === 'ball-multi' && onBallMoveById && ballId) {
        onBallMoveById(ballId, x, y);
        return;
    }

    // Handle Arrow Drop (no snap for new arrow)
    if (type === 'arrow' && onNewArrowDrop) {
        onNewArrowDrop(raw.x, raw.y, undefined, undefined, (e.dataTransfer.getData('arrowStyle') || 'solid') as 'solid' | 'dashed');
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

    // Handle Goal Drop (new or move existing)
    if (type === 'goal') {
        const goalId = e.dataTransfer.getData('goalId');
        if (goalId && onGoalMove) onGoalMove(goalId, x, y);
        else if (onNewGoalDrop) onNewGoalDrop(x, y);
        return;
    }

    // Handle Small Goal Drop (new or move existing)
    if (type === 'smallGoal') {
        const smallGoalId = e.dataTransfer.getData('smallGoalId');
        if (smallGoalId && onSmallGoalMove) onSmallGoalMove(smallGoalId, x, y);
        else if (onNewSmallGoalDrop) onNewSmallGoalDrop(x, y);
        return;
    }

    if (type === 'cone') {
        const id = e.dataTransfer.getData('coneId');
        if (id && onConeMove) onConeMove(id, x, y);
        else if (onNewConeDrop) onNewConeDrop(x, y);
        return;
    }
    if (type === 'mannequin') {
        const id = e.dataTransfer.getData('mannequinId');
        if (id && onMannequinMove) onMannequinMove(id, x, y);
        else if (onNewMannequinDrop) onNewMannequinDrop(x, y);
        return;
    }
    if (type === 'gate') {
        const id = e.dataTransfer.getData('gateId');
        if (id && onGateMove) onGateMove(id, x, y);
        else if (onNewGateDrop) onNewGateDrop(x, y);
        return;
    }
    if (type === 'pole') {
        const id = e.dataTransfer.getData('poleId');
        if (id && onPoleMove) onPoleMove(id, x, y);
        else if (onNewPoleDrop) onNewPoleDrop(x, y);
        return;
    }
    if (type === 'ladder') {
        const id = e.dataTransfer.getData('ladderId');
        if (id && onLadderMove) onLadderMove(id, x, y);
        else if (onNewLadderDrop) onNewLadderDrop(x, y);
        return;
    }
    if (type === 'placedPlayer' && onPlacedPlayerMove) {
        const id = e.dataTransfer.getData('placedPlayerId');
        if (id) onPlacedPlayerMove(id, x, y);
        return;
    }

    if (slotId) {
      onSlotMove(slotId, x, y);
    } else if (zoneId && onZoneMove) {
      onZoneMove(zoneId, x, y);
    } else if (opponentId && onOpponentMove) {
      onOpponentMove(opponentId, x, y);
    } else if (goalId && onGoalMove) {
      onGoalMove(goalId, x, y);
    } else if (smallGoalId && onSmallGoalMove) {
      onSmallGoalMove(smallGoalId, x, y);
    } else if (coneId && onConeMove) {
      onConeMove(coneId, x, y);
    } else if (mannequinId && onMannequinMove) {
      onMannequinMove(mannequinId, x, y);
    } else if (gateId && onGateMove) {
      onGateMove(gateId, x, y);
    } else if (poleId && onPoleMove) {
      onPoleMove(poleId, x, y);
    } else if (ladderId && onLadderMove) {
      onLadderMove(ladderId, x, y);
    } else if (placedPlayerId && onPlacedPlayerMove) {
      onPlacedPlayerMove(placedPlayerId, x, y);
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

  const handleGoalDragStart = (e: React.DragEvent, goalId: string) => {
      e.dataTransfer.setData('goalId', goalId);
      e.dataTransfer.setData('type', 'goal');
      e.stopPropagation();
  };
 
  const handleSmallGoalDragStart = (e: React.DragEvent, smallGoalId: string) => {
      e.dataTransfer.setData('smallGoalId', smallGoalId);
      e.dataTransfer.setData('type', 'smallGoal');
      e.stopPropagation();
  };

  const handleConeDragStart = (e: React.DragEvent, id: string) => {
      e.dataTransfer.setData('coneId', id);
      e.dataTransfer.setData('type', 'cone');
      e.stopPropagation();
  };
  const handleMannequinDragStart = (e: React.DragEvent, id: string) => {
      e.dataTransfer.setData('mannequinId', id);
      e.dataTransfer.setData('type', 'mannequin');
      e.stopPropagation();
  };
  const handleGateDragStart = (e: React.DragEvent, id: string) => {
      e.dataTransfer.setData('gateId', id);
      e.dataTransfer.setData('type', 'gate');
      e.stopPropagation();
  };
  const handlePoleDragStart = (e: React.DragEvent, id: string) => {
      e.dataTransfer.setData('poleId', id);
      e.dataTransfer.setData('type', 'pole');
      e.stopPropagation();
  };
  const handleLadderDragStart = (e: React.DragEvent, id: string) => {
      e.dataTransfer.setData('ladderId', id);
      e.dataTransfer.setData('type', 'ladder');
      e.stopPropagation();
  };
  const handlePlacedPlayerDragStart = (e: React.DragEvent, id: string) => {
      e.dataTransfer.setData('placedPlayerId', id);
      e.dataTransfer.setData('type', 'placedPlayer');
      onPlacedPlayerDragStart?.();
      e.stopPropagation();
  };

  // -- Arrow Interaction Handlers --
  const handleArrowMouseDown = (e: React.MouseEvent, id: string, mode: 'start' | 'end' | 'move') => {
    if (isExport) return;
    e.stopPropagation();
    e.preventDefault();
    
    // Select the arrow on interaction (for resize via keyboard in parent)
    setSelectedArrowId(id);
    onArrowSelect?.(id);

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const startX = ((e.clientX - rect.left) / rect.width) * 100;
    const startY = ((e.clientY - rect.top) / rect.height) * 100;

    onArrowDragStart?.();
    setDragState({ type: 'arrow', id, mode, lastX: startX, lastY: startY });
  };

  // Start dragging a rotatable equipment element (goal, smallGoal, gate, ladder)
  const handleEquipmentMouseDown = (
    e: React.MouseEvent,
    kind: 'goal' | 'smallGoal' | 'gate' | 'ladder',
    id: string,
  ) => {
    if (isExport) return;
    e.stopPropagation();
    e.preventDefault();
    if (!containerRef.current) return;

    const { x: mouseX, y: mouseY } = getPct(e);
    let elemX = 0;
    let elemY = 0;
    if (kind === 'goal') {
      const g = goals.find(goal => goal.id === id);
      if (!g) return;
      elemX = g.x; elemY = g.y;
    } else if (kind === 'smallGoal') {
      const sg = smallGoals.find(goal => goal.id === id);
      if (!sg) return;
      elemX = sg.x; elemY = sg.y;
    } else if (kind === 'gate') {
      const g = gates.find(gate => gate.id === id);
      if (!g) return;
      elemX = g.x; elemY = g.y;
    } else if (kind === 'ladder') {
      const l = ladders.find(ladder => ladder.id === id);
      if (!l) return;
      elemX = l.x; elemY = l.y;
    }

    setEquipmentDrag({
      kind,
      id,
      offsetX: mouseX - elemX,
      offsetY: mouseY - elemY,
    });
  };

  const getPct = (e: { clientX: number; clientY: number }) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      return { x: Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)), y: Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)) };
  };
  const handlePitchClick = (e: React.MouseEvent) => {
      if (e.target !== containerRef.current && e.target !== e.currentTarget) return;
      if (elementPlacementMode && onElementPlace && containerRef.current) {
          const { x, y } = getPct(e);
          onElementPlace(x, y);
          return;
      }
      if (placedPlayerDrawingMode && onNewPlacedPlayerDrop && containerRef.current) {
          const { x, y } = getPct(e);
          onNewPlacedPlayerDrop(x, y);
          return;
      }
      onPitchBackgroundClick?.();
      setSelectedArrowId(null);
      if (arrowDrawingMode && onNewArrowDrop && containerRef.current) {
          const { x, y } = getPct(e);
          setDrawingArrow({ startX: x, startY: y, endX: x, endY: y });
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (drawingArrow) { const p = getPct(e); setDrawingArrow(d => d ? { ...d, endX: p.x, endY: p.y } : null); return; }
      // Zone resize: radius = distance from zone center to mouse → true circle
      if (zoneResizeState && onZoneResize && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const zone = zones.find(z => z.id === zoneResizeState.id);
          if (!zone) return;
          const cx = rect.left + (zone.x / 100) * rect.width;
          const cy = rect.top + (zone.y / 100) * rect.height;
          const dx = e.clientX - cx;
          const dy = e.clientY - cy;
          const distPx = Math.sqrt(dx * dx + dy * dy);
          const newRadiusPct = (distPx / rect.width) * 100;
          const clamped = Math.max(3, Math.min(30, newRadiusPct));
          onZoneResize(zoneResizeState.id, clamped);
          return;
      }

      // Dragging equipment (goals, small goals, gates, ladders)
      if (equipmentDrag) {
        const { x: rawX, y: rawY } = getPct(e);
        const newX = Math.max(0, Math.min(100, rawX - equipmentDrag.offsetX));
        const newY = Math.max(0, Math.min(100, rawY - equipmentDrag.offsetY));

        if (equipmentDrag.kind === 'goal' && onGoalMove) {
          onGoalMove(equipmentDrag.id, newX, newY);
        } else if (equipmentDrag.kind === 'smallGoal' && onSmallGoalMove) {
          onSmallGoalMove(equipmentDrag.id, newX, newY);
        } else if (equipmentDrag.kind === 'gate' && onGateMove) {
          onGateMove(equipmentDrag.id, newX, newY);
        } else if (equipmentDrag.kind === 'ladder' && onLadderMove) {
          onLadderMove(equipmentDrag.id, newX, newY);
        }
        return;
      }

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

  const handleMouseUp = (e: React.MouseEvent) => {
      if (drawingArrow && onNewArrowDrop) {
          const end = e ? getPct(e) : { x: drawingArrow.endX, y: drawingArrow.endY };
          onNewArrowDrop(drawingArrow.startX, drawingArrow.startY, end.x, end.y, arrowDrawStyle);
          setDrawingArrow(null);
      }
      setDragState(null);
      setZoneResizeState(null);
      setEquipmentDrag(null);
  };

  const handleZoneResizeMouseDown = (e: React.MouseEvent, zoneId: string) => {
      if (isExport || !onZoneResize) return;
      e.stopPropagation();
      e.preventDefault();
      setZoneResizeState({ id: zoneId });
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
  
  const aspectRatioClass = viewMode === 'full' ? 'aspect-[5/6]' : viewMode === 'penalty' ? 'aspect-[3/2]' : 'aspect-[5/3]';

  // Arrow sizing logic (base values; per-arrow size scales these)
  const arrowStrokeWidthBase = isSmallMode ? 0.96 : 1.2;
  const markerSizeBase = isSmallMode ? 3.2 : 4;
  const markerRefXBase = isSmallMode ? 2.5 : 3;
  const markerViewBox = "0 0 4 4";
  
  return (
    <div 
      ref={containerRef}
      className={`relative w-full ${aspectRatioClass} bg-green-700 rounded-lg overflow-hidden border-2 border-slate-600 shadow-2xl pitch-pattern transition-all duration-300 select-none ${(arrowDrawingMode || placedPlayerDrawingMode || elementPlacementMode) ? 'cursor-crosshair' : ''}`}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
      onDrop={handlePitchDrop}
      onMouseDown={handlePitchClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* --- ALIGNMENT GUIDES (Figma-style) --- */}
      {alignmentGuides && !isExport && (
        <div className="absolute inset-0 pointer-events-none z-50">
          {alignmentGuides.vertical != null && (
            <div className="absolute top-0 bottom-0 w-0.5 bg-cyan-400/90 shadow-lg" style={{ left: `${alignmentGuides.vertical}%` }} />
          )}
          {alignmentGuides.horizontal != null && (
            <div className="absolute left-0 right-0 h-0.5 bg-cyan-400/90 shadow-lg" style={{ top: `${alignmentGuides.horizontal}%` }} />
          )}
        </div>
      )}

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

      {viewMode === 'penalty' && (
        <>
           <div className="absolute inset-0 border-2 border-white/20 m-2 rounded-sm pointer-events-none"></div>
           <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/20 m-2 mt-0 pointer-events-none"></div>
           <div className="absolute top-2 left-[15%] right-[15%] h-[25%] border border-white/20 border-t-0 pointer-events-none"></div>
           <div className="absolute top-2 left-[35%] right-[35%] h-[12%] border border-white/20 border-t-0 pointer-events-none"></div>
        </>
      )}

      {/* --- ZONES LAYER --- */}
      {zones.map((zone) => {
          const r = zone.radius ?? 10;
          return (
         <div
            key={zone.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move z-10 group"
            style={{
                left: `${zone.x}%`,
                top: `${zone.y}%`,
                width: `${r * 2}%`,
                aspectRatio: '1',
                height: 'auto',
            }}
            draggable={!isExport}
            onDragStart={(e) => handleZoneDragStart(e, zone.id)}
         >
             <div className="w-full h-full rounded-full border-2 border-dashed border-yellow-300/60 bg-yellow-300/10 flex items-center justify-center relative">
                 <div className="w-1 h-1 bg-yellow-300/50 rounded-full" />
                 {!isExport && onZoneResize && (
                    <button
                        type="button"
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 rounded-full bg-yellow-300 border border-yellow-100 shadow-md cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity z-50"
                        onMouseDown={(e) => handleZoneResizeMouseDown(e, zone.id)}
                        draggable={false}
                        title="Drag to resize"
                    />
                 )}
             </div>
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
          );
      })}

      {/* --- ARROWS LAYER (SVG) --- */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Preview line (no per-arrow size) */}
        {drawingArrow && <line x1={drawingArrow.startX} y1={drawingArrow.startY} x2={drawingArrow.endX} y2={drawingArrow.endY} stroke="#000" strokeWidth={arrowStrokeWidthBase} strokeDasharray={arrowDrawStyle === 'dashed' ? '2 1.5' : undefined} markerEnd={`url(#arrowhead-preview)`} />}
        <defs>
            <marker id="arrowhead-preview" markerWidth={markerSizeBase} markerHeight={markerSizeBase} refX={markerRefXBase} refY="2" orient="auto" viewBox={markerViewBox}>
                <path d="M0,0 L0,4 L4,2 z" fill="#000000" />
            </marker>
            {arrows.map(arrow => {
              const scale = typeof arrow.size === 'number' && arrow.size > 0 ? arrow.size : 1;
              const mw = markerSizeBase * scale;
              const refX = markerRefXBase * scale;
              return (
                <React.Fragment key={arrow.id}>
                  <marker id={`arrowhead-${arrow.id}`} markerWidth={mw} markerHeight={mw} refX={refX} refY="2" orient="auto" viewBox={markerViewBox}>
                    <path d="M0,0 L0,4 L4,2 z" fill="#000000" />
                  </marker>
                  <marker id={`arrowhead-hover-${arrow.id}`} markerWidth={mw} markerHeight={mw} refX={refX} refY="2" orient="auto" viewBox={markerViewBox}>
                    <path d="M0,0 L0,4 L4,2 z" fill="#333333" />
                  </marker>
                </React.Fragment>
              );
            })}
        </defs>
        {arrows.map(arrow => {
            const isDragging = dragState?.id === arrow.id;
            const isSelected = selectedArrowId === arrow.id;
            const midX = (arrow.startX + arrow.endX) / 2;
            const midY = (arrow.startY + arrow.endY) / 2;
            const arrowScale = typeof arrow.size === 'number' && arrow.size > 0 ? arrow.size : 1;
            const strokeW = arrowStrokeWidthBase * arrowScale;

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
                        strokeWidth={strokeW}
                        strokeDasharray={arrow.style === 'dashed' ? '2 1.5' : undefined}
                        markerEnd={isDragging ? `url(#arrowhead-hover-${arrow.id})` : `url(#arrowhead-${arrow.id})`}
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

      {/* --- GOALS LAYER --- */}
      {goals.map((goal) => (
         <div
            key={goal.id}
            className="absolute cursor-move z-10 group"
            style={{
              left: `${goal.x}%`,
              top: `${goal.y}%`,
              transform: `translate(-50%, -50%) rotate(${goal.rotation ?? 0}deg) scale(${scaleVal(goal.size)})`,
            }}
            onMouseDown={(e) => handleEquipmentMouseDown(e, 'goal', goal.id)}
            onClick={(e) => { e.stopPropagation(); onElementClick?.('goal', goal.id); }}
         >
             <div className="w-16 h-10 rounded-sm border-2 border-slate-300 shadow-lg flex items-center justify-center bg-transparent">
               <div
                 className="w-full h-full border-2 border-slate-400/60 rounded-sm m-0.5 bg-transparent"
                 style={{
                   backgroundImage: 'linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)',
                   backgroundSize: '4px 4px',
                   backgroundPosition: '0 0, 0 2px, 2px -2px, -2px 0px',
                 }}
               />
             </div>
             {!isExport && onGoalRemove && (
                 <div 
                     className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-40 hover:bg-red-600"
                     onClick={(e) => { e.stopPropagation(); onGoalRemove(goal.id); }}
                     title="Remove Goal"
                 >
                     <X size={8} className="text-white" />
                 </div>
             )}
         </div>
      ))}

      {/* --- SMALL GOALS LAYER --- */}
      {smallGoals.map((sg) => (
         <div
            key={sg.id}
            className="absolute cursor-move z-10 group"
            style={{
              left: `${sg.x}%`,
              top: `${sg.y}%`,
              transform: `translate(-50%, -50%) rotate(${sg.rotation ?? 0}deg) scale(${scaleVal(sg.size)})`,
            }}
            onMouseDown={(e) => handleEquipmentMouseDown(e, 'smallGoal', sg.id)}
            onClick={(e) => { e.stopPropagation(); onElementClick?.('smallGoal', sg.id); }}
         >
             <div className="w-10 h-6 rounded border-2 border-slate-300 shadow-md flex items-center justify-center bg-transparent">
               <div
                 className="w-full h-full border border-slate-400/60 rounded m-0.5 bg-transparent"
                 style={{
                   backgroundImage: 'linear-gradient(45deg, #94a3b8 25%, transparent 25%), linear-gradient(-45deg, #94a3b8 25%, transparent 25%)',
                   backgroundSize: '3px 3px',
                 }}
               />
             </div>
             {!isExport && onSmallGoalRemove && (
                 <div 
                     className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-40 hover:bg-red-600"
                     onClick={(e) => { e.stopPropagation(); onSmallGoalRemove(sg.id); }}
                     title="Remove Small Goal"
                 >
                     <X size={6} className="text-white" />
                 </div>
             )}
         </div>
      ))}

      {/* --- CONES (coaching equipment) --- */}
      {cones.map((c) => (
        <div key={c.id} className="absolute cursor-move z-10 group" style={{ left: `${c.x}%`, top: `${c.y}%`, transform: `translate(-50%, -50%) scale(${scaleVal(c.size)})` }} draggable={!isExport} onDragStart={(e) => handleConeDragStart(e, c.id)} onClick={(e) => { e.stopPropagation(); onElementClick?.('cone', c.id); }}>
          <div className="w-4 h-5 bg-amber-400 border border-amber-600 shadow-md" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }} />
          {!isExport && onConeRemove && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity z-40 hover:bg-red-600" onClick={(e) => { e.stopPropagation(); onConeRemove(c.id); }} title="Remove cone"><X size={6} className="text-white" /></div>
          )}
        </div>
      ))}

      {/* --- MANNEQUINS --- */}
      {mannequins.map((m) => (
        <div key={m.id} className="absolute cursor-move z-10 group" style={{ left: `${m.x}%`, top: `${m.y}%`, transform: `translate(-50%, -50%) scale(${scaleVal(m.size)})` }} draggable={!isExport} onDragStart={(e) => handleMannequinDragStart(e, m.id)} onClick={(e) => { e.stopPropagation(); onElementClick?.('mannequin', m.id); }}>
          <div className="w-5 h-8 rounded-sm bg-slate-600 border-2 border-slate-500 shadow-lg flex flex-col items-center justify-end pb-0.5">
            <div className="w-4 h-3 rounded-full bg-slate-500 -mb-1" />
            <div className="w-3 h-4 bg-slate-500 rounded-sm" />
          </div>
          {!isExport && onMannequinRemove && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity z-40 hover:bg-red-600" onClick={(e) => { e.stopPropagation(); onMannequinRemove(m.id); }} title="Remove mannequin"><X size={6} className="text-white" /></div>
          )}
        </div>
      ))}

      {/* --- GATES (passing gates) --- */}
      {gates.map((g) => (
        <div
          key={g.id}
          className="absolute cursor-move z-10 group"
          style={{ left: `${g.x}%`, top: `${g.y}%`, transform: `translate(-50%, -50%) scale(${scaleVal(g.size)})` }}
          onMouseDown={(e) => handleEquipmentMouseDown(e, 'gate', g.id)}
          onClick={(e) => { e.stopPropagation(); onElementClick?.('gate', g.id); }}
        >
          <div
            className="relative"
            style={{ transform: `rotate(${g.rotation ?? 0}deg)` }}
          >
          <div className="flex items-center justify-center gap-1">
            <div className="w-1.5 h-8 bg-white border border-slate-300 rounded shadow" />
            <div className="w-2 h-1 bg-transparent" />
            <div className="w-1.5 h-8 bg-white border border-slate-300 rounded shadow" />
          </div>
          </div>
          {!isExport && onGateRemove && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity z-40 hover:bg-red-600" onClick={(e) => { e.stopPropagation(); onGateRemove(g.id); }} title="Remove gate"><X size={6} className="text-white" /></div>
          )}
        </div>
      ))}

      {/* --- POLES --- */}
      {poles.map((p) => (
        <div key={p.id} className="absolute cursor-move z-10 group" style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `translate(-50%, -50%) scale(${scaleVal(p.size)})` }} draggable={!isExport} onDragStart={(e) => handlePoleDragStart(e, p.id)} onClick={(e) => { e.stopPropagation(); onElementClick?.('pole', p.id); }}>
          <div className="w-1.5 h-6 bg-white border border-slate-300 rounded shadow" />
          {!isExport && onPoleRemove && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity z-40 hover:bg-red-600" onClick={(e) => { e.stopPropagation(); onPoleRemove(p.id); }} title="Remove pole"><X size={6} className="text-white" /></div>
          )}
        </div>
      ))}

      {/* --- LADDERS (agility ladder) --- */}
      {ladders.map((l) => (
        <div
          key={l.id}
          className="absolute cursor-move z-10 group"
          style={{
            left: `${l.x}%`,
            top: `${l.y}%`,
            transform: `translate(-50%, -50%) scale(${scaleVal(l.size)})`,
          }}
          onMouseDown={(e) => handleEquipmentMouseDown(e, 'ladder', l.id)}
          onClick={(e) => { e.stopPropagation(); onElementClick?.('ladder', l.id); }}
        >
          <div
            className="w-12 h-3 flex gap-0.5"
            style={{ transform: `rotate(${l.rotation ?? 0}deg)` }}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-2 h-2.5 border-2 border-yellow-600 bg-yellow-400 rounded-sm" />
            ))}
          </div>
          {!isExport && onLadderRemove && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity z-40 hover:bg-red-600" onClick={(e) => { e.stopPropagation(); onLadderRemove(l.id); }} title="Remove ladder"><X size={6} className="text-white" /></div>
          )}
        </div>
      ))}

      {/* --- PLACED PLAYERS (click-to-place, no number) --- */}
      {placedPlayers.map((p) => (
        <div
          key={p.id}
          className="absolute cursor-move z-10 group"
          style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `translate(-50%, -50%) scale(${scaleVal(p.size)})` }}
          draggable={!isExport}
          onDragStart={(e) => handlePlacedPlayerDragStart(e, p.id)}
          onClick={(e) => { e.stopPropagation(); onElementClick?.('placedPlayer', p.id); }}
        >
          <div
            className="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
            style={{ backgroundColor: p.color }}
          />
          {!isExport && onPlacedPlayerRemove && (
            <div
              className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity z-40 hover:bg-red-600"
              onClick={(e) => { e.stopPropagation(); onPlacedPlayerRemove(p.id); }}
              title="Remove player"
            >
              <X size={6} className="text-white" />
            </div>
          )}
        </div>
      ))}

      {/* --- MULTI BALLS (Drills) --- */}
      {balls.map((b) => (
        <div
          key={b.id}
          className="absolute cursor-move z-30 group"
          style={{ left: `${b.x}%`, top: `${b.y}%`, transform: `translate(-50%, -50%) scale(${scaleVal(b.size)})` }}
          draggable={!isExport}
          onDragStart={(e) => { e.dataTransfer.setData('type', 'ball-multi'); e.dataTransfer.setData('ballId', b.id); e.stopPropagation(); }}
          onClick={(e) => { e.stopPropagation(); onElementClick?.('ball', b.id); }}
        >
          <div className="text-xl drop-shadow-md hover:scale-110 transition-transform">⚽</div>
          {!isExport && onBallRemoveById && (
            <div 
              className="absolute -top-3 -right-3 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-40 hover:bg-red-600"
              onClick={(e) => { e.stopPropagation(); onBallRemoveById(b.id); }}
              title="Remove ball"
            >
              <X size={8} className="text-white" />
            </div>
          )}
        </div>
      ))}

      {/* --- LEGACY SINGLE BALL (Set Pieces etc.) --- */}
      {ballPosition && (
        <div
          className="absolute cursor-move z-30 group"
          style={{ left: `${ballPosition.x}%`, top: `${ballPosition.y}%`, transform: `translate(-50%, -50%) scale(${scaleVal(ballPosition.size)})` }}
          draggable={!isExport}
          onDragStart={(e) => { e.dataTransfer.setData('type', 'ball'); e.stopPropagation(); }}
          onClick={(e) => { e.stopPropagation(); onElementClick?.('ball'); }}
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