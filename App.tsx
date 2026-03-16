
import React, { useState, useEffect, useRef } from 'react';
import { LineupBuilder } from './LineupBuilder';
import { Home } from './components/Home';
import { Articles } from './components/Articles';
import { SetPieces } from './components/SetPieces';
import { Drills } from './components/Drills';
import { MinutesLog } from './components/MinutesLog';
import { Player } from './types';
import { MOCK_PLAYERS, STORAGE_KEY } from './constants';
import { useAuth } from './supabaseAuth';
import { fetchPlayersForUser, savePlayersForUser } from './supabasePlayers';

// Add type definition for Google Analytics
declare global {
  interface Window {
    gtag?: (command: string, action: string, params?: any) => void;
  }
}

export default function App() {
  const [page, setPage] = useState<'home' | 'builder' | 'articles' | 'setpieces' | 'minutes' | 'drills'>('home');
  const { user } = useAuth();
  const playersRef = useRef<Player[]>([]);

  // --- Global Players State ---
  // We initialize from localStorage if available, otherwise use mocks.
  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure we strictly return the players array if it exists
        if (Array.isArray(parsed.players)) {
           return parsed.players;
        }
      }
    } catch (e) {
      console.error("Failed to load players from storage", e);
    }
    return MOCK_PLAYERS;
  });

  playersRef.current = players;

  // Handle Global Persistence for Player Updates
  // Note: LineupBuilder also writes to STORAGE_KEY, but it includes other data (drafts, formations).
  // When SetPieces is active, LineupBuilder is unmounted, so we must handle saving players here.
  // When LineupBuilder is active, it will handle saving players as part of its full state save.
  // To avoid conflict, we only strictly save from App when SetPieces modifies players, OR 
  // we rely on the fact that we pass the state setter down.
  //
  // SAFEST APPROACH: Read-Modify-Write whenever players update.
  const handleUpdatePlayers = (newPlayers: Player[] | ((prev: Player[]) => Player[])) => {
    setPlayers(prevPlayers => {
      const resolvedPlayers = typeof newPlayers === 'function' ? newPlayers(prevPlayers) : newPlayers;

      // Local persistence
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : {};
        const newState = { ...parsed, players: resolvedPlayers };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      } catch (e) {
        console.error("Failed to save players update", e);
      }

      // Remote persistence (Supabase) for logged-in users
      if (user?.id) {
        savePlayersForUser(user.id, resolvedPlayers).catch(err => {
          // eslint-disable-next-line no-console
          console.error('[Supabase] Failed to sync players after update:', err);
        });
      }

      return resolvedPlayers;
    });
  };

  // When a user logs in: load players from Supabase, or push local players to Supabase if remote is empty
  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;
    (async () => {
      const remotePlayers = await fetchPlayersForUser(user.id);

      if (cancelled) return;

      if (remotePlayers.length > 0) {
        setPlayers(remotePlayers);
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          const parsed = saved ? JSON.parse(saved) : {};
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, players: remotePlayers }));
        } catch (e) {
          console.error('Failed to cache remote players locally', e);
        }
        return;
      }

      // Remote is empty: push current local players so the table gets populated
      const localPlayers = playersRef.current;
      if (localPlayers.length > 0) {
        savePlayersForUser(user.id, localPlayers).catch((err) => {
          console.error('[Supabase] Initial sync failed:', err?.message ?? err);
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    // If sharing link, go straight to the relevant tool
    const params = new URLSearchParams(window.location.search);
    if (params.get('data')) {
      setPage('builder');
    } else if (params.get('sp_data')) {
      setPage('setpieces');
    } else if (params.get('ts_data')) {
      setPage('drills');
    }
  }, []);

  // --- Google Analytics Tracking ---
  useEffect(() => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_title: page.charAt(0).toUpperCase() + page.slice(1),
        page_location: window.location.origin + '/' + page
      });
    }
  }, [page]);

  return (
    <>
      {page === 'home' && (
        <Home 
            onStart={() => setPage('builder')} 
            onNavigate={(p) => setPage(p)}
        />
      )}
      {page === 'builder' && (
        <LineupBuilder 
            onNavigate={(p) => setPage(p)} 
            globalPlayers={players}
            onGlobalPlayersUpdate={handleUpdatePlayers}
        />
      )}
      {page === 'articles' && (
        <Articles 
            onBack={() => setPage('home')} 
            onNavigate={(p) => setPage(p)}
        />
      )}
      {page === 'setpieces' && (
        <SetPieces 
            onNavigate={(p) => setPage(p)} 
            players={players}
            setPlayers={handleUpdatePlayers}
        />
      )}
      {page === 'drills' && (
        <Drills 
            onNavigate={(p) => setPage(p)} 
            players={players}
            setPlayers={handleUpdatePlayers}
        />
      )}
      {page === 'minutes' && (
        <MinutesLog 
            onNavigate={(p) => setPage(p)} 
            players={players}
        />
      )}
    </>
  );
}
