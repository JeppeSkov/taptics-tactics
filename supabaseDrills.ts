import { supabase } from './supabaseClient';

const TABLE_NAME = 'drills';

// Mirrors the drillsData blob we store in localStorage.
export interface DrillsPayload {
  viewMode: string;
  slots: any[];
  assignments: Record<string, string>;
  balls: any[];
  arrows: any[];
  goals: any[];
  smallGoals: any[];
  cones: any[];
  mannequins: any[];
  gates: any[];
  poles: any[];
  ladders: any[];
  placedPlayers: any[];
  playerToolColor: string;
  kitColor: { name: string; hex: string; text: string };
  description: string;
  savedDrills: any[];
  trainingSessions: any[];
}

export async function fetchDrillsForUser(userId: string): Promise<DrillsPayload | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[Supabase] Failed to fetch drills:', error.message);
    return null;
  }

  if (!data?.data) return null;

  return data.data as DrillsPayload;
}

export async function saveDrillsForUser(userId: string, payload: DrillsPayload): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert(
      { user_id: userId, data: payload as unknown as object },
      { onConflict: 'user_id' }
    );

  if (error) {
    console.error('[Supabase] Failed to save drills:', error.message);
    throw error;
  }
}

