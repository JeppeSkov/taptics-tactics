
import React, { useState } from 'react';
import { Player, TacticalSlot } from '../types';
import { Pitch, PitchArrow, PitchZone, PitchOpponent } from './Pitch';
import { LayoutGrid, ClipboardList, Check, Copy, ArrowLeft, Calendar, Users } from 'lucide-react';

// Re-defining interfaces to avoid circular dependency issues if types aren't fully exported
interface KitColor {
  name: string;
  hex: string;
  text: string;
}

interface SharedRosterPlayer {
    id: string;
    name: string;
    number: number;
    naturalPosition: string;
}

interface SharedRoutineData {
    id: string;
    name: string;
    scenario: 'offensive' | 'defensive';
    data: {
        slots: TacticalSlot[];
        assignments: Record<string, string>;
        roles: Record<string, string>;
        ballPosition: { x: number, y: number } | null;
        arrows: PitchArrow[];
        zones: PitchZone[];
        opponents: PitchOpponent[];
        notes: string;
        plan?: string;
    };
}

export interface SharedSetPiecePayload {
    routines: SharedRoutineData[];
    roster: SharedRosterPlayer[];
    kitColor: KitColor;
    generatedAt: number;
}

interface SetPieceSharedViewProps {
    payload: SharedSetPiecePayload;
    onBack: () => void;
}

export const SetPieceSharedView: React.FC<SetPieceSharedViewProps> = ({ payload, onBack }) => {
    const [copied, setCopied] = useState(false);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Helper to reconstruct full Player objects for the Pitch component for a specific routine
    const getPlayersForRoutine = (routine: SharedRoutineData): Player[] => {
        // Safety checks for older data structures that might be missing roles or assignments
        const assignments = routine.data.assignments || {};
        const roles = routine.data.roles || {};

        return payload.roster.map(p => ({
            ...p,
            bestRole: '', // Not needed for visual
            condition: 100, // Not needed
            sharpness: 100, // Not needed
            roleFamiliarity: 10, // Not needed
            roleAbility: 5, // Not needed
            assignedSlot: assignments[p.id] || null,
            status: roles[p.id] || 'Ready' // Map role to status for display
        }));
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col items-center pb-20">
            {/* Navigation / Header */}
            <div className="w-full bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                         <button 
                            onClick={onBack}
                            className="p-2 -ml-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-900 flex items-center gap-2"
                        >
                            <ArrowLeft size={20} />
                            <span className="font-bold text-sm hidden sm:inline">Back to Builder</span>
                        </button>
                        <div className="h-6 w-px bg-slate-200 mx-2"></div>
                        <div className="flex items-center gap-2">
                            <div className="bg-orange-600 p-1.5 rounded shadow-sm">
                                <LayoutGrid size={16} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-sm font-black text-slate-900 leading-none uppercase tracking-tight flex items-center gap-2">
                                    Taptics
                                    <span className="text-[9px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded border border-orange-200 uppercase tracking-wider font-bold">Beta</span>
                                </h1>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Set Piece Playbook</span>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleCopyLink}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-md"
                    >
                        {copied ? <Check size={14} className="text-emerald-400"/> : <Copy size={14} />}
                        {copied ? "Copied" : "Copy Link"}
                    </button>
                </div>
            </div>

            {/* Content List */}
            <div className="w-full max-w-7xl px-4 py-8 flex flex-col gap-12">
                
                {payload.routines.map((routine, index) => {
                    const playersForRoutine = getPlayersForRoutine(routine);
                    const activePlayers = playersForRoutine
                        .filter(p => p.assignedSlot)
                        .sort((a, b) => a.number - b.number);

                    return (
                        <div key={routine.id || index} className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden break-inside-avoid print:break-inside-avoid">
                            {/* Card Header */}
                            <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-start">
                                <div>
                                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest mb-2 ${
                                        routine.scenario === 'offensive' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {routine.scenario === 'offensive' ? 'Attacking' : 'Defending'}
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">{routine.name}</h2>
                                </div>
                                <div className="text-right hidden sm:block">
                                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1 justify-end">
                                        <Calendar size={12} />
                                        Generated {new Date(payload.generatedAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-6 md:p-8 flex flex-col xl:flex-row gap-8">
                                {/* Pitch Section */}
                                <div className="w-full xl:w-2/3 flex flex-col items-center">
                                    <div className="w-full max-w-[800px] shadow-lg rounded-lg overflow-hidden border-4 border-slate-800 relative">
                                        <Pitch 
                                            slots={routine.data.slots || []}
                                            players={playersForRoutine}
                                            onPlayerDrop={() => {}}
                                            onSlotMove={() => {}}
                                            ballPosition={routine.data.ballPosition}
                                            arrows={routine.data.arrows || []}
                                            zones={routine.data.zones || []}
                                            opponents={routine.data.opponents || []}
                                            kitColor={payload.kitColor.hex}
                                            numberColor={payload.kitColor.text}
                                            viewMode={routine.scenario}
                                            playerIconStyle="circle"
                                            isSmallMode={true} // Cleaner look for smaller view
                                        />
                                    </div>
                                </div>

                                {/* Plan Section */}
                                <div className="w-full xl:w-1/3 flex flex-col gap-6">
                                    {/* The Plan */}
                                    <div className="flex-1">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <ClipboardList size={14} />
                                            The Plan
                                        </h3>
                                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 min-h-[100px]">
                                            {routine.data.plan ? (
                                                <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                                                    {routine.data.plan}
                                                </p>
                                            ) : (
                                                <p className="text-sm text-slate-400 italic">No specific plan instructions provided.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Assignments */}
                                    <div>
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <Users size={14} />
                                            Assignments
                                        </h3>
                                        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden max-h-[250px] overflow-y-auto custom-scrollbar">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase sticky top-0">
                                                    <tr>
                                                        <th className="px-3 py-2 border-b border-slate-100">Player</th>
                                                        <th className="px-3 py-2 border-b border-slate-100">Role</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {activePlayers.map(p => (
                                                        <tr key={p.id}>
                                                            <td className="px-3 py-2 font-medium text-slate-700">
                                                                <span className="font-bold text-slate-900 mr-1.5">{p.number}</span> 
                                                                {p.name}
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                {p.status && p.status !== 'Ready' ? (
                                                                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide bg-slate-100 text-slate-600">
                                                                        {p.status}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-300">-</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {activePlayers.length === 0 && (
                                                        <tr>
                                                            <td colSpan={2} className="px-3 py-4 text-center text-slate-400 italic text-xs">
                                                                No players positioned on the pitch.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    {routine.data.notes && (
                                        <div>
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                                                Additional Notes
                                            </h3>
                                            <div className="text-xs text-slate-600 bg-yellow-50 border border-yellow-100 p-3 rounded-lg">
                                                {routine.data.notes}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div className="mt-8 text-slate-400 text-xs font-medium">
                Built with Taptics
            </div>
        </div>
    );
};
