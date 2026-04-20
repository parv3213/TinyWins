import { DEV_TODAY_STORAGE_KEY, finalizeDayWithHealth, shiftDateStrByDays } from "@/lib/habits";
import { DayLog, Habit } from "@/lib/types";
import { useState } from "react";

interface DevDayAdvanceProps {
    uid: string;
    todayStr: string;
    habits: Habit[];
    dayLog: DayLog;
    setTodayStr: (date: string) => void;
}

export default function DevDayAdvance({ uid, todayStr, habits, dayLog, setTodayStr }: DevDayAdvanceProps) {
    const [loading, setLoading] = useState(false);

    const handleAdvance = async () => {
        if (loading) return;
        setLoading(true);
        try {
            // Finalize the current "perceived" today
            await finalizeDayWithHealth(uid, todayStr, habits, dayLog.habitCount ?? habits.length);
            
            // Advance to next day
            const nextDay = shiftDateStrByDays(todayStr, 1);
            window.localStorage.setItem(DEV_TODAY_STORAGE_KEY, nextDay);
            setTodayStr(nextDay);

            console.log(`[DEV] Advanced from ${todayStr} to ${nextDay}`);
        } catch (e) {
            console.error("Dev advance failed", e);
        } finally {
            setLoading(false);
        }
    };

    const handleRewind = () => {
        const prevDay = shiftDateStrByDays(todayStr, -1);
        window.localStorage.setItem(DEV_TODAY_STORAGE_KEY, prevDay);
        setTodayStr(prevDay);
        console.log(`[DEV] Rewound from ${todayStr} to ${prevDay}`);
    };

    return (
        <div className="fixed bottom-24 left-6 z-50 flex flex-col gap-2 animate-slideUp">
            <div className="card shadow-2xl backdrop-blur-md bg-opacity-90 min-w-[180px] border-[var(--primary)]/20 overflow-hidden">
                <div className="bg-[var(--primary)]/5 -mx-5 -mt-5 px-5 py-2 mb-4 border-b border-[var(--border)]">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--primary)]">
                        🛠️ Dev Tools
                    </span>
                </div>
                
                <div className="flex flex-col gap-2">
                    <button 
                        onClick={handleAdvance}
                        disabled={loading}
                        className="btn btn-primary text-xs py-2 px-4 shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            "⏭️"
                        )}
                        Finalize & Advance
                    </button>
                    
                    <button 
                        onClick={handleRewind}
                        disabled={loading}
                        className="btn btn-ghost text-xs py-2 px-4 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        ⏪ Rewind Day
                    </button>
                </div>
                
                <div className="mt-4 pt-3 border-t border-[var(--border)] text-[10px] text-center font-mono text-[var(--muted-fg)]">
                    Simulating: <span className="text-[var(--fg)] font-bold">{todayStr}</span>
                </div>
            </div>
        </div>
    );
}
