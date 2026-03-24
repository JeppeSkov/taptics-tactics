
import React, { useState, useEffect, useRef } from 'react';
import { LineupBuilder } from './LineupBuilder';
import { Home } from './components/Home';
import { Articles } from './components/Articles';
import { SetPieces } from './components/SetPieces';
import { Drills } from './components/Drills';
import { MinutesLog } from './components/MinutesLog';
import { FAQ } from './components/FAQ';
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

type AppPage = 'home' | 'builder' | 'articles' | 'setpieces' | 'minutes' | 'drills' | 'faq';

export default function App() {
  const [page, setPage] = useState<AppPage>('home');
  const { user } = useAuth();
  const playersRef = useRef<Player[]>([]);
  /** Remember last screen before FAQ so the FAQ back arrow returns there (not always home). */
  const lastNonFaqPageRef = useRef<Exclude<AppPage, 'faq'>>('home');

  useEffect(() => {
    if (page !== 'faq') {
      lastNonFaqPageRef.current = page;
    }
  }, [page]);

  const [mobileNoticeDismissed, setMobileNoticeDismissed] = useState(false);
  const [showMobileOnlyNotice, setShowMobileOnlyNotice] = useState(false);
  const dismissMobileNoticeButtonRef = useRef<HTMLButtonElement | null>(null);

  const getIsMobileDevice = () => {
    // Width-based detection handles "tablet in browser" better than UA sniffing.
    // UA fallback covers cases where width reports desktop layout.
    const width = window.innerWidth;
    const ua = navigator.userAgent || '';
    const isSmallViewport = width < 768;
    const isMobileUa = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    return isSmallViewport || isMobileUa;
  };

  const dismissMobileNotice = () => {
    setShowMobileOnlyNotice(false);
    setMobileNoticeDismissed(true);
  };

  // Mobile-only notice for Builder page.
  useEffect(() => {
    // Reset dismissal whenever user leaves Builder so it appears again
    // next time they press "Start Building" on mobile.
    if (page !== 'builder') {
      setMobileNoticeDismissed(false);
      setShowMobileOnlyNotice(false);
    }
  }, [page]);

  useEffect(() => {
    if (page !== 'builder' || mobileNoticeDismissed) return;

    const checkMobile = () => {
      const isMobile = getIsMobileDevice();
      setShowMobileOnlyNotice(isMobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileNoticeDismissed, page]);

  useEffect(() => {
    if (!showMobileOnlyNotice) return;
    dismissMobileNoticeButtonRef.current?.focus();
  }, [showMobileOnlyNotice]);

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
      {showMobileOnlyNotice && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-only-notice-title"
            className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            tabIndex={-1}
            onKeyDown={(e) => {
              if (e.key === 'Escape') dismissMobileNotice();
            }}
          >
            <div className="p-6 text-center flex flex-col items-center gap-4">
              <div
                className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center"
                aria-hidden="true"
              >
                <span className="text-amber-400 text-2xl font-bold">!</span>
              </div>
              <h2 id="mobile-only-notice-title" className="text-xl font-bold text-white">
                This app only works on a computer
              </h2>
              <p className="text-slate-400 text-sm">
                The lineup/tactics editor is designed for desktop. On mobile, drag-and-drop and saving may not work correctly.
              </p>
            </div>

            <div className="p-4 bg-slate-800/50 border-t border-slate-700 flex justify-center">
              <button
                ref={dismissMobileNoticeButtonRef}
                onClick={dismissMobileNotice}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition-colors shadow-lg"
              >
                I understand
              </button>
            </div>
          </div>
        </div>
      )}
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
      {page === 'faq' && (
        <FAQ
          onBack={() => setPage(lastNonFaqPageRef.current)}
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
