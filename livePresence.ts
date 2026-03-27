import { useEffect, useMemo, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

type PresencePage = 'home' | 'builder' | 'articles' | 'setpieces' | 'minutes' | 'drills' | 'faq';

const PRESENCE_CHANNEL = 'taptics_live_presence_v2';
const SESSION_KEY = 'taptics_live_presence_session_v2';
const HEARTBEAT_MS = 15_000;
const TTL_MS = 90_000;

type PresenceEntry = { ts: number; page: PresencePage };
type PresenceMap = Record<string, PresenceEntry>;

let channelStarted = false;
let activeChannel: RealtimeChannel | null = null;
let heartbeatTimer: number | null = null;
let currentPage: PresencePage = 'home';
let sessionId = '';
let snapshot: PresenceMap = {};
const listeners = new Set<() => void>();

const getSessionId = () => {
  if (sessionId) return sessionId;
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) {
      sessionId = existing;
      return sessionId;
    }
    sessionId = `coach_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY, sessionId);
    return sessionId;
  } catch {
    sessionId = `coach_fallback_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    return sessionId;
  }
};

const notify = () => {
  listeners.forEach((fn) => fn());
};

const normalizePresenceState = (rawState: Record<string, Array<Record<string, unknown>>>): PresenceMap => {
  const now = Date.now();
  const next: PresenceMap = {};

  Object.entries(rawState).forEach(([key, metas]) => {
    const valid = metas
      .map((m) => ({
        ts: typeof m.ts === 'number' ? m.ts : 0,
        page: (m.page as PresencePage) || 'home',
      }))
      .filter((m) => now - m.ts <= TTL_MS);
    if (valid.length === 0) return;
    const latest = valid.sort((a, b) => b.ts - a.ts)[0];
    next[key] = latest;
  });

  return next;
};

const getOtherCoachCount = () => {
  const now = Date.now();
  const self = getSessionId();
  let total = 0;
  Object.entries(snapshot).forEach(([key, value]) => {
    if (key === self) return;
    if (now - value.ts > TTL_MS) return;
    total += 1;
  });
  return total;
};

const ensureChannelStarted = () => {
  if (channelStarted || !supabase) return;
  channelStarted = true;

  const key = getSessionId();
  const channel = supabase.channel(PRESENCE_CHANNEL, {
    config: { presence: { key } },
  });
  activeChannel = channel;

  channel
    .on('presence', { event: 'sync' }, () => {
      snapshot = normalizePresenceState(channel.presenceState() as Record<string, Array<Record<string, unknown>>>);
      notify();
    })
    .subscribe(async (status) => {
      if (status !== 'SUBSCRIBED') return;

      await channel.track({ page: currentPage, ts: Date.now() });
      if (heartbeatTimer) window.clearInterval(heartbeatTimer);
      heartbeatTimer = window.setInterval(() => {
        channel.track({ page: currentPage, ts: Date.now() }).catch(() => {
          // ignore transient realtime failures
        });
      }, HEARTBEAT_MS);

      const clearPresence = () => {
        channel.untrack().catch(() => {
          // ignore cleanup failures
        });
      };
      window.addEventListener('beforeunload', clearPresence, { once: true });
    });
};

export const useLivePresenceHeartbeat = (page: PresencePage) => {
  useEffect(() => {
    currentPage = page;
    ensureChannelStarted();
    if (activeChannel) {
      activeChannel.track({ page: currentPage, ts: Date.now() }).catch(() => {
        // ignore transient realtime failures
      });
    }
  }, [page]);
};

export const useOtherActiveCoaches = () => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onChange = () => setTick((v) => v + 1);
    listeners.add(onChange);
    ensureChannelStarted();
    return () => {
      listeners.delete(onChange);
    };
  }, []);

  return useMemo(() => getOtherCoachCount(), [tick]);
};

export const buildActivityText = (otherCoaches: number) => {
  if (otherCoaches === 0) {
    return 'No other coaches active right now — share this builder to a coach you respect.';
  }
  return `${otherCoaches} other coach${otherCoaches === 1 ? '' : 'es'} currently active on Taptics Squad.`;
};

