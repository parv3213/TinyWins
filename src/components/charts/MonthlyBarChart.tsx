'use client';

import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface MonthlyBarChartProps {
  dataPoints: { date: string; positive: number; negative: number }[];
}

export default function MonthlyBarChart({ dataPoints }: MonthlyBarChartProps) {
  
  // Format labels (just the day number, e.g., "15")
  const labels = dataPoints.map(dp => {
     const d = new Date(dp.date);
     return d.getDate().toString();
  });
  
  const positiveData = dataPoints.map(dp => dp.positive);
  const negativeData = dataPoints.map(dp => dp.negative);

  const data = {
    labels,
    datasets: [
      {
        label: 'Good Habits',
        data: positiveData,
        backgroundColor: 'var(--success)',
        borderRadius: 4,
        barPercentage: 0.8,
        categoryPercentage: 0.9,
      },
      {
        label: 'Bad Habits',
        data: negativeData,
        backgroundColor: 'var(--danger)',
        borderRadius: 4,
        barPercentage: 0.8,
        categoryPercentage: 0.9,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
       legend: { display: false },
       tooltip: {
          backgroundColor: 'rgba(74, 63, 53, 0.9)',
          titleFont: { family: 'var(--font-body)', size: 13 },
          bodyFont: { family: 'var(--font-body)', size: 12 },
          padding: 10,
          cornerRadius: 8,
          displayColors: true,
       }
    },
    scales: {
       x: {
          stacked: true,
          grid: { display: false, drawBorder: false },
          ticks: {
             font: { family: 'var(--font-body)', size: 10 },
             color: 'var(--muted-fg)',
             maxTicksLimit: 15 // Don't crowd the x axis on mobile
          }
       },
       y: {
          stacked: true,
          grid: { color: 'var(--border)', borderDash: [4, 4], drawBorder: false },
          ticks: {
             font: { family: 'var(--font-body)', size: 10 },
             color: 'var(--muted-fg)',
             stepSize: 2 // Assuming max ~10 habits/day
          },
          beginAtZero: true
       }
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart' as const
    }
  };

  return (
    <div className="w-full h-[200px]">
      <Bar data={data} options={options} />
    </div>
  );
}
