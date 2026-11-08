import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingFallbackProps {
  message?: string;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({ message }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 min-h-[300px]">
      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 shadow-sm">
        <Loader2 className="animate-spin" size={24} />
      </div>
      {message && (
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};
