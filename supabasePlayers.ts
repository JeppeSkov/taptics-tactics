import { supabase } from './supabaseClient';
import type { Player } from './types';

const TABLE_NAME = 'players';

type PlayerRow = {
  id: string;
  user_id: string;
  name: string;
  number: number | null;
  natural_position: string | null;
  best_role: string | null;
  condition: number | null;
  sharpness: number | null;
  role_familiarity: number | null;
  role_ability: number | null;
  status: string | null;
  assigned_slot: string | null;
};

export async function fetchPlayersForUser(userId: string): Promise<Player[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('user_id', userId)
    .order('number', { ascending: true }) as { data: PlayerRow[] | null; error: any };

  if (error) {
    // eslint-disable-next-line no-console
    console.error('[Supabase] Failed to fetch players:', error);
    return [];
  }

  if (!data) return [];

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    number: row.number ?? 0,
    naturalPosition: row.natural_position ?? '',
    bestRole: row.best_role ?? '',
    condition: row.condition ?? 100,
    sharpness: row.sharpness ?? 100,
    roleFamiliarity: row.role_familiarity ?? 0,
    roleAbility: row.role_ability ?? 0,
    status: row.status ?? undefined,
    assignedSlot: row.assigned_slot ?? null,
  }));
}

export async function savePlayersForUser(userId: string, players: Player[]): Promise<void> {
  if (!supabase) return;

  const rows = players.map<PlayerRow>((p) => ({
    user_id: userId,
    id: p.id,
    name: p.name,
    number: typeof p.number === 'number' ? p.number : null,
    natural_position: p.naturalPosition ?? null,
    best_role: p.bestRole ?? null,
    condition: typeof p.condition === 'number' ? p.condition : null,
    sharpness: typeof p.sharpness === 'number' ? p.sharpness : null,
    role_familiarity: typeof p.roleFamiliarity === 'number' ? p.roleFamiliarity : null,
    role_ability: typeof p.roleAbility === 'number' ? p.roleAbility : null,
    status: p.status ?? null,
    assigned_slot: p.assignedSlot ?? null,
  }));

  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert(rows, { onConflict: 'id,user_id' });

  if (error) {
    // eslint-disable-next-line no-console
    console.error('[Supabase] Failed to save players:', error.message, error.details, error.hint);
    throw error;
  }
  // eslint-disable-next-line no-console
  console.log('[Supabase] Players saved OK:', rows.length, 'rows');
}

