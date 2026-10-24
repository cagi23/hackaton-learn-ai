import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  AlertCircle,
  Info,
  ArrowLeft,
  Sparkles,
  GraduationCap,
  BookOpen,
  Check,
  Copy,
  Zap,
  Code2,
  CheckCircle2,
} from 'lucide-react';
import type { FindingSeverity, ReviewFinding } from '../domain/types';

export interface FindingDetailProps {
  finding: ReviewFinding;
  onBack?: () => void;
  onStartChallenge: (finding: ReviewFinding) => void;
}

const SEVERITY_BADGE_STYLES: Record<
  FindingSeverity,
  { label: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
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

interface CodeBlockProps {
  code: string;
  label: string;
  variant: 'problem' | 'solution';
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, label, variant }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Fallback silently if clipboard permissions fail
    }
  };

  const isProblem = variant === 'problem';

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-all ${
        isProblem
          ? 'border-red-500/30 bg-slate-950/90 shadow-sm'
          : 'border-emerald-500/30 bg-slate-950/90 shadow-sm'
      }`}
    >
      {/* Code Block Header */}
      <div
        className={`flex items-center justify-between px-4 py-2 border-b text-xs font-semibold ${
          isProblem
            ? 'bg-red-950/20 border-red-500/20 text-red-300'
            : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300'
        }`}
      >
        <div className="flex items-center gap-2">
          {isProblem ? (
            <Code2 className="w-3.5 h-3.5 text-red-400" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span>{label}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copy ${label.toLowerCase()}`}
          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px]"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-slate-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <pre className="p-4 font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export const FindingDetail: React.FC<FindingDetailProps> = ({
  finding,
  onBack,
  onStartChallenge,
}) => {
  const severityInfo = SEVERITY_BADGE_STYLES[finding.severity];
  const SeverityIcon = severityInfo.icon;
  const categoryLabel = finding.category.replace('-', ' ').toUpperCase();

  return (
    <div
      data-testid={`finding-detail-${finding.id}`}
      className="space-y-6 max-w-4xl mx-auto"
    >
      {/* Navigation / Header Actions */}
      {onBack && (
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Findings</span>
          </button>
        </div>
      )}

      {/* Main Title & Badges Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-sm p-6 sm:p-7 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          {/* Combined Severity & Category Pill */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border ${severityInfo.badgeClass}`}
          >
            <SeverityIcon className="w-3.5 h-3.5" />
            <span>{severityInfo.label}</span>
            <span className="opacity-40">·</span>
            <span>{categoryLabel}</span>
          </span>
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
          {finding.title}
        </h2>

        {/* Initial Overview / Description */}
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
          {finding.description}
        </p>
      </div>

      {/* Problematic Code Section (if present) */}
      {finding.affectedCode && (
        <div className="space-y-2">
          <CodeBlock
            code={finding.affectedCode}
            label="Problematic Code"
            variant="problem"
          />
        </div>
      )}

      {/* "WHY DOES THIS MATTER?" Callout Box */}
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/50 via-slate-900 to-purple-950/30 p-6 sm:p-7 shadow-xl shadow-indigo-950/20 space-y-3">
        <div className="flex items-center gap-2.5 text-indigo-300 font-bold text-sm sm:text-base uppercase tracking-wider">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3>WHY DOES THIS MATTER?</h3>
        </div>
        <p className="text-slate-200 text-sm sm:text-base leading-relaxed pl-0 sm:pl-1">
          {finding.whyItMatters}
        </p>
      </div>

      {/* "ENGINEERING PRINCIPLE" Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-7 space-y-3 shadow-md">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <GraduationCap className="w-4 h-4 text-indigo-400" />
          <h4>ENGINEERING PRINCIPLE</h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-200 border border-indigo-500/30 font-semibold text-sm sm:text-base">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>{finding.principle}</span>
          </span>
        </div>
      </div>

      {/* "HOW TO IMPROVE IT & CODE COMPARISON" Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-7 space-y-4 shadow-md">
        <div className="space-y-1.5">
          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            HOW TO IMPROVE IT
          </h4>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            {finding.suggestion}
          </p>
        </div>

        {/* Improved Code Block */}
        {finding.improvedCode && (
          <div className="pt-2">
            <CodeBlock
              code={finding.improvedCode}
              label="Improved Code"
              variant="solution"
            />
          </div>
        )}
      </div>

      {/* "CHALLENGE ME" Call-To-Action Box */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-slate-900 to-orange-950/20 p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xl shadow-amber-950/10">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center justify-center sm:justify-start gap-2">
            <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
            <span>Ready to Test Your Understanding?</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-300">
            Answer a quick deliberate practice challenge on this finding to level up your engineering skills.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onStartChallenge(finding)}
          className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold text-amber-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 border border-amber-300 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400/50 cursor-pointer active:scale-[0.98]"
        >
          <Zap className="w-4 h-4 fill-amber-950" />
          <span>Challenge Me</span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-950/15 text-amber-950">
            +3 Skill Points
          </span>
        </button>
      </div>
    </div>
  );
};
