
export enum Position {
  GK = 'GK',
  DR = 'DR',
  DL = 'DL',
  DC = 'DC',
  DCR = 'DCR',
  DCL = 'DCL',
  DM = 'DM',
  MC = 'MC',
  MCR = 'MCR',
  MCL = 'MCL',
  MR = 'MR',
  ML = 'ML',
  AMR = 'AMR',
  AML = 'AML',
  AMC = 'AMC',
  ST = 'ST',
  STCR = 'STCR',
  STCL = 'STCL',
  SUB = 'SUB',
  RES = 'RES'
}

export interface Player {
  id: string;
  name: string;
  number: number;
  naturalPosition: string; // Display string like "D (RC)"
  bestRole: string;
  condition: number; // 0-100
  sharpness: number; // 0-100
  roleFamiliarity: number; // 0-10 (used for the green circle)
  roleAbility: number; // 0-5 stars
  status?: string; // e.g., "Wnt", "Inj", "Bid"
  assignedSlot: string | null; // The ID of the slot they are currently in (e.g., "S1", "GK", "MCR")
}

export interface TacticalSlot {
  id: string;
  label: string; // The tactical position name (e.g. "GK", "Deep Lying Playmaker")
  defaultRole: string; // The specific instruction (e.g. "Defend")
  positionGroup: string; // GK, DEF, MID, ATT
  x: number; // Percentage 0-100 for pitch placement
  y: number; // Percentage 0-100 for pitch placement
}

export interface DragItem {
  playerId: string;
  sourceSlotId: string | null;
}

// Minutes Log Types
export type PositionCategory = 'GK' | 'CB' | 'FB' | 'WB' | 'DM' | 'CM' | 'AM' | 'W' | 'ST';

export interface PlayerMatchStats {
  GK: number;
  CB: number;
  FB: number;
  WB: number;
  DM: number;
  CM: number;
  AM: number;
  W: number;
  ST: number;
}

export interface MatchLog {
  id: string;
  seasonId?: string; // New field to group matches
  date: string;
  opponent: string;
  duration: number;
  playerStats: Record<string, PlayerMatchStats>; // Key is player.id
}
