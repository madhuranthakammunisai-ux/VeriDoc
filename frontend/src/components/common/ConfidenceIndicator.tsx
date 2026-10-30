import React from 'react';

export const ConfidenceIndicator: React.FC<{ score: number | null | undefined; showPercentage?: boolean }> = ({
  score,
  showPercentage = true,
}) => {
  if (score === null || score === undefined) {
    return <span className="text-xs text-slate-500">—</span>;
  }

  const pct = Math.round(score * 100);
  let colorClass = 'text-emerald-400 bg-emerald-500/20';
  let barColor = 'bg-emerald-500';

  if (pct < 70) {
    colorClass = 'text-rose-400 bg-rose-500/20';
    barColor = 'bg-rose-500';
  } else if (pct < 85) {
    colorClass = 'text-amber-400 bg-amber-500/20';
    barColor = 'bg-amber-500';
  }

  return (
    <div className="inline-flex items-center space-x-2">
      <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      {showPercentage && (
        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${colorClass}`}>
          {pct}%
        </span>
      )}
    </div>
  );
};

