import React from 'react';
import { AlertCircle } from 'lucide-react';

export const ErrorState: React.FC<{
  message?: string;
  onRetry?: () => void;
}> = ({ message = 'An error occurred while loading content.', onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border border-rose-500/20 rounded-xl bg-rose-500/5 text-rose-300">
      <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
      <p className="text-sm font-medium mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

