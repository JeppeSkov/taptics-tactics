import React, { useEffect, useMemo, useState } from 'react';
import { Plus, ChevronDown, ChevronUp, X } from 'lucide-react';

type ScheduleType = 'match' | 'training' | 'event';

type ScheduleItemBase = {
  id: string;
  type: ScheduleType;
  date: string; // YYYY-MM-DD local
  time: string; // HH:MM
  createdAt: number;
};

type MatchScheduleItem = ScheduleItemBase & {
  type: 'match';
  opponent: string;
  isHome: boolean;
};

type TrainingScheduleItem = ScheduleItemBase & {
  type: 'training';
};

type EventScheduleItem = ScheduleItemBase & {
  type: 'event';
  title: string;
};

type ScheduleItem = MatchScheduleItem | TrainingScheduleItem | EventScheduleItem;

const STORAGE_KEY = 'taptics_schedule_v1';

const pad2 = (n: number) => String(n).padStart(2, '0');

const formatDateLocalYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
};

const formatWeekdayShort3 = (d: Date) => {
  // Force English abbreviations for consistent "first three letters".
  return d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3);
};

const formatDayNumber = (d: Date) => String(d.getDate());

export const ScheduleCalendar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [menuOpenForDate, setMenuOpenForDate] = useState<string | null>(null);
  const [menuCoords, setMenuCoords] = useState<{ left: number; top: number } | null>(null);
  const [modal, setModal] = useState<null | { type: ScheduleType; date: string; itemId?: string }>(null);

  const [items, setItems] = useState<ScheduleItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as ScheduleItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore localStorage write errors (e.g. blocked in some browsers).
    }
  }, [items]);

  const days = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const result: Array<{ date: Date; ymd: string }> = [];
    for (let i = 0; i < 10; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      result.push({ date: d, ymd: formatDateLocalYMD(d) });
    }
    return result;
  }, []);

  // --- Form state ---
  const [matchOpponent, setMatchOpponent] = useState('');
  const [matchTime, setMatchTime] = useState('18:00');
  const [matchIsHome, setMatchIsHome] = useState(true);

  const [trainingTime, setTrainingTime] = useState('17:00');

  const [eventTitle, setEventTitle] = useState('');
  const [eventTime, setEventTime] = useState('19:00');

  useEffect(() => {
    if (!modal) return;

    // If editing, pre-fill from the existing item.
    if (modal.itemId) {
      const item = items.find((i) => i.id === modal.itemId);
      if (item) {
        if (item.type === 'match') {
          setMatchOpponent(item.opponent);
          setMatchTime(item.time);
          setMatchIsHome(item.isHome);
        } else if (item.type === 'training') {
          setTrainingTime(item.time);
        } else if (item.type === 'event') {
          setEventTitle(item.title);
          setEventTime(item.time);
        }
      }
      return;
    }

    // Otherwise reset defaults when opening create modals.
    setMenuOpenForDate(null);
    setMatchOpponent('');
    setMatchTime('18:00');
    setMatchIsHome(true);
    setTrainingTime('17:00');
    setEventTitle('');
    setEventTime('19:00');
  }, [modal, items]);

  const closeModal = () => setModal(null);

  const openModal = (type: ScheduleType) => {
    if (!menuOpenForDate) return;
    setModal({ type, date: menuOpenForDate });
    setMenuOpenForDate(null);
    setMenuCoords(null);
  };

  const openEditModal = (item: ScheduleItem) => {
    // Close any open "+ menu" before opening the edit popup.
    setMenuOpenForDate(null);
    setMenuCoords(null);
    setModal({ type: item.type, date: item.date, itemId: item.id });
  };

  const closeMenu = () => {
    setMenuOpenForDate(null);
    setMenuCoords(null);
  };

  const handleSaveMatch = () => {
    if (!modal || modal.type !== 'match') return;
    const opponent = matchOpponent.trim();
    if (!opponent) return;
    const newId = modal.itemId ?? `sched-match-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setItems((prev) => {
      const existing = modal.itemId ? prev.find((i) => i.id === modal.itemId) : undefined;
      const nextItem: MatchScheduleItem = {
        id: newId,
        type: 'match',
        date: modal.date,
        time: matchTime || '00:00',
        opponent,
        isHome: matchIsHome,
        createdAt: existing?.createdAt ?? Date.now(),
      };

      if (modal.itemId) return prev.map((i) => (i.id === modal.itemId ? nextItem : i));
      return [nextItem, ...prev];
    });
    closeModal();
  };

  const handleSaveTraining = () => {
    if (!modal || modal.type !== 'training') return;
    const newId = modal.itemId ?? `sched-training-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setItems((prev) => {
      const existing = modal.itemId ? prev.find((i) => i.id === modal.itemId) : undefined;
      const nextItem: TrainingScheduleItem = {
        id: newId,
        type: 'training',
        date: modal.date,
        time: trainingTime || '00:00',
        createdAt: existing?.createdAt ?? Date.now(),
      };

      if (modal.itemId) return prev.map((i) => (i.id === modal.itemId ? nextItem : i));
      return [nextItem, ...prev];
    });
    closeModal();
  };

  const handleSaveEvent = () => {
    if (!modal || modal.type !== 'event') return;
    const title = eventTitle.trim();
    if (!title) return;
    const newId = modal.itemId ?? `sched-event-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setItems((prev) => {
      const existing = modal.itemId ? prev.find((i) => i.id === modal.itemId) : undefined;
      const nextItem: EventScheduleItem = {
        id: newId,
        type: 'event',
        date: modal.date,
        time: eventTime || '00:00',
        title,
        createdAt: existing?.createdAt ?? Date.now(),
      };

      if (modal.itemId) return prev.map((i) => (i.id === modal.itemId ? nextItem : i));
      return [nextItem, ...prev];
    });
    closeModal();
  };

  const handleDeleteCurrentItem = () => {
    if (!modal?.itemId) return;
    setItems((prev) => prev.filter((i) => i.id !== modal.itemId));
    closeModal();
  };

  return (
    <>
      <div className="w-full max-w-[1600px] px-0 mb-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setIsCollapsed((v) => !v)}
            className="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
            aria-label={isCollapsed ? 'Expand calendar' : 'Collapse calendar'}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                Schedule
              </span>
            </div>
            {isCollapsed ? (
              <ChevronDown size={16} className="text-slate-300" />
            ) : (
              <ChevronUp size={16} className="text-slate-300" />
            )}
          </button>

          {!isCollapsed && (
            <div className="p-3 pt-2">
              <div className="flex items-stretch gap-2">
                {days.map(({ date, ymd }) => (
                  <div
                    key={ymd}
                    className="relative flex-1 rounded-lg border border-slate-700 bg-slate-900/30 overflow-visible"
                  >
                    <div className="p-2 flex flex-col items-start justify-start gap-1">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">
                        {formatWeekdayShort3(date)}
                      </div>
                      <div className="text-sm text-slate-200 font-bold">
                        {formatDayNumber(date)}
                      </div>

                      {(() => {
                        const dayItems = items
                          .filter((i) => i.date === ymd)
                          .slice()
                          .sort((a, b) => {
                            const t = a.time.localeCompare(b.time);
                            if (t !== 0) return t;
                            return a.createdAt - b.createdAt;
                          });

                        if (dayItems.length === 0) return null;

                        return (
                          <div className="mt-1 flex flex-col gap-[2px]">
                            {dayItems.map((item) => {
                              if (item.type === 'match') {
                                return (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditModal(item);
                                    }}
                                    className="text-left text-[10px] text-slate-300 leading-tight hover:text-white hover:bg-slate-800/40 rounded px-1 -mx-1"
                                    title={`${item.time} ${item.isHome ? 'Home' : 'Away'} vs ${item.opponent} ${item.isHome ? '(H)' : '(A)'}`}
                                    aria-label={`Edit match ${item.time} vs ${item.opponent} ${item.isHome ? '(H)' : '(A)'}`}
                                  >
                                    {item.time} • {item.opponent} {item.isHome ? '(H)' : '(A)'}
                                  </button>
                                );
                              }

                              if (item.type === 'training') {
                                return (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditModal(item);
                                    }}
                                    className="text-left text-[10px] text-slate-300 leading-tight hover:text-white hover:bg-slate-800/40 rounded px-1 -mx-1"
                                    title={`${item.time} Training`}
                                    aria-label={`Edit training ${item.time}`}
                                  >
                                    {item.time} • Training
                                  </button>
                                );
                              }

                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditModal(item);
                                  }}
                                  className="text-left text-[10px] text-slate-300 leading-tight hover:text-white hover:bg-slate-800/40 rounded px-1 -mx-1"
                                  title={`${item.time} ${item.title}`}
                                  aria-label={`Edit event ${item.time} ${item.title}`}
                                >
                                  {item.time} • {item.title}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>

                    <button
                      type="button"
                      aria-label={`Add item for ${ymd}`}
                      className="absolute top-1 right-1 w-3.5 h-3.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center transition-colors cursor-pointer z-[170]"
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextOpen = menuOpenForDate !== ymd;
                        if (!nextOpen) {
                          closeMenu();
                          return;
                        }

                        const target = e.currentTarget as HTMLElement;
                        const rect = target.getBoundingClientRect();
                        const menuWidth = 176; // tailwind w-44
                        const padding = 8;
                        const left = Math.min(
                          Math.max(padding, rect.right - menuWidth),
                          window.innerWidth - menuWidth - padding,
                        );
                        const top = Math.min(rect.bottom + 8, window.innerHeight - 20);

                        setMenuOpenForDate(ymd);
                        setMenuCoords({ left, top });
                      }}
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {menuOpenForDate && menuCoords && (
        <>
          <div
            className="fixed inset-0 z-[900]"
            onClick={closeMenu}
            role="presentation"
          />
          <div
            className="fixed z-[1000] w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in duration-150"
            style={{ left: menuCoords.left, top: menuCoords.top }}
          >
            <button
              type="button"
              onClick={() => openModal('match')}
              className="w-full px-4 py-3 text-left text-sm font-medium text-slate-200 hover:bg-slate-800 border-b border-slate-700/50"
            >
              Add match
            </button>
            <button
              type="button"
              onClick={() => openModal('training')}
              className="w-full px-4 py-3 text-left text-sm font-medium text-slate-200 hover:bg-slate-800 border-b border-slate-700/50"
            >
              Add training
            </button>
            <button
              type="button"
              onClick={() => openModal('event')}
              className="w-full px-4 py-3 text-left text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              Add event
            </button>
          </div>
        </>
      )}

      {modal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-4 bg-slate-800/60 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">
                {modal.type === 'match'
                  ? modal.itemId
                    ? 'Edit match'
                    : 'Add match'
                  : modal.type === 'training'
                    ? modal.itemId
                      ? 'Edit training'
                      : 'Add training'
                    : modal.itemId
                      ? 'Edit event'
                      : 'Add event'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="text-xs text-slate-400">
                Date: <span className="text-slate-200 font-semibold">{modal.date}</span>
              </div>

              {modal.type === 'match' && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-400 uppercase" htmlFor="match-time">
                      Time
                    </label>
                    <input
                      id="match-time"
                      type="time"
                      value={matchTime}
                      onChange={(e) => setMatchTime(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-400 uppercase" htmlFor="match-opponent">
                      Opponent
                    </label>
                    <input
                      id="match-opponent"
                      type="text"
                      value={matchOpponent}
                      onChange={(e) => setMatchOpponent(e.target.value)}
                      placeholder="e.g. AFC Richmond"
                      className="bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="text-xs font-bold text-slate-400 uppercase">Venue</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setMatchIsHome(true)}
                        className={`flex-1 px-3 py-2 rounded-md text-sm font-bold border transition-colors ${
                          matchIsHome
                            ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        Home
                      </button>
                      <button
                        type="button"
                        onClick={() => setMatchIsHome(false)}
                        className={`flex-1 px-3 py-2 rounded-md text-sm font-bold border transition-colors ${
                          !matchIsHome
                            ? 'bg-blue-600/30 border-blue-500 text-blue-200'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        Away
                      </button>
                    </div>
                  </div>
                </>
              )}

              {modal.type === 'training' && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400 uppercase" htmlFor="training-time">
                    Time
                  </label>
                  <input
                    id="training-time"
                    type="time"
                    value={trainingTime}
                    onChange={(e) => setTrainingTime(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {modal.type === 'event' && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-400 uppercase" htmlFor="event-title">
                      Title
                    </label>
                    <input
                      id="event-title"
                      type="text"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      placeholder="e.g. Team meeting"
                      className="bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-400 uppercase" htmlFor="event-time">
                      Time
                    </label>
                    <input
                      id="event-time"
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="p-4 bg-slate-800/50 border-t border-slate-700 flex justify-center gap-2">
              {modal.itemId && (
                <button
                  type="button"
                  onClick={handleDeleteCurrentItem}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg transition-colors shadow-lg"
                >
                  Delete
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!modal) return;
                  if (modal.type === 'match') handleSaveMatch();
                  if (modal.type === 'training') handleSaveTraining();
                  if (modal.type === 'event') handleSaveEvent();
                }}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition-colors shadow-lg"
                disabled={
                  modal.type === 'match'
                    ? !matchOpponent.trim()
                    : modal.type === 'event'
                      ? !eventTitle.trim()
                      : false
                }
              >
                {modal.itemId ? 'Save Changes' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

