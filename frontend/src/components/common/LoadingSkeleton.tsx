import React from 'react';

export const LoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => {
  return (
    <div className="w-full space-y-4 animate-pulse">
      <div className="h-8 bg-slate-800 rounded-lg w-1/4" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="h-12 bg-slate-800/60 rounded-lg w-full" />
        ))}
      </div>
    </div>
  );
};

