import React from 'react';
import { AlertTriangle, RotateCcw, X } from 'lucide-react';

export interface ErrorAlertProps {
  title: string;
  message: string;
  showMockFallback?: boolean;
  onSwitchToMock?: () => void;
  onDismiss: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title,
  message,
  showMockFallback = false,
  onSwitchToMock,
  onDismiss,
}) => {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-rose-500/30 bg-rose-950/30 backdrop-blur-md p-4 sm:p-5 shadow-lg shadow-rose-950/20 text-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all animate-in fade-in duration-200"
    >
      <div className="flex items-start gap-3.5 flex-1">
        <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-rose-200 tracking-tight">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-rose-300/90 leading-relaxed">
            {message}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
        {showMockFallback && onSwitchToMock && (
          <button
            type="button"
            onClick={onSwitchToMock}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 hover:border-emerald-500/60 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Switch to Mock Mode</span>
          </button>
        )}

        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-600 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>Dismiss</span>
        </button>
      </div>
    </div>
  );
};

export default ErrorAlert;
