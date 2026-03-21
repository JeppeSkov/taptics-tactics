
import { Player, TacticalSlot, Position } from './types';

export const STORAGE_KEY = 'taptics_save_v1';
export const MINUTES_STORAGE_KEY = 'taptics_minutes_v1';

export const FORMATIONS_11: Record<string, TacticalSlot[]> = {
  '4-4-2': [
    { id: 'GK', label: 'Goalkeeper', defaultRole: 'Defend', positionGroup: 'GK', x: 50, y: 88 },
    { id: 'DR', label: 'Full Back', defaultRole: 'Auto', positionGroup: 'DEF', x: 90, y: 70 },
    { id: 'DCR', label: 'Central Defender', defaultRole: 'Defend', positionGroup: 'DEF', x: 65, y: 75 },
    { id: 'DCL', label: 'Central Defender', defaultRole: 'Defend', positionGroup: 'DEF', x: 35, y: 75 },
    { id: 'DL', label: 'Full Back', defaultRole: 'Auto', positionGroup: 'DEF', x: 10, y: 70 },
    { id: 'MR', label: 'Winger', defaultRole: 'Attack', positionGroup: 'MID', x: 90, y: 45 },
    { id: 'MCR', label: 'Central Midfielder', defaultRole: 'Support', positionGroup: 'MID', x: 60, y: 50 },
    { id: 'MCL', label: 'Central Midfielder', defaultRole: 'Defend', positionGroup: 'MID', x: 40, y: 50 },
    { id: 'ML', label: 'Winger', defaultRole: 'Attack', positionGroup: 'MID', x: 10, y: 45 },
    { id: 'STCR', label: 'Target Man', defaultRole: 'Support', positionGroup: 'ATT', x: 60, y: 20 },
    { id: 'STCL', label: 'Poacher', defaultRole: 'Attack', positionGroup: 'ATT', x: 40, y: 20 },
  ],
  '4-3-3 DM': [
    { id: 'GK', label: 'Goalkeeper', defaultRole: 'Defend', positionGroup: 'GK', x: 50, y: 88 },
    { id: 'DR', label: 'Wing Back', defaultRole: 'Auto', positionGroup: 'DEF', x: 90, y: 70 },
    { id: 'DCR', label: 'Ball Playing Def', defaultRole: 'Defend', positionGroup: 'DEF', x: 65, y: 75 },
    { id: 'DCL', label: 'Central Defender', defaultRole: 'Defend', positionGroup: 'DEF', x: 35, y: 75 },
    { id: 'DL', label: 'Wing Back', defaultRole: 'Auto', positionGroup: 'DEF', x: 10, y: 70 },
    { id: 'DM', label: 'Defensive Mid', defaultRole: 'Defend', positionGroup: 'MID', x: 50, y: 60 },
    { id: 'MCR', label: 'Mezzala', defaultRole: 'Attack', positionGroup: 'MID', x: 70, y: 45 },
    { id: 'MCL', label: 'Carrilero', defaultRole: 'Support', positionGroup: 'MID', x: 30, y: 45 },
    { id: 'AMR', label: 'Inside Forward', defaultRole: 'Attack', positionGroup: 'ATT', x: 85, y: 20 },
    { id: 'AML', label: 'Inverted Winger', defaultRole: 'Support', positionGroup: 'ATT', x: 15, y: 20 },
    { id: 'ST', label: 'False Nine', defaultRole: 'Support', positionGroup: 'ATT', x: 50, y: 15 },
  ],
  '3-5-2': [
    { id: 'GK', label: 'Goalkeeper', defaultRole: 'Defend', positionGroup: 'GK', x: 50, y: 88 },
    { id: 'DCR', label: 'Wide Center Back', defaultRole: 'Defend', positionGroup: 'DEF', x: 75, y: 75 },
    { id: 'DC', label: 'Libero', defaultRole: 'Support', positionGroup: 'DEF', x: 50, y: 80 },
    { id: 'DCL', label: 'Wide Center Back', defaultRole: 'Defend', positionGroup: 'DEF', x: 25, y: 75 },
    { id: 'WBR', label: 'Wing Back', defaultRole: 'Attack', positionGroup: 'MID', x: 90, y: 50 },
    { id: 'WBL', label: 'Wing Back', defaultRole: 'Attack', positionGroup: 'MID', x: 10, y: 50 },
    { id: 'DM', label: 'Regista', defaultRole: 'Support', positionGroup: 'MID', x: 50, y: 60 },
    { id: 'MCR', label: 'Box To Box', defaultRole: 'Support', positionGroup: 'MID', x: 65, y: 45 },
    { id: 'MCL', label: 'Adv Playmaker', defaultRole: 'Attack', positionGroup: 'MID', x: 35, y: 45 },
    { id: 'STCR', label: 'Adv Forward', defaultRole: 'Attack', positionGroup: 'ATT', x: 60, y: 15 },
    { id: 'STCL', label: 'Deep Lying Fwd', defaultRole: 'Support', positionGroup: 'ATT', x: 40, y: 15 },
  ],
  '3-4-3': [
    { id: 'GK', label: 'Goalkeeper', defaultRole: 'Defend', positionGroup: 'GK', x: 50, y: 88 },
    { id: 'DCR', label: 'Central Defender', defaultRole: 'Defend', positionGroup: 'DEF', x: 75, y: 75 },
    { id: 'DC', label: 'Central Defender', defaultRole: 'Cover', positionGroup: 'DEF', x: 50, y: 75 },
    { id: 'DCL', label: 'Central Defender', defaultRole: 'Defend', positionGroup: 'DEF', x: 25, y: 75 },
    { id: 'MR', label: 'Wide Midfielder', defaultRole: 'Attack', positionGroup: 'MID', x: 90, y: 50 },
    { id: 'MCR', label: 'Central Midfielder', defaultRole: 'Support', positionGroup: 'MID', x: 60, y: 50 },
    { id: 'MCL', label: 'Central Midfielder', defaultRole: 'Support', positionGroup: 'MID', x: 40, y: 50 },
    { id: 'ML', label: 'Wide Midfielder', defaultRole: 'Attack', positionGroup: 'MID', x: 10, y: 50 },
    { id: 'AMR', label: 'Inside Forward', defaultRole: 'Attack', positionGroup: 'ATT', x: 80, y: 25 },
    { id: 'AML', label: 'Inside Forward', defaultRole: 'Attack', positionGroup: 'ATT', x: 20, y: 25 },
    { id: 'ST', label: 'Advanced Forward', defaultRole: 'Attack', positionGroup: 'ATT', x: 50, y: 15 },
  ]
};

export const FORMATIONS_8: Record<string, TacticalSlot[]> = {
  '3-3-1': [
    { id: 'GK', label: 'Goalkeeper', defaultRole: 'Defend', positionGroup: 'GK', x: 50, y: 88 },
    { id: 'DCR', label: 'Defender', defaultRole: 'Defend', positionGroup: 'DEF', x: 80, y: 75 },
    { id: 'DC', label: 'Defender', defaultRole: 'Cover', positionGroup: 'DEF', x: 50, y: 80 },
    { id: 'DCL', label: 'Defender', defaultRole: 'Defend', positionGroup: 'DEF', x: 20, y: 75 },
    { id: 'MCR', label: 'Midfielder', defaultRole: 'Support', positionGroup: 'MID', x: 75, y: 45 },
    { id: 'MC', label: 'Midfielder', defaultRole: 'Support', positionGroup: 'MID', x: 50, y: 50 },
    { id: 'MCL', label: 'Midfielder', defaultRole: 'Support', positionGroup: 'MID', x: 25, y: 45 },
    { id: 'ST', label: 'Striker', defaultRole: 'Attack', positionGroup: 'ATT', x: 50, y: 15 },
  ],
  '2-4-1': [
    { id: 'GK', label: 'Goalkeeper', defaultRole: 'Defend', positionGroup: 'GK', x: 50, y: 88 },
    { id: 'DCR', label: 'Defender', defaultRole: 'Defend', positionGroup: 'DEF', x: 70, y: 75 },
    { id: 'DCL', label: 'Defender', defaultRole: 'Defend', positionGroup: 'DEF', x: 30, y: 75 },
    { id: 'MR', label: 'Wide Mid', defaultRole: 'Attack', positionGroup: 'MID', x: 90, y: 45 },
    { id: 'MCR', label: 'Center Mid', defaultRole: 'Support', positionGroup: 'MID', x: 60, y: 50 },
    { id: 'MCL', label: 'Center Mid', defaultRole: 'Support', positionGroup: 'MID', x: 40, y: 50 },
    { id: 'ML', label: 'Wide Mid', defaultRole: 'Attack', positionGroup: 'MID', x: 10, y: 45 },
    { id: 'ST', label: 'Striker', defaultRole: 'Attack', positionGroup: 'ATT', x: 50, y: 15 },
  ],
  '3-2-2': [
    { id: 'GK', label: 'Goalkeeper', defaultRole: 'Defend', positionGroup: 'GK', x: 50, y: 88 },
    { id: 'DCR', label: 'Defender', defaultRole: 'Defend', positionGroup: 'DEF', x: 80, y: 75 },
    { id: 'DC', label: 'Defender', defaultRole: 'Cover', positionGroup: 'DEF', x: 50, y: 80 },
    { id: 'DCL', label: 'Defender', defaultRole: 'Defend', positionGroup: 'DEF', x: 20, y: 75 },
    { id: 'MCR', label: 'Midfielder', defaultRole: 'Support', positionGroup: 'MID', x: 65, y: 50 },
    { id: 'MCL', label: 'Midfielder', defaultRole: 'Support', positionGroup: 'MID', x: 35, y: 50 },
    { id: 'STR', label: 'Striker', defaultRole: 'Attack', positionGroup: 'ATT', x: 65, y: 20 },
    { id: 'STL', label: 'Striker', defaultRole: 'Attack', positionGroup: 'ATT', x: 35, y: 20 },
  ],
  '2-3-2': [
    { id: 'GK', label: 'Goalkeeper', defaultRole: 'Defend', positionGroup: 'GK', x: 50, y: 88 },
    { id: 'DCR', label: 'Defender', defaultRole: 'Defend', positionGroup: 'DEF', x: 70, y: 75 },
    { id: 'DCL', label: 'Defender', defaultRole: 'Defend', positionGroup: 'DEF', x: 30, y: 75 },
    { id: 'MR', label: 'Wide Mid', defaultRole: 'Attack', positionGroup: 'MID', x: 85, y: 45 },
    { id: 'MC', label: 'Center Mid', defaultRole: 'Support', positionGroup: 'MID', x: 50, y: 50 },
    { id: 'ML', label: 'Wide Mid', defaultRole: 'Attack', positionGroup: 'MID', x: 15, y: 45 },
    { id: 'STR', label: 'Striker', defaultRole: 'Attack', positionGroup: 'ATT', x: 65, y: 20 },
    { id: 'STL', label: 'Striker', defaultRole: 'Attack', positionGroup: 'ATT', x: 35, y: 20 },
  ],
};

export const FORMATIONS_9: Record<string, TacticalSlot[]> = {
  '3-3-2': [
    { id: 'GK', label: 'Goalkeeper', defaultRole: 'Defend', positionGroup: 'GK', x: 50, y: 88 },
    { id: 'DCR', label: 'Defender', defaultRole: 'Defend', positionGroup: 'DEF', x: 80, y: 74 },
    { id: 'DC', label: 'Defender', defaultRole: 'Cover', positionGroup: 'DEF', x: 50, y: 78 },
    { id: 'DCL', label: 'Defender', defaultRole: 'Defend', positionGroup: 'DEF', x: 20, y: 74 },
    { id: 'MCR', label: 'Midfielder', defaultRole: 'Support', positionGroup: 'MID', x: 72, y: 48 },
    { id: 'MC', label: 'Midfielder', defaultRole: 'Support', positionGroup: 'MID', x: 50, y: 52 },
    { id: 'MCL', label: 'Midfielder', defaultRole: 'Support', positionGroup: 'MID', x: 28, y: 48 },
    { id: 'STR', label: 'Striker', defaultRole: 'Attack', positionGroup: 'ATT', x: 62, y: 20 },
    { id: 'STL', label: 'Striker', defaultRole: 'Attack', positionGroup: 'ATT', x: 38, y: 20 },
  ],
  '2-4-2': [
    { id: 'GK', label: 'Goalkeeper', defaultRole: 'Defend', positionGroup: 'GK', x: 50, y: 88 },
    { id: 'DCR', label: 'Defender', defaultRole: 'Defend', positionGroup: 'DEF', x: 70, y: 74 },
    { id: 'DCL', label: 'Defender', defaultRole: 'Defend', positionGroup: 'DEF', x: 30, y: 74 },
    { id: 'MR', label: 'Wide Mid', defaultRole: 'Attack', positionGroup: 'MID', x: 88, y: 46 },
    { id: 'MCR', label: 'Center Mid', defaultRole: 'Support', positionGroup: 'MID', x: 62, y: 50 },
    { id: 'MCL', label: 'Center Mid', defaultRole: 'Support', positionGroup: 'MID', x: 38, y: 50 },
    { id: 'ML', label: 'Wide Mid', defaultRole: 'Attack', positionGroup: 'MID', x: 12, y: 46 },
    { id: 'STR', label: 'Striker', defaultRole: 'Attack', positionGroup: 'ATT', x: 62, y: 20 },
    { id: 'STL', label: 'Striker', defaultRole: 'Attack', positionGroup: 'ATT', x: 38, y: 20 },
  ],
  '3-4-1': [
    { id: 'GK', label: 'Goalkeeper', defaultRole: 'Defend', positionGroup: 'GK', x: 50, y: 88 },
    { id: 'DCR', label: 'Defender', defaultRole: 'Defend', positionGroup: 'DEF', x: 78, y: 74 },
    { id: 'DC', label: 'Defender', defaultRole: 'Cover', positionGroup: 'DEF', x: 50, y: 78 },
    { id: 'DCL', label: 'Defender', defaultRole: 'Defend', positionGroup: 'DEF', x: 22, y: 74 },
    { id: 'MR', label: 'Wide Mid', defaultRole: 'Attack', positionGroup: 'MID', x: 88, y: 46 },
    { id: 'MCR', label: 'Center Mid', defaultRole: 'Support', positionGroup: 'MID', x: 62, y: 50 },
    { id: 'MCL', label: 'Center Mid', defaultRole: 'Support', positionGroup: 'MID', x: 38, y: 50 },
    { id: 'ML', label: 'Wide Mid', defaultRole: 'Attack', positionGroup: 'MID', x: 12, y: 46 },
    { id: 'ST', label: 'Striker', defaultRole: 'Attack', positionGroup: 'ATT', x: 50, y: 20 },
  ],
};

export const FORMATIONS_7: Record<string, TacticalSlot[]> = {
  '2-3-1': [
    { id: 'GK', label: 'Goalkeeper', defaultRole: 'Defend', positionGroup: 'GK', x: 50, y: 88 },
    { id: 'DCR', label: 'Defender', defaultRole: 'Defend', positionGroup: 'DEF', x: 70, y: 75 },
    { id: 'DCL', label: 'Defender', defaultRole: 'Defend', positionGroup: 'DEF', x: 30, y: 75 },
    { id: 'MR', label: 'Wide Mid', defaultRole: 'Support', positionGroup: 'MID', x: 80, y: 50 },
    { id: 'MC', label: 'Center Mid', defaultRole: 'Support', positionGroup: 'MID', x: 50, y: 50 },
    { id: 'ML', label: 'Wide Mid', defaultRole: 'Support', positionGroup: 'MID', x: 20, y: 50 },
    { id: 'ST', label: 'Striker', defaultRole: 'Attack', positionGroup: 'ATT', x: 50, y: 18 },
  ],
  '3-2-1': [
    { id: 'GK', label: 'Goalkeeper', defaultRole: 'Defend', positionGroup: 'GK', x: 50, y: 88 },
    { id: 'DCR', label: 'Defender', defaultRole: 'Defend', positionGroup: 'DEF', x: 75, y: 75 },
    { id: 'DC', label: 'Defender', defaultRole: 'Cover', positionGroup: 'DEF', x: 50, y: 80 },
    { id: 'DCL', label: 'Defender', defaultRole: 'Defend', positionGroup: 'DEF', x: 25, y: 75 },
    { id: 'MCR', label: 'Midfielder', defaultRole: 'Support', positionGroup: 'MID', x: 65, y: 50 },
    { id: 'MCL', label: 'Midfielder', defaultRole: 'Support', positionGroup: 'MID', x: 35, y: 50 },
    { id: 'ST', label: 'Striker', defaultRole: 'Attack', positionGroup: 'ATT', x: 50, y: 18 },
  ],
};

// Combine for backward compatibility if needed, but primarily use the separated exports
export const FORMATIONS = { ...FORMATIONS_11, ...FORMATIONS_9, ...FORMATIONS_8, ...FORMATIONS_7 };

export const INITIAL_SLOTS: TacticalSlot[] = FORMATIONS['4-4-2'];

export const BENCH_SLOTS = Array.from({ length: 20 }, (_, i) => `S${i + 1}`);

export const MOCK_PLAYERS: Player[] = [
  // Starting XI (Matches Screenshot roughly)
  { id: 'p1', name: 'Petr Cech', number: 33, naturalPosition: 'GK', bestRole: 'Goalkeeper', condition: 100, sharpness: 64, roleFamiliarity: 10, roleAbility: 4, assignedSlot: 'GK', status: 'Ready' },
  { id: 'p2', name: 'Héctor Bellerín', number: 24, naturalPosition: 'D/WB (R)', bestRole: 'Full Back', condition: 100, sharpness: 61, roleFamiliarity: 9, roleAbility: 4, status: 'Ready', assignedSlot: 'DR' },
  { id: 'p3', name: 'Laurent Koscielny', number: 6, naturalPosition: 'D (C)', bestRole: 'Central Defender', condition: 100, sharpness: 61, roleFamiliarity: 10, roleAbility: 5, status: 'Injured', assignedSlot: 'DCR' },
  { id: 'p4', name: 'Shkodran Mustafi', number: 20, naturalPosition: 'D (C)', bestRole: 'Central Defender', condition: 100, sharpness: 61, roleFamiliarity: 10, roleAbility: 4, assignedSlot: 'DCL', status: 'Ready' },
  { id: 'p5', name: 'Sead Kolasinac', number: 31, naturalPosition: 'D/WB (L)', bestRole: 'Full Back', condition: 100, sharpness: 60, roleFamiliarity: 8, roleAbility: 4, assignedSlot: 'DL', status: 'Ready' },
  { id: 'p6', name: 'Theo Walcott', number: 14, naturalPosition: 'AM (R), ST (C)', bestRole: 'Winger', condition: 100, sharpness: 59, roleFamiliarity: 7, roleAbility: 3.5, assignedSlot: 'MR', status: 'Ready' },
  { id: 'p7', name: 'Francis Coquelin', number: 34, naturalPosition: 'DM, M (C)', bestRole: 'Ball Winning Mid', condition: 100, sharpness: 61, roleFamiliarity: 9, roleAbility: 4, assignedSlot: 'MCR', status: 'Ready' },
  { id: 'p8', name: 'Granit Xhaka', number: 29, naturalPosition: 'DM, M (C)', bestRole: 'Deep Lying Playmaker', condition: 100, sharpness: 59, roleFamiliarity: 9, roleAbility: 4.5, assignedSlot: 'MCL', status: 'Ready' },
  { id: 'p9', name: 'Alex Iwobi', number: 17, naturalPosition: 'AM (RLC)', bestRole: 'Inverted Winger', condition: 100, sharpness: 60, roleFamiliarity: 8, roleAbility: 4, assignedSlot: 'ML', status: 'Ready' },
  { id: 'p10', name: 'Alexis Sánchez', number: 7, naturalPosition: 'AM (RLC), ST (C)', bestRole: 'Complete Forward', condition: 100, sharpness: 62, roleFamiliarity: 10, roleAbility: 5, status: 'Ready', assignedSlot: 'STCR' },
  { id: 'p11', name: 'Alexandre Lacazette', number: 9, naturalPosition: 'AM (R), ST (C)', bestRole: 'Advanced Forward', condition: 100, sharpness: 61, roleFamiliarity: 10, roleAbility: 4.5, assignedSlot: 'STCL', status: 'Ready' },

  // Subs
  { id: 'p12', name: 'David Ospina', number: 13, naturalPosition: 'GK', bestRole: 'Goalkeeper', condition: 100, sharpness: 60, roleFamiliarity: 10, roleAbility: 3.5, assignedSlot: 'S1', status: 'Ready' },
  { id: 'p13', name: 'Calum Chambers', number: 21, naturalPosition: 'D (RC)', bestRole: 'Central Defender', condition: 95, sharpness: 58, roleFamiliarity: 8, roleAbility: 3, status: 'Injured', assignedSlot: 'S2' },
  { id: 'p14', name: 'Danny Welbeck', number: 23, naturalPosition: 'AM (RL), ST (C)', bestRole: 'Inside Forward', condition: 100, sharpness: 60, roleFamiliarity: 8, roleAbility: 3.5, assignedSlot: 'S3', status: 'Ready' },
  { id: 'p15', name: 'Mesut Özil', number: 11, naturalPosition: 'AM (RLC)', bestRole: 'Advanced Playmaker', condition: 100, sharpness: 60, roleFamiliarity: 10, roleAbility: 5, assignedSlot: 'S4', status: 'Ready' },
  { id: 'p16', name: 'Per Mertesacker', number: 4, naturalPosition: 'D (C)', bestRole: 'Central Defender', condition: 100, sharpness: 62, roleFamiliarity: 10, roleAbility: 3, status: 'Ready', assignedSlot: 'S5' },
  { id: 'p17', name: 'Aaron Ramsey', number: 8, naturalPosition: 'M (C), AM (RC)', bestRole: 'Box To Box', condition: 100, sharpness: 62, roleFamiliarity: 9, roleAbility: 4.5, assignedSlot: 'S6', status: 'Ready' },
  { id: 'p18', name: 'Olivier Giroud', number: 12, naturalPosition: 'ST (C)', bestRole: 'Target Man', condition: 100, sharpness: 61, roleFamiliarity: 10, roleAbility: 4, assignedSlot: 'S7', status: 'Ready' },
  { id: 'p19', name: 'Nacho Monreal', number: 18, naturalPosition: 'D (LC), WB (L)', bestRole: 'Full Back', condition: 100, sharpness: 60, roleFamiliarity: 9, roleAbility: 4, assignedSlot: 'S8', status: 'Ready' },
  { id: 'p20', name: 'Mohamed Elneny', number: 35, naturalPosition: 'DM, M (C)', bestRole: 'Ball Winning Mid', condition: 100, sharpness: 62, roleFamiliarity: 8, roleAbility: 3.5, status: 'Ready', assignedSlot: 'S9' },
  { id: 'p21', name: 'Mathieu Debuchy', number: 2, naturalPosition: 'D/WB (R)', bestRole: 'Full Back', condition: 100, sharpness: 59, roleFamiliarity: 8, roleAbility: 3, assignedSlot: 'S10', status: 'Ready' },
  { id: 'p22', name: 'Rob Holding', number: 16, naturalPosition: 'D (C)', bestRole: 'Central Defender', condition: 100, sharpness: 59, roleFamiliarity: 7, roleAbility: 3, status: 'Ready', assignedSlot: 'S11' },
];
