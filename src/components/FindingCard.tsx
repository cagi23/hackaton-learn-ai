import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  AlertCircle,
  Info,
  Zap,
  ArrowRight,
  Bookmark,
  Code2,
} from 'lucide-react';
import type { FindingSeverity, ReviewFinding } from '../domain/types';

export interface FindingCardProps {
  finding: ReviewFinding;
  isSelected?: boolean;
  onSelect: (finding: ReviewFinding) => void;
  onStartChallenge?: (finding: ReviewFinding) => void;
}

const SEVERITY_BADGE_STYLES: Record<FindingSeverity, { label: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }> = {
  critical: {
    label: 'CRITICAL',
    badgeClass: 'bg-red-500/15 text-red-300 border-red-500/30',
    icon: AlertOctagon,
  },
  high: {
    label: 'HIGH',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    icon: AlertTriangle,
  },
  medium: {
    label: 'MEDIUM',
    badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    icon: AlertCircle,
  },
  low: {
    label: 'LOW',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    icon: Info,
  },
};

export const FindingCard: React.FC<FindingCardProps> = ({
  finding,
  isSelected = false,
  onSelect,
  onStartChallenge,
}) => {
  const severityInfo = SEVERITY_BADGE_STYLES[finding.severity];
  const SeverityIcon = severityInfo.icon;
  const categoryLabel = finding.category.replace('-', ' ').toUpperCase();

  return (
    <div
      data-testid={`finding-card-${finding.id}`}
      data-selected={isSelected ? 'true' : 'false'}
      className={`group relative rounded-2xl border p-5 sm:p-6 transition-all duration-200 bg-slate-900/80 backdrop-blur-sm ${
        isSelected
          ? 'border-indigo-500 ring-2 ring-indigo-500/40 shadow-xl shadow-indigo-950/40 bg-slate-900'
          : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/95 shadow-md'
      }`}
    >
      {/* Top Pill / Metadata Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {/* Combined Severity & Category Pill */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border ${severityInfo.badgeClass}`}
          >
            <SeverityIcon className="w-3 h-3" />
            <span>{severityInfo.label}</span>
            <span className="opacity-40">·</span>
            <span>{categoryLabel}</span>
          </span>
        </div>

        {/* Principle Pill */}
        {finding.principle && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60">
            <Bookmark className="w-3 h-3 text-indigo-400" />
            <span className="truncate max-w-[200px] sm:max-w-[280px]">
              {finding.principle}
            </span>
          </span>
        )}
      </div>

      {/* Title & Description */}
      <div className="space-y-1.5 mb-4">
        <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-indigo-200 transition-colors">
          {finding.title}
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          {finding.description}
        </p>
      </div>

      {/* Affected Code Snippet Preview (if present) */}
      {finding.affectedCode && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            <Code2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Affected Code</span>
          </div>
          <pre className="font-mono text-xs bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 sm:p-3.5 text-slate-200 overflow-x-auto whitespace-pre leading-relaxed shadow-inner">
            <code>{finding.affectedCode}</code>
          </pre>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-800/60 mt-4">
        <div className="flex items-center gap-2">
          {/* Explore Issue */}
          <button
            type="button"
            onClick={() => onSelect(finding)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            <span>Explore Issue</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Challenge Me */}
        {onStartChallenge && (
          <button
            type="button"
            onClick={() => onStartChallenge(finding)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-amber-200 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 hover:border-amber-500/60 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Challenge Me</span>
          </button>
        )}
      </div>
    </div>
  );
};
