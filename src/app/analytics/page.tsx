'use client';

import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import CompletionRing from '@/components/charts/CompletionRing';
import MonthlyBarChart from '@/components/charts/MonthlyBarChart';
import { Doughnut } from 'react-chartjs-2';

// Stub data for now since we don't have enough history in the DB to make the charts look good
const STUB_MONTHLY_DATA = Array.from({ length: 30 }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  
  // Randomize some realistic looking data
  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
  const basePositive = isWeekend ? 3 : 5;
  const baseNegative = isWeekend ? 2 : 1;
  
  return {
    date: d.toISOString(),
    positive: Math.max(0, basePositive + Math.floor(Math.random() * 3) - 1),
    negative: Math.max(0, baseNegative + Math.floor(Math.random() * 2) - 1),
  };
});

const RATIO_DATA = {
  labels: ['Good Habits', 'Bad Habits'],
  datasets: [{
    data: [75, 25],
    backgroundColor: ['var(--success)', 'var(--danger)'],
    borderWidth: 0,
    cutout: '70%',
  }]
};

export default function AnalyticsPage() {
  return (
    <div className="container pb-24 relative min-h-screen">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid z-[-1]"></div>
      
      <Header title="Trends & Analytics" showDate={false} />

      <main className="flex flex-col gap-5 mt-4">
        
        <div className="grid grid-cols-2 gap-4">
          {/* Weekly Ring */}
          <div className="card-flat flex flex-col items-center p-5">
            <h3 className="text-sm font-medium text-[var(--fg)] mb-4">Weekly Goal</h3>
            <CompletionRing percentage={82} />
          </div>

          {/* Streak Card */}
          <div className="card-flat flex flex-col items-center justify-center p-5 text-center relative overflow-hidden">
             {/* Subtle animated glow behind fire */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-[var(--pending)] rounded-full blur-[40px] opacity-20 animate-pulse pointer-events-none"></div>
             
             <span className="text-4xl relative z-10 animate-bounce" style={{ animationDuration: '2s' }}>🔥</span>
             <div className="flex items-baseline gap-1 mt-2 relative z-10">
                <span className="stat-number">14</span>
                <span className="text-[var(--muted-fg)] font-medium">days</span>
             </div>
             <p className="text-xs text-[var(--muted-fg)] mt-2 relative z-10">Longest: 21 days</p>
          </div>
        </div>

        {/* Good vs Bad Ratio */}
        <div className="card-flat p-5 flex items-center justify-between">
           <div>
              <h3 className="text-base font-medium mb-1">Behavior Ratio</h3>
              <p className="text-xs text-[var(--muted-fg)]">Positive vs Negative actions</p>
              
              <div className="flex flex-col gap-2 mt-4">
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[var(--success)]"></div>
                    <span className="text-sm font-medium">75% Good</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[var(--danger)]"></div>
                    <span className="text-sm font-medium">25% Bad</span>
                 </div>
              </div>
           </div>
           
           <div className="w-[100px] h-[100px] relative">
              <Doughnut 
                 data={RATIO_DATA} 
                 options={{ plugins: { tooltip: { enabled: false } }, maintainAspectRatio: false }} 
              />
           </div>
        </div>

        {/* Monthly Chart */}
        <div className="card-flat p-5">
           <div className="flex items-center justify-between mb-6">
              <div>
                 <h3 className="text-base font-medium">30 Day History</h3>
                 <p className="text-xs text-[var(--muted-fg)]">Daily completions</p>
              </div>
              <button className="text-xs text-[var(--primary)] font-medium hover:underline">
                 View Data
              </button>
           </div>
           
           <MonthlyBarChart dataPoints={STUB_MONTHLY_DATA} />
        </div>

      </main>

      <BottomNav activePath="/analytics" />
    </div>
  );
}
