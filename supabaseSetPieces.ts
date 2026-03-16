import { supabase } from './supabaseClient';

const TABLE_NAME = 'set_pieces';

/**
 * Same shape as the set pieces blob in localStorage:
 * setPiecesData, setPiecesCurrentScenario, setPiecesKitColor, savedRoutines
 */
export interface SetPiecesPayload {
  setPiecesData: Record<string, unknown>;
  setPiecesCurrentScenario: string;
  setPiecesKitColor: { name: string; hex: string; text: string };
  savedRoutines: unknown[];
}

export async function fetchSetPiecesForUser(userId: string): Promise<SetPiecesPayload | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[Supabase] Failed to fetch set pieces:', error.message);
    return null;
  }

  if (!data?.data) return null;

  const payload = data.data as SetPiecesPayload;
  if (!payload.setPiecesData || typeof payload.setPiecesData !== 'object') return null;

  return {
    setPiecesData: payload.setPiecesData,
    setPiecesCurrentScenario: payload.setPiecesCurrentScenario ?? 'offensive',
    setPiecesKitColor: payload.setPiecesKitColor ?? { name: 'Red', hex: '#b91c1c', text: 'white' },
    savedRoutines: Array.isArray(payload.savedRoutines) ? payload.savedRoutines : [],
  };
}

export async function saveSetPiecesForUser(userId: string, payload: SetPiecesPayload): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert(
      { user_id: userId, data: payload as unknown as object },
      { onConflict: 'user_id' }
    );

  if (error) {
    console.error('[Supabase] Failed to save set pieces:', error.message);
    throw error;
  }
}
