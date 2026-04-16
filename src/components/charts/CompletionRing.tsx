'use client';

interface CompletionRingProps {
  percentage: number;
  label?: string;
}

export default function CompletionRing({ percentage, label = 'Weekly' }: CompletionRingProps) {
  const pct = Math.max(0, Math.min(100, Math.round(percentage)));

  // SVG ring math
  const size = 140;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

  return (
    <div className="relative w-full h-[140px] flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block"
        aria-label={`${pct}% ${label}`}
        role="img"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--border)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--success)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dash} ${c - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 700ms ease' }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="stat-number text-3xl">{pct}%</span>
        <span className="text-[0.65rem] uppercase tracking-wider text-[var(--muted-fg)] font-medium mt-[-4px]">
          {label}
        </span>
      </div>
    </div>
  );
}
