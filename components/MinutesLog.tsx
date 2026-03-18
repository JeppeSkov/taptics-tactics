
import React, { useState, useEffect } from 'react';
import { NavMenu } from './NavMenu';
import { Player, MatchLog, PositionCategory, PlayerMatchStats } from '../types';
import { MINUTES_STORAGE_KEY } from '../constants';
import { Clock, Plus, Trash2, Calendar, Check, X, ArrowLeft, ChevronDown, ChevronRight, FolderPlus, Layers, AlertTriangle } from 'lucide-react';

interface MinutesLogProps {
  onNavigate: (page: 'home' | 'builder' | 'setpieces' | 'articles' | 'minutes' | 'drills') => void;
  players: Player[];
}

interface Season {
    id: string;
    name: string;
    isExpanded: boolean;
}

// Internal type for the delete confirmation modal
type DeleteTarget = { type: 'season', id: string, name: string } | { type: 'match', id: string } | null;

const POSITIONS: PositionCategory[] = ['GK', 'CB', 'FB', 'WB', 'DM', 'CM', 'AM', 'W', 'ST'];
const SEASONS_STORAGE_KEY = 'taptics_seasons_v1';

const DEFAULT_STATS: PlayerMatchStats = { 
    GK: 0, CB: 0, FB: 0, WB: 0, DM: 0, CM: 0, AM: 0, W: 0, ST: 0 
};

export const MinutesLog: React.FC<MinutesLogProps> = ({ onNavigate, players }) => {
  // --- Seasons State ---
  const [seasons, setSeasons] = useState<Season[]>(() => {
    try {
        const saved = localStorage.getItem(SEASONS_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
        return [{ id: 'season-default', name: '23/24 Season', isExpanded: true }];
    } catch (e) {
        return [{ id: 'season-default', name: '23/24 Season', isExpanded: true }];
    }
  });

  const [activeSeasonId, setActiveSeasonId] = useState<string>(seasons[0]?.id || 'season-default');
  const [isCreatingSeason, setIsCreatingSeason] = useState(false);
  const [newSeasonName, setNewSeasonName] = useState('');

  // --- Matches State ---
  const [matches, setMatches] = useState<MatchLog[]>(() => {
    try {
      const saved = localStorage.getItem(MINUTES_STORAGE_KEY);
      const parsedMatches: MatchLog[] = saved ? JSON.parse(saved) : [];
      
      const defaultId = 'season-default';
      const needsMigration = parsedMatches.some(m => !m.seasonId);
      
      if (needsMigration) {
          return parsedMatches.map(m => ({
              ...m,
              seasonId: m.seasonId || defaultId
          }));
      }
      return parsedMatches;
    } catch (e) {
      console.error("Failed to load minutes log", e);
      return [];
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);

  // Form State
  const [formDate, setFormDate] = useState('');
  const [formOpponent, setFormOpponent] = useState('');
  const [formDuration, setFormDuration] = useState('');
  const [formSeasonId, setFormSeasonId] = useState('');
  const [formStats, setFormStats] = useState<Record<string, PlayerMatchStats>>({});
  
  // UI Error State
  const [errors, setErrors] = useState<{ opponent: boolean; duration: boolean }>({ opponent: false, duration: false });

  // Modal State for Deletion
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem(MINUTES_STORAGE_KEY, JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    localStorage.setItem(SEASONS_STORAGE_KEY, JSON.stringify(seasons));
  }, [seasons]);

  // --- Season Management ---
  const handleCreateSeason = () => {
    if (!newSeasonName.trim()) return;
    
    const newSeason: Season = {
        id: `season-${Date.now()}`,
        name: newSeasonName.trim(),
        isExpanded: true
    };
    
    setSeasons(prev => [newSeason, ...prev]); 
    setNewSeasonName('');
    setIsCreatingSeason(false);
    setActiveSeasonId(newSeason.id); 
  };

  const toggleSeasonExpand = (id: string) => {
      setSeasons(prev => prev.map(s => s.id === id ? { ...s, isExpanded: !s.isExpanded } : s));
  };

  const promptDeleteSeason = (e: React.MouseEvent, seasonId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const season = seasons.find(s => s.id === seasonId);
    if (season) {
        setDeleteTarget({ type: 'season', id: seasonId, name: season.name });
    }
  };

  const promptDeleteMatch = (e: React.MouseEvent, matchId: string) => {
    e.stopPropagation();
    e.preventDefault();
    setDeleteTarget({ type: 'match', id: matchId });
  };

  const executeDelete = () => {
      if (!deleteTarget) return;

      if (deleteTarget.type === 'season') {
          // Delete matches associated with this season
          setMatches(prev => prev.filter(m => m.seasonId !== deleteTarget.id));
          // Delete the season
          const newSeasons = seasons.filter(s => s.id !== deleteTarget.id);
          setSeasons(newSeasons);
          
          if (activeSeasonId === deleteTarget.id) {
              setActiveSeasonId(newSeasons.length > 0 ? newSeasons[0].id : '');
          }
      } else if (deleteTarget.type === 'match') {
          setMatches(prev => prev.filter(m => m.id !== deleteTarget.id));
          if (editingMatchId === deleteTarget.id) {
              setIsEditing(false);
              setEditingMatchId(null);
          }
      }

      setDeleteTarget(null);
  };

  // --- Stats Calculation Logic ---
  const calculateStatsForSeason = (seasonId: string) => {
    const stats: Record<string, { total: number, matches: number, posBreakdown: PlayerMatchStats }> = {};
    
    players.forEach(p => {
        stats[p.id] = { total: 0, matches: 0, posBreakdown: { ...DEFAULT_STATS } };
    });

    const seasonMatches = matches.filter(m => m.seasonId === seasonId);

    seasonMatches.forEach(match => {
        Object.entries(match.playerStats).forEach(([playerId, pStats]) => {
            const typedPStats = pStats as any;
            if (!stats[playerId]) {
                 stats[playerId] = { total: 0, matches: 0, posBreakdown: { ...DEFAULT_STATS } };
            }
            
            let matchTotal = 0;
            POSITIONS.forEach(pos => {
                const val = typedPStats[pos] || 0;
                matchTotal += val;
                stats[playerId].posBreakdown[pos] += val;
            });

            if (matchTotal > 0) {
                stats[playerId].matches += 1;
                stats[playerId].total += matchTotal;
            }
        });
    });

    return stats;
  };

  // --- Match Handlers ---
  const handleCreateMatch = () => {
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormOpponent('');
    setFormDuration(''); 
    setFormSeasonId(activeSeasonId); 
    setErrors({ opponent: false, duration: false });
    
    const initialStats: Record<string, PlayerMatchStats> = {};
    players.forEach(p => {
        initialStats[p.id] = { ...DEFAULT_STATS };
    });
    setFormStats(initialStats);
    
    setEditingMatchId(null);
    setIsEditing(true);
  };

  const handleEditMatch = (match: MatchLog) => {
    setFormDate(match.date || '');
    setFormOpponent(match.opponent || '');
    setFormDuration(match.duration ? match.duration.toString() : '90');
    setFormSeasonId(match.seasonId || seasons[0].id);
    setErrors({ opponent: false, duration: false });
    
    const mergedStats: Record<string, PlayerMatchStats> = {};
    players.forEach(p => {
        mergedStats[p.id] = { ...DEFAULT_STATS, ...match.playerStats[p.id] };
    });

    setFormStats(mergedStats);
    setEditingMatchId(match.id);
    setIsEditing(true);
  };

  const handleStatChange = (playerId: string, category: PositionCategory, value: string) => {
    const numValue = parseInt(value) || 0;
    setFormStats(prev => ({
        ...prev,
        [playerId]: {
            ...prev[playerId],
            [category]: numValue
        }
    }));
  };

  const handleSaveMatch = () => {
    const newErrors = { opponent: false, duration: false };
    let hasError = false;

    if (!formOpponent || formOpponent.trim().length === 0) {
        newErrors.opponent = true;
        hasError = true;
    }

    const durationVal = parseInt(formDuration);
    if (!formDuration || isNaN(durationVal) || durationVal <= 0) {
        newErrors.duration = true;
        hasError = true;
    }

    setErrors(newErrors);

    if (hasError) {
        if (newErrors.opponent && newErrors.duration) {
            alert("Please enter an opponent name and a match duration.");
        } else if (newErrors.opponent) {
            alert("Please enter an opponent name.");
        } else {
            alert("Please enter a valid match duration.");
        }
        return;
    }

    const newMatch: MatchLog = {
        id: editingMatchId || `match-${Date.now()}`,
        seasonId: formSeasonId,
        date: formDate,
        opponent: formOpponent,
        duration: durationVal,
        playerStats: formStats
    };

    if (editingMatchId) {
        setMatches(prev => prev.map(m => m.id === editingMatchId ? newMatch : m));
    } else {
        setMatches(prev => [newMatch, ...prev]);
        setActiveSeasonId(formSeasonId);
        setSeasons(prev => prev.map(s => s.id === formSeasonId ? { ...s, isExpanded: true } : s));
    }

    setIsEditing(false);
  };

  // --- Render Delete Modal ---
  const renderDeleteModal = () => {
      if (!deleteTarget) return null;
      
      const isSeason = deleteTarget.type === 'season';
      let title = '';
      let message = '';
      
      if (isSeason) {
          title = `Delete Season?`;
          // Need to cast to access .name safely or use type guard, but logic guarantees it exists
          const name = 'name' in deleteTarget ? deleteTarget.name : 'Season';
          const count = matches.filter(m => m.seasonId === deleteTarget.id).length;
          message = count > 0 
            ? `You are about to delete "${name}" and all ${count} matches recorded within it. This action cannot be undone.`
            : `Are you sure you want to delete "${name}"?`;
      } else {
          title = 'Delete Match Log?';
          message = 'Are you sure you want to delete this match record? This action cannot be undone.';
      }

      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 text-center flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                        <AlertTriangle size={24} className="text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                    <p className="text-slate-400 text-sm">{message}</p>
                </div>
                
                <div className="p-4 bg-slate-800/50 border-t border-slate-700 flex gap-3">
                    <button 
                        onClick={() => setDeleteTarget(null)}
                        className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={executeDelete}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg transition-colors shadow-lg"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
      );
  };

  // --- View: Overview ---
  if (!isEditing) {
      return (
        <div className="h-screen w-screen bg-slate-950 text-slate-200 font-sans p-4 flex flex-col overflow-hidden items-center relative">
            
            {renderDeleteModal()}

            {/* Header */}
            <header className="w-full max-w-[1600px] h-14 bg-slate-900 border-b border-slate-700 flex items-center px-6 justify-between mb-4 rounded-lg shadow-lg shrink-0">
                <div className="flex items-center gap-4">
                    <NavMenu onNavigate={onNavigate} currentPage="minutes" />
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-600 p-2 rounded">
                            <Clock size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white leading-none flex items-center gap-2">
                                Minutes Log
                                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/30 uppercase tracking-wider">Beta</span>
                            </h1>
                            <span className="text-xs text-slate-400">Track playing time</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {/* New Log Button */}
                    <div className="relative">
                        {isCreatingSeason ? (
                            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded border border-slate-600 animate-in fade-in slide-in-from-right-4">
                                <input 
                                    autoFocus
                                    className="bg-slate-900 border border-slate-700 text-white text-xs px-2 py-1 rounded outline-none w-32"
                                    placeholder="Season Name..."
                                    value={newSeasonName}
                                    onChange={(e) => setNewSeasonName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateSeason()}
                                />
                                <button onClick={handleCreateSeason} className="p-1 hover:bg-emerald-600 rounded text-emerald-400 hover:text-white"><Check size={14}/></button>
                                <button onClick={() => setIsCreatingSeason(false)} className="p-1 hover:bg-red-600 rounded text-slate-400 hover:text-white"><X size={14}/></button>
                            </div>
                        ) : (
                            <button 
                                onClick={() => setIsCreatingSeason(true)}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded text-xs font-bold transition-colors flex items-center gap-2 border border-slate-700"
                            >
                                <FolderPlus size={14} />
                                New Log
                            </button>
                        )}
                    </div>

                    <button 
                        onClick={handleCreateMatch}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded text-sm font-bold shadow-lg transition-colors flex items-center gap-2 ml-2"
                    >
                        <Plus size={16} />
                        Log Match
                    </button>
                </div>
            </header>

            <div className="w-full max-w-[1600px] flex flex-col lg:flex-row gap-6 flex-1 min-h-0 overflow-hidden">
                
                {/* Main: Season Totals (Expandable List) */}
                <div className="flex-grow flex flex-col gap-4 overflow-y-auto pr-1">
                    {seasons.length === 0 && (
                        <div className="p-8 text-center bg-slate-800/50 rounded-lg border border-slate-700 border-dashed">
                             <p className="text-slate-400 mb-4">No seasons found. Create one to get started.</p>
                             <button onClick={() => setIsCreatingSeason(true)} className="text-emerald-400 hover:underline">Create Default Season</button>
                        </div>
                    )}
                    
                    {seasons.map(season => {
                        const seasonStats = calculateStatsForSeason(season.id);
                        
                        return (
                            <div key={season.id} className="bg-slate-800/50 rounded-lg border border-slate-700 flex flex-col overflow-hidden shrink-0 transition-all">
                                {/* Header - DOM Refactored to separate click targets */}
                                <div className="flex justify-between items-stretch bg-slate-800 select-none group border-b border-slate-700">
                                    
                                    {/* Left Side: Clickable Expand/Collapse */}
                                    <div 
                                        className="flex-1 p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-700/50 transition-colors"
                                        onClick={() => toggleSeasonExpand(season.id)}
                                    >
                                        {season.isExpanded ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
                                        <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                            <Layers size={16} className="text-indigo-400"/>
                                            {season.name}
                                        </h2>
                                    </div>
                                    
                                    {/* Right Side: Actions (Not part of the expand click area) */}
                                    <div className="flex items-center gap-4 pr-4 bg-slate-800 pl-4">
                                        <div className="text-xs text-slate-500 font-mono">
                                            {matches.filter(m => m.seasonId === season.id).length} Matches
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => promptDeleteSeason(e, season.id)}
                                            className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors relative z-10"
                                            title="Delete Season"
                                        >
                                            <Trash2 size={16} className="pointer-events-none" />
                                        </button>
                                    </div>
                                </div>

                                {/* Table Body */}
                                {season.isExpanded && (
                                    <div className="overflow-x-auto animate-in slide-in-from-top-2 duration-200 bg-slate-800/30">
                                        <table className="w-full text-left border-collapse min-w-[600px]">
                                            <thead className="bg-slate-900/50 text-xs font-bold text-slate-400 uppercase tracking-wider shadow-sm">
                                                <tr>
                                                    <th className="px-4 py-3 border-b border-slate-700 w-48">Player</th>
                                                    <th className="px-2 py-3 border-b border-slate-700 text-center w-16">Apps</th>
                                                    {POSITIONS.map(pos => (
                                                        <th key={pos} className="px-2 py-3 border-b border-slate-700 text-center text-slate-400 w-16">{pos}</th>
                                                    ))}
                                                    <th className="px-4 py-3 border-b border-slate-700 text-center text-white w-20 bg-slate-800/30">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm divide-y divide-slate-700/50">
                                                {players.map(player => {
                                                    const stats = seasonStats[player.id];
                                                    return (
                                                        <tr key={player.id} className="hover:bg-slate-700/30 transition-colors group">
                                                            <td className="px-4 py-2 font-medium text-slate-200">
                                                                <span className="text-slate-500 font-bold mr-2 text-xs w-4 inline-block">{player.number}</span>
                                                                {player.name}
                                                            </td>
                                                            <td className="px-2 py-2 text-center text-slate-400 font-mono text-xs group-hover:text-slate-200">{stats.matches}</td>
                                                            {POSITIONS.map(pos => {
                                                                const val = stats.posBreakdown[pos];
                                                                return (
                                                                    <td key={pos} className={`px-2 py-2 text-center text-xs ${val > 0 ? 'text-indigo-300 font-bold' : 'text-slate-700'}`}>
                                                                        {val > 0 ? val : '-'}
                                                                    </td>
                                                                );
                                                            })}
                                                            <td className="px-4 py-2 text-center font-bold text-emerald-400 text-base bg-slate-800/30 group-hover:bg-slate-700/50 transition-colors">
                                                                {stats.total > 0 ? stats.total : <span className="text-slate-700 text-sm font-normal">0</span>}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Sidebar: Match History */}
                <div className="w-full lg:w-80 bg-slate-800/50 rounded-lg border border-slate-700 flex flex-col shrink-0 overflow-hidden">
                     <div className="p-4 border-b border-slate-700 bg-slate-800 flex justify-between items-center">
                        <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                            <Calendar size={16} className="text-orange-400"/>
                            Recent Matches
                        </h2>
                    </div>
                    <div className="overflow-y-auto p-2 gap-2 flex flex-col">
                        {matches.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 text-sm italic">
                                No matches logged yet.
                            </div>
                        ) : (
                            [...matches].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(match => {
                                return (
                                    <div 
                                        key={match.id}
                                        className="bg-slate-900 rounded border border-slate-700 hover:border-indigo-500 transition-all group relative overflow-hidden"
                                    >
                                        {/* Clickable Area for Edit */}
                                        <div 
                                            className="p-3 cursor-pointer h-full w-full"
                                            onClick={() => handleEditMatch(match)}
                                        >
                                            <div className="flex justify-between items-start mb-1 pr-6">
                                                <span className="font-bold text-slate-200 truncate">{match.opponent}</span>
                                                <span className="text-xs text-slate-500 font-mono">{new Date(match.date).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex gap-2 text-[10px] text-slate-400 items-center">
                                                <span className="bg-slate-800 px-1 rounded text-slate-500">{seasons.find(s => s.id === match.seasonId)?.name || 'Unknown'}</span>
                                                <span>•</span>
                                                <span>{match.duration || 90} mins</span>
                                            </div>
                                        </div>

                                        {/* Delete Button - Sibling to clickable area, positioned absolute */}
                                        <button 
                                            type="button"
                                            onClick={(e) => promptDeleteMatch(e, match.id)}
                                            className="absolute top-2 right-2 p-2 text-slate-500 hover:text-red-500 bg-slate-900/80 hover:bg-slate-800 rounded-full transition-colors z-20"
                                            title="Delete Match"
                                        >
                                            <Trash2 size={14} className="pointer-events-none" />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
      );
  }

  // View: Editor (The Matrix)
  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-200 font-sans p-4 flex flex-col overflow-hidden items-center relative">
        {renderDeleteModal()}
        
        <header className="w-full max-w-7xl h-14 bg-slate-900 border-b border-slate-700 flex items-center px-6 justify-between mb-4 rounded-lg shadow-lg shrink-0">
             <div className="flex items-center gap-4">
                <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <span className="font-bold text-white">{editingMatchId ? 'Edit Match Log' : 'Log New Match'}</span>
             </div>
             
             <div className="flex items-center gap-2">
                 <span className="text-xs text-slate-500 font-bold uppercase hidden sm:inline">Season:</span>
                 <select 
                    value={formSeasonId}
                    onChange={(e) => setFormSeasonId(e.target.value)}
                    className="bg-slate-800 text-slate-200 text-sm border border-slate-600 rounded px-2 py-1 outline-none focus:border-indigo-500"
                 >
                     {seasons.map(s => (
                         <option key={s.id} value={s.id}>{s.name}</option>
                     ))}
                 </select>
             </div>

             <div className="flex items-center gap-3">
                 {editingMatchId && (
                     <button 
                        type="button"
                        onClick={(e) => promptDeleteMatch(e, editingMatchId)}
                        className="text-red-500 hover:bg-red-900/20 px-3 py-1.5 rounded text-sm font-bold transition-colors flex items-center gap-2 border border-transparent hover:border-red-900/50"
                    >
                        <Trash2 size={16} />
                        <span className="hidden sm:inline">Delete</span>
                    </button>
                 )}

                 <button 
                    onClick={handleSaveMatch}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-1.5 rounded text-sm font-bold shadow-lg transition-colors flex items-center gap-2"
                >
                    <Check size={16} />
                    Save Log
                </button>
             </div>
        </header>

        <div className="w-full max-w-7xl bg-slate-800 rounded-lg border border-slate-700 flex flex-col flex-1 min-h-0 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-700 flex gap-6 items-end bg-slate-850">
                <div className="flex flex-col gap-1 w-40">
                    <label className="text-xs font-bold text-slate-400 uppercase">Date</label>
                    <input 
                        type="date" 
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                    />
                </div>
                <div className="flex flex-col gap-1 w-24">
                    <label className={`text-xs font-bold uppercase ${errors.duration ? 'text-red-500' : 'text-slate-400'}`}>Duration</label>
                    <div className="relative">
                        <input 
                            type="number" 
                            min="1"
                            value={formDuration}
                            onChange={(e) => {
                                setFormDuration(e.target.value);
                                if (errors.duration) setErrors(prev => ({ ...prev, duration: false }));
                            }}
                            className={`bg-slate-900 border rounded px-3 py-2 text-sm text-white outline-none w-full ${errors.duration ? 'border-red-500 focus:border-red-500' : 'border-slate-600 focus:border-indigo-500'}`}
                            placeholder="Min"
                        />
                        <span className="absolute right-2 top-2 text-xs text-slate-500 pointer-events-none">min</span>
                    </div>
                </div>
                <div className="flex flex-col gap-1 flex-1">
                    <label className={`text-xs font-bold uppercase ${errors.opponent ? 'text-red-500' : 'text-slate-400'}`}>Opponent</label>
                    <input 
                        type="text" 
                        value={formOpponent}
                        onChange={(e) => {
                            setFormOpponent(e.target.value);
                            if (errors.opponent) setErrors(prev => ({ ...prev, opponent: false }));
                        }}
                        placeholder="e.g. AFC Richmond"
                        className={`bg-slate-900 border rounded px-3 py-2 text-sm text-white outline-none ${errors.opponent ? 'border-red-500 focus:border-red-500' : 'border-slate-600 focus:border-indigo-500'}`}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-900 sticky top-0 z-10 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4 border-b border-slate-700 w-64 bg-slate-900 sticky left-0 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">Player</th>
                            {POSITIONS.map(pos => (
                                <th key={pos} className="px-2 py-4 border-b border-slate-700 text-center min-w-[60px]">{pos}</th>
                            ))}
                            <th className="px-6 py-4 border-b border-slate-700 text-right w-32 font-black text-white">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {players.map(player => {
                            const pStats = formStats[player.id] || { ...DEFAULT_STATS };
                            let total = 0;
                            POSITIONS.forEach(pos => total += (pStats[pos] || 0));
                            const matchDuration = parseInt(formDuration) || 90;
                            
                            return (
                                <tr key={player.id} className="hover:bg-slate-700/30 transition-colors group">
                                    <td className="px-6 py-2 bg-slate-800 group-hover:bg-slate-700/50 sticky left-0 z-10 border-r border-slate-700/50">
                                        <div className="font-medium text-slate-200">{player.name}</div>
                                        <div className="text-[10px] text-slate-500 font-mono">#{player.number}</div>
                                    </td>
                                    {POSITIONS.map(pos => (
                                        <td key={pos} className="px-2 py-2">
                                            <input 
                                                type="number"
                                                min="0"
                                                max={matchDuration}
                                                value={pStats[pos] || ''}
                                                onChange={(e) => handleStatChange(player.id, pos, e.target.value)}
                                                className={`w-full bg-slate-900 border ${pStats[pos] > 0 ? 'border-indigo-500/50 text-indigo-200 font-bold' : 'border-slate-700 text-slate-400'} rounded px-1 py-1.5 text-center text-sm outline-none focus:border-indigo-500 focus:text-white transition-all`}
                                            />
                                        </td>
                                    ))}
                                    <td className="px-6 py-2 text-right">
                                        <span className={`font-mono font-bold text-lg ${total > matchDuration ? 'text-red-400' : total > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                                            {total}'
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            
            <div className="p-4 border-t border-slate-700 bg-slate-900 text-center text-xs text-slate-500">
                Enter minutes played for each position. Totals calculate automatically based on the selected season.
            </div>
        </div>
    </div>
  );
};
