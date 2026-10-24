import React from 'react';
import { CheckCircle2, AlertOctagon, AlertTriangle, AlertCircle, Info, Layers } from 'lucide-react';
import type { CodeReviewSummary, FindingSeverity, ReviewFinding } from '../domain/types';

export interface ReviewSummaryProps {
  summary: CodeReviewSummary;
  findings: ReviewFinding[];
  selectedSeverityFilter?: FindingSeverity | 'all';
  onFilterBySeverity?: (severity: FindingSeverity | 'all') => void;
}

const SEVERITY_CONFIG: Record<
  FindingSeverity,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    baseClass: string;
    activeClass: string;
    countClass: string;
  }
> = {
  critical: {
    label: 'Critical',
    icon: AlertOctagon,
    baseClass: 'border-red-500/30 bg-red-950/20 text-red-300 hover:border-red-500/60 hover:bg-red-950/40',
    activeClass: 'ring-2 ring-red-500 bg-red-950/60 border-red-500 text-red-200 shadow-lg shadow-red-950/50',
    countClass: 'bg-red-500/20 text-red-300 border border-red-500/30',
  },
  high: {
    label: 'High',
    icon: AlertTriangle,
    baseClass: 'border-amber-500/30 bg-amber-950/20 text-amber-300 hover:border-amber-500/60 hover:bg-amber-950/40',
    activeClass: 'ring-2 ring-amber-500 bg-amber-950/60 border-amber-500 text-amber-200 shadow-lg shadow-amber-950/50',
    countClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  },
  medium: {
    label: 'Medium',
    icon: AlertCircle,
    baseClass: 'border-blue-500/30 bg-blue-950/20 text-blue-300 hover:border-blue-500/60 hover:bg-blue-950/40',
    activeClass: 'ring-2 ring-blue-500 bg-blue-950/60 border-blue-500 text-blue-200 shadow-lg shadow-blue-950/50',
    countClass: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  },
  low: {
    label: 'Low',
    icon: Info,
    baseClass: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300 hover:border-emerald-500/60 hover:bg-emerald-950/40',
    activeClass: 'ring-2 ring-emerald-500 bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-950/50',
    countClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  },
};

export const ReviewSummary: React.FC<ReviewSummaryProps> = ({
  summary,
  findings,
  selectedSeverityFilter = 'all',
  onFilterBySeverity,
}) => {
  const counts: Record<FindingSeverity, number> = {
    critical: findings.filter((f) => f.severity === 'critical').length,
    high: findings.filter((f) => f.severity === 'high').length,
    medium: findings.filter((f) => f.severity === 'medium').length,
    low: findings.filter((f) => f.severity === 'low').length,
  };

  const totalCount = findings.length;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-5 sm:p-6 shadow-xl space-y-5">
      {/* Top Banner: Status & Overall Quality */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Header badge */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
            REVIEW COMPLETE
          </span>

          {/* Quality status badge */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/80 text-slate-200 border border-slate-700">
            Status: <span className="text-white font-bold">{summary.overallQuality}</span>
          </span>
        </div>

        {/* Total findings count badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs font-medium text-slate-300">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span className="text-white font-semibold">{totalCount} Findings</span>
        </div>
      </div>

      {/* Severity Breakdown Cards / Filter Buttons */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
            Severity Breakdown
          </span>
          {onFilterBySeverity && (
            <button
              type="button"
              onClick={() => onFilterBySeverity('all')}
              aria-pressed={selectedSeverityFilter === 'all'}
              className={`text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
                selectedSeverityFilter === 'all'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              All ({totalCount})
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {(['critical', 'high', 'medium', 'low'] as FindingSeverity[]).map((severity) => {
            const config = SEVERITY_CONFIG[severity];
            const Icon = config.icon;
            const count = counts[severity];
            const isSelected = selectedSeverityFilter === severity;

            return (
              <button
                key={severity}
                type="button"
                onClick={() => onFilterBySeverity?.(severity)}
                aria-pressed={isSelected}
                className={`relative flex items-center justify-between p-3 sm:p-3.5 rounded-xl border text-left transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-900 ${
                  isSelected ? config.activeClass : config.baseClass
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold capitalize truncate">
                    {config.label}
                  </span>
                </div>
                <span
                  className={`ml-2 px-2 py-0.5 rounded-md text-xs font-bold tabular-nums shrink-0 ${config.countClass}`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
