
import React from 'react';
import { Player, TacticalSlot } from '../types';
import { Pitch } from './Pitch';
import { Shirt, LayoutGrid, Calendar, ArrowLeft, Copy, Check, Shield, Swords } from 'lucide-react';
import { BENCH_SLOTS } from '../constants';

interface SharedViewProps {
  players: Player[];
  slots: TacticalSlot[];
  formation: string;
  kitColor: { hex: string; text: string };
  gameplan: { onBall: string; offBall: string };
  nextMatch: { opponent: string; isHome: boolean; date: string } | null;
  onRemix: () => void;
  subCount?: number;
}

export const SharedView: React.FC<SharedViewProps> = ({
  players,
  slots,
  formation,
  kitColor,
  gameplan,
  nextMatch,
  onRemix,
  subCount = 7 // Default to 7 if not provided in old shares
}) => {
  const [copied, setCopied] = React.useState(false);
  
  // Calculate active bench slots and find players assigned to them
  const activeBenchSlots = BENCH_SLOTS.slice(0, subCount);
  const benchPlayers = activeBenchSlots
        .map(slotId => players.find(p => p.assignedSlot === slotId))
        .filter((p): p is Player => !!p);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getDaysUntilText = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 0) return `in ${diffDays} days`;
    if (diffDays === -1) return 'Yesterday';
    return `${Math.abs(diffDays)} days ago`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8 flex flex-col items-center">
      
      {/* Navigation Bar */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-8 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 p-2 rounded-lg shadow-lg shadow-emerald-200">
             <LayoutGrid size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 leading-none uppercase tracking-tight italic flex items-center gap-2">
                Taptics
                <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-200 uppercase tracking-wider not-italic font-bold">Beta</span>
            </h1>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Shared Lineup</span>
          </div>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-bold transition-all border border-slate-200 shadow-sm"
            >
                {copied ? <Check size={16} className="text-emerald-500"/> : <Copy size={16} />}
                {copied ? "Copied" : "Copy Link"}
            </button>
            <button 
                onClick={onRemix}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-bold shadow-lg transition-all"
            >
                <ArrowLeft size={16} />
                Create Your Own
            </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col lg:flex-row">
        
        {/* Left: Pitch Section */}
        <div className="lg:w-7/12 p-6 md:p-10 bg-slate-100 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-200 relative">
             {/* Formation Label Overlay */}
             <div className="absolute top-6 left-6 bg-white/90 px-4 py-2 rounded-lg border border-slate-200 shadow-sm z-10">
                <span className="text-slate-800 text-sm font-black tracking-widest uppercase italic">{formation}</span>
             </div>

             <div className="w-full max-w-[500px] shadow-2xl rounded-lg overflow-hidden border-[6px] border-white ring-1 ring-slate-200">
                <Pitch 
                    slots={slots} 
                    players={players} 
                    onPlayerDrop={() => {}} 
                    onSlotMove={() => {}} 
                    kitColor={kitColor.hex} 
                    numberColor={kitColor.text}
                    // isExport={true} removed to match webapp look
                />
             </div>
        </div>

        {/* Right: Details Section */}
        <div className="lg:w-5/12 bg-white flex flex-col">
            
            {/* Header / Match Info */}
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-emerald-600 font-bold uppercase tracking-widest text-xs mb-2">Next Match</h3>
                {nextMatch?.opponent ? (
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 mb-2 italic tracking-tighter uppercase">{nextMatch.opponent}</h2>
                        <div className="flex items-center gap-3 text-slate-500 text-sm font-bold">
                            <span className={`px-2 py-0.5 rounded text-xs font-black uppercase ${nextMatch.isHome ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'}`}>
                                {nextMatch.isHome ? 'HOME' : 'AWAY'}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Calendar size={14} />
                                {getDaysUntilText(nextMatch.date)}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="text-slate-400 italic font-medium">No opponent selected</div>
                )}
            </div>

            {/* Content Container */}
            <div className="flex-1 flex flex-col p-8 gap-8 overflow-y-auto custom-scrollbar">
                
                {/* Gameplan */}
                {(gameplan.onBall || gameplan.offBall) && (
                    <div className="flex flex-col gap-4">
                        <h3 className="text-slate-400 font-black uppercase tracking-widest text-xs flex items-center gap-2">
                             Gameplan
                        </h3>
                        <div className="space-y-4">
                             {gameplan.onBall && (
                                 <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 relative overflow-hidden group">
                                     <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                                     <h4 className="text-emerald-600 text-xs font-bold uppercase mb-2 flex items-center gap-2">
                                        <Swords size={14} />
                                        On the Ball
                                     </h4>
                                     <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{gameplan.onBall}</p>
                                 </div>
                             )}
                             {gameplan.offBall && (
                                 <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 relative overflow-hidden group">
                                     <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                     <h4 className="text-blue-600 text-xs font-bold uppercase mb-2 flex items-center gap-2">
                                        <Shield size={14} />
                                        Off the Ball
                                     </h4>
                                     <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{gameplan.offBall}</p>
                                 </div>
                             )}
                        </div>
                    </div>
                )}

                {/* Substitutes */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-slate-400 font-black uppercase tracking-widest text-xs border-b border-slate-100 pb-2">
                        Substitutes ({benchPlayers.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
                        {benchPlayers.map(player => (
                            <div key={player.id} className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm hover:border-emerald-200 transition-colors">
                                <div className="relative shrink-0">
                                    <Shirt size={28} color={kitColor.hex} fill={kitColor.hex} />
                                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold" style={{ color: kitColor.text }}>
                                        {player.number}
                                    </span>
                                </div>
                                <div className="overflow-hidden">
                                    <div className="text-sm font-bold text-slate-800 truncate">{player.name.split(' ').pop()}</div>
                                    <div className="text-[10px] text-slate-400 font-black uppercase">{player.naturalPosition.split(' ')[0]}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};
