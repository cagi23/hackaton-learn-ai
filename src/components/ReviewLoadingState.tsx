import React, { useState, useEffect } from 'react';
import {
  Bug,
  CheckCircle,
  CheckCircle2,
  Wrench,
  Sparkles,
  Loader2,
  Brain,
} from 'lucide-react';

export interface ReviewStage {
  id: string;
  label: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const DEFAULT_STAGES: ReviewStage[] = [
  {
    id: 'correctness',
    label: 'Checking correctness & runtime bugs',
    detail: 'Inspecting logic branches, edge cases, and runtime exceptions',
    icon: Bug,
  },
  {
    id: 'type-safety',
    label: 'Checking type safety & null guarantees',
    detail: 'Validating type sound interfaces and non-nullable assertions',
    icon: CheckCircle,
  },
  {
    id: 'maintainability',
    label: 'Analyzing maintainability & design principles',
    detail: 'Evaluating clean architecture, readability, and SOLID principles',
    icon: Wrench,
  },
  {
    id: 'challenges',
    label: 'Preparing deliberate practice challenges',
    detail: 'Generating personalized interactive exercises to reinforce learning',
    icon: Sparkles,
  },
];

export interface ReviewLoadingStateProps {
  currentStage?: number; // Optional controlled step (0..3)
  statusMessage?: string;
  stages?: ReviewStage[];
}

export const ReviewLoadingState: React.FC<ReviewLoadingStateProps> = ({
  currentStage,
  statusMessage,
  stages = DEFAULT_STAGES,
}) => {
  const [internalStage, setInternalStage] = useState<number>(0);

  useEffect(() => {
    if (currentStage !== undefined) {
      return;
    }

    const interval = setInterval(() => {
      setInternalStage((prev) => (prev < stages.length - 1 ? prev + 1 : prev));
    }, 1000);

    return () => clearInterval(interval);
  }, [currentStage, stages.length]);

  const activeStageIndex = currentStage !== undefined ? currentStage : internalStage;
  const progressPercent = Math.min(
    100,
    Math.round(((Math.min(activeStageIndex + 1, stages.length)) / stages.length) * 100)
  );

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="w-full max-w-2xl mx-auto p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur space-y-6"
    >
      {/* Header section with spinner and title */}
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Reviewing your code...
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            ReviewLens AI Mentor Analyzing...
          </p>
        </div>

        {statusMessage && (
          <div className="px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-indigo-300 font-mono tracking-wide">
            {statusMessage}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs font-medium text-slate-400">
          <span>Analysis Progress</span>
          <span className="font-mono text-indigo-300">{progressPercent}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden p-0.5 border border-slate-700/50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Domain-specific Inspection Stages */}
      <div className="space-y-2.5 pt-2">
        {stages.map((stage, idx) => {
          const isCompleted = idx < activeStageIndex;
          const isInProgress = idx === activeStageIndex;
          const isPending = idx > activeStageIndex;

          const stageStatus = isCompleted
            ? 'completed'
            : isInProgress
            ? 'in-progress'
            : 'pending';

          const StageIcon = stage.icon;

          return (
            <div
              key={stage.id}
              data-testid="loading-stage-item"
              data-stage-status={stageStatus}
              className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all duration-300 ${
                isCompleted
                  ? 'bg-slate-950/40 border-slate-800/80 text-slate-300'
                  : isInProgress
                  ? 'bg-indigo-950/30 border-indigo-500/40 text-white shadow-sm shadow-indigo-500/5'
                  : 'bg-slate-950/20 border-slate-900 text-slate-500 opacity-60'
              }`}
            >
              {/* Stage status indicator icon */}
              <div className="mt-0.5 shrink-0">
                {isCompleted ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                ) : isInProgress ? (
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-800/40 border border-slate-700/40 flex items-center justify-center text-slate-600">
                    <div className="w-2 h-2 rounded-full bg-slate-700" />
                  </div>
                )}
              </div>

              {/* Stage content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <StageIcon
                    className={`w-4 h-4 shrink-0 ${
                      isCompleted
                        ? 'text-emerald-400'
                        : isInProgress
                        ? 'text-indigo-400'
                        : 'text-slate-600'
                    }`}
                  />
                  <span
                    className={`text-sm font-semibold truncate ${
                      isCompleted
                        ? 'text-slate-200'
                        : isInProgress
                        ? 'text-white'
                        : 'text-slate-500'
                    }`}
                  >
                    {stage.label}
                  </span>
                </div>
                <p
                  className={`text-xs mt-0.5 ${
                    isInProgress ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {stage.detail}
                </p>
              </div>

              {/* Status pill badge */}
              <div className="shrink-0 text-[11px] font-medium font-mono uppercase tracking-wider px-2 py-0.5 rounded">
                {isCompleted && (
                  <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Done
                  </span>
                )}
                {isInProgress && (
                  <span className="text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded border border-indigo-500/30 animate-pulse">
                    Analyzing
                  </span>
                )}
                {isPending && (
                  <span className="text-slate-600 bg-slate-800/30 px-2 py-0.5 rounded border border-slate-800/50">
                    Queued
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Informational pedagogy callout */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-950/30 border border-indigo-900/60 text-indigo-200 text-xs sm:text-sm">
        <Brain className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed text-slate-300 text-xs">
          <p>
            <span className="font-semibold text-indigo-300">
              ReviewLens doesn't just find defects — it generates interactive challenges to test your understanding.
            </span>
          </p>
          <p className="text-slate-400">
            While you wait, our reasoning engine prepares deliberate practice questions directly from your code's context.
          </p>
        </div>
      </div>
    </div>
  );
};
