'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export type TowerGranularity = 'daily' | 'weekly' | 'monthly';

export interface DailyBucket {
  /** YYYY-MM-DD (local) */
  date: string;
  good: number;
  bad: number;
}

interface GoodBadTowerProps {
  /** Chronological daily buckets (oldest → newest). Missing days should be present with good=0 bad=0. */
  buckets: DailyBucket[];
  granularity: TowerGranularity;
}

interface AggregatedBar {
  label: string;
  tooltipTitle: string;
  good: number;
  bad: number;
}

const parseLocalDate = (dateStr: string): Date => new Date(`${dateStr}T00:00:00`);

const formatShortDate = (d: Date): string =>
  d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

/** ISO week key: YYYY-Www (Monday-start). */
const isoWeekKey = (d: Date): { key: string; weekStart: Date } => {
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  const weekStart = new Date(d);
  const dow = weekStart.getDay() || 7;
  weekStart.setDate(weekStart.getDate() - (dow - 1));
  weekStart.setHours(0, 0, 0, 0);
  return { key: `${target.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`, weekStart };
};

const aggregate = (buckets: DailyBucket[], granularity: TowerGranularity, now: Date): AggregatedBar[] => {
  if (granularity === 'daily') {
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 29);
    cutoff.setHours(0, 0, 0, 0);
    return buckets
      .filter((b) => parseLocalDate(b.date) >= cutoff)
      .map((b) => {
        const d = parseLocalDate(b.date);
        return {
          label: String(d.getDate()),
          tooltipTitle: formatShortDate(d),
          good: b.good,
          bad: b.bad,
        };
      });
  }

  if (granularity === 'weekly') {
    const groups = new Map<string, { weekStart: Date; good: number; bad: number }>();
    for (const b of buckets) {
      const d = parseLocalDate(b.date);
      const { key, weekStart } = isoWeekKey(d);
      const existing = groups.get(key);
      if (existing) {
        existing.good += b.good;
        existing.bad += b.bad;
      } else {
        groups.set(key, { weekStart, good: b.good, bad: b.bad });
      }
    }
    const sorted = Array.from(groups.values()).sort(
      (a, b) => a.weekStart.getTime() - b.weekStart.getTime(),
    );
    const last12 = sorted.slice(-12);
    return last12.map((g) => {
      const end = new Date(g.weekStart);
      end.setDate(end.getDate() + 6);
      return {
        label: formatShortDate(g.weekStart),
        tooltipTitle: `${formatShortDate(g.weekStart)} – ${formatShortDate(end)}`,
        good: g.good,
        bad: g.bad,
      };
    });
  }

  // monthly
  const groups = new Map<string, { monthStart: Date; good: number; bad: number }>();
  for (const b of buckets) {
    const d = parseLocalDate(b.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const existing = groups.get(key);
    if (existing) {
      existing.good += b.good;
      existing.bad += b.bad;
    } else {
      groups.set(key, {
        monthStart: new Date(d.getFullYear(), d.getMonth(), 1),
        good: b.good,
        bad: b.bad,
      });
    }
  }
  const sorted = Array.from(groups.values()).sort(
    (a, b) => a.monthStart.getTime() - b.monthStart.getTime(),
  );
  const last12 = sorted.slice(-12);
  return last12.map((g) => ({
    label: g.monthStart.toLocaleDateString(undefined, { month: 'short' }),
    tooltipTitle: g.monthStart.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    good: g.good,
    bad: g.bad,
  }));
};

export default function GoodBadTower({ buckets, granularity }: GoodBadTowerProps) {
  const bars = useMemo(() => aggregate(buckets, granularity, new Date()), [buckets, granularity]);

  const [colors, setColors] = useState({
    success: '#4a7c59',
    danger: '#9c4b4b',
    mutedFg: '#8a8178',
    border: '#e5ddd1',
  });

  useEffect(() => {
    const root = getComputedStyle(document.documentElement);
    const read = (name: string, fallback: string) =>
      root.getPropertyValue(name).trim() || fallback;
    setColors({
      success: read('--success', '#4a7c59'),
      danger: read('--danger', '#9c4b4b'),
      mutedFg: read('--muted-fg', '#8a8178'),
      border: read('--border', '#e5ddd1'),
    });
  }, []);

  const hasData = bars.some((b) => b.good > 0 || b.bad > 0);

  const data = {
    labels: bars.map((b) => b.label),
    datasets: [
      {
        label: 'Good',
        data: bars.map((b) => b.good),
        backgroundColor: colors.success,
        borderRadius: 4,
        barPercentage: 0.85,
        categoryPercentage: 0.9,
      },
      {
        label: 'Bad',
        data: bars.map((b) => b.bad),
        backgroundColor: colors.danger,
        borderRadius: 4,
        barPercentage: 0.85,
        categoryPercentage: 0.9,
      },
    ],
  };

  const titles = bars.map((b) => b.tooltipTitle);

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
        callbacks: {
          title: (items: { dataIndex: number }[]) => {
            const idx = items[0]?.dataIndex ?? 0;
            return titles[idx] ?? '';
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false, drawBorder: false },
        ticks: {
          font: { family: 'var(--font-body)', size: 10 },
          color: colors.mutedFg,
          maxTicksLimit: granularity === 'daily' ? 15 : 12,
        },
      },
      y: {
        stacked: true,
        grid: { color: colors.border, borderDash: [4, 4], drawBorder: false },
        ticks: {
          font: { family: 'var(--font-body)', size: 10 },
          color: colors.mutedFg,
          precision: 0,
        },
        beginAtZero: true,
      },
    },
    animation: {
      duration: 600,
      easing: 'easeOutQuart' as const,
    },
  };

  if (!hasData) {
    return (
      <div className="w-full h-[240px] flex items-center justify-center text-sm text-[var(--muted-fg)]">
        No data yet — log a day to see your tower grow.
      </div>
    );
  }

  return (
    <div className="w-full h-[240px]">
      <Bar data={data} options={options} />
    </div>
  );
}
