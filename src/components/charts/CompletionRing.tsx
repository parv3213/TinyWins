'use client';

import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface CompletionRingProps {
  percentage: number;
}

export default function CompletionRing({ percentage }: CompletionRingProps) {
  // Ensure percentage is between 0 and 100
  const validPercentage = Math.max(0, Math.min(100, percentage));
  
  const data = {
    labels: ['Completed', 'Remaining'],
    datasets: [
      {
         data: [validPercentage, 100 - validPercentage],
         backgroundColor: [
            'var(--success)', // Green
            'var(--border)'   // Empty track
         ],
         borderWidth: 0,
         cutout: '80%', // Thin ring
         borderRadius: [10, 0] // Rounded edges on the progress bar
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    },
    animation: {
       animateScale: true,
       animateRotate: true,
       duration: 1500,
       easing: 'easeOutQuart' as const
    }
  };

  return (
    <div className="relative w-full h-[140px] flex items-center justify-center">
      <Doughnut data={data} options={options} />
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
         <span className="stat-number text-3xl">{Math.round(validPercentage)}%</span>
         <span className="text-[0.65rem] uppercase tracking-wider text-[var(--muted-fg)] font-medium mt-[-4px]">Weekly</span>
      </div>
    </div>
  );
}
