import React from 'react';
import {
  Bug,
  ShieldAlert,
  Wrench,
  CheckCircle2,
  FlaskConical,
  TrendingUp,
  RotateCcw,
  Award,
} from 'lucide-react';
import type { SkillCategory, SkillScores } from '../domain/types';

export interface SkillDashboardProps {
  scores: SkillScores;
  recentUpdate?: {
    category: SkillCategory;
    delta: number;
  } | null;
  onReset?: () => void;
}

interface SkillConfig {
  category: SkillCategory;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  colorGradient: string;
}

export const SKILL_CONFIGS: SkillConfig[] = [
  {
    category: 'bug-detection',
    label: 'Bug Detection',
    description: 'Spotting logic errors, edge cases, and runtime flaws',
    icon: Bug,
    colorGradient: 'from-amber-500 to-rose-500',
  },
  {
    category: 'security',
    label: 'Security',
    description: 'Vulnerability prevention, sanitization, and auth patterns',
    icon: ShieldAlert,
    colorGradient: 'from-rose-500 to-red-600',
  },
  {
    category: 'maintainability',
    label: 'Maintainability',
    description: 'Readability, refactoring, DRY, and architecture patterns',
    icon: Wrench,
    colorGradient: 'from-indigo-500 to-purple-500',
  },
  {
    category: 'type-safety',
    label: 'Type Safety',
    description: 'Strict typing, eliminating any/unknown, and sound interfaces',
    icon: CheckCircle2,
    colorGradient: 'from-sky-500 to-blue-500',
  },
  {
    category: 'testing',
    label: 'Testing',
    description: 'TDD, test coverage, assertions, and mock boundaries',
    icon: FlaskConical,
    colorGradient: 'from-emerald-500 to-teal-500',
  },
];

export function getProficiencyTier(score: number): {
  name: 'Novice' | 'Proficient' | 'Master';
  colorClass: string;
} {
  if (score >= 80) {
    return {
      name: 'Master',
      colorClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    };
  }
  if (score >= 60) {
    return {
      name: 'Proficient',
      colorClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    };
  }
  return {
    name: 'Novice',
    colorClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  };
}

export const SkillDashboard: React.FC<SkillDashboardProps> = ({
  scores,
  recentUpdate,
  onReset,
}) => {
  // Calculate average overall proficiency
  const categories = SKILL_CONFIGS.map((c) => c.category);
  const totalScore = categories.reduce((sum, cat) => sum + (scores[cat] ?? 0), 0);
  const averageScore = Math.round(totalScore / categories.length);
  const overallTier = getProficiencyTier(averageScore);

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl backdrop-blur-sm">
      {/* Dashboard header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-400" />
              Skill Proficiency
            </h2>
            <span
              className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${overallTier.colorClass}`}
            >
              Overall: {overallTier.name} ({averageScore}%)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time mastery levels across key software engineering review dimensions.
          </p>
        </div>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            title="Reset skill progress"
            aria-label="Reset skills"
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Progress</span>
          </button>
        )}
      </div>

      {/* Grid of skills */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {SKILL_CONFIGS.map((config) => {
          const score = scores[config.category] ?? 0;
          const clampedScore = Math.min(100, Math.max(0, score));
          const tier = getProficiencyTier(clampedScore);
          const isRecentlyUpdated =
            recentUpdate != null &&
            recentUpdate.category === config.category &&
            recentUpdate.delta > 0;
          const Icon = config.icon;

          return (
            <div
              key={config.category}
              className={`relative flex flex-col justify-between p-4 rounded-xl border bg-slate-950/60 transition-all duration-300 ${
                isRecentlyUpdated
                  ? 'border-emerald-500/50 ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-500/5'
                  : 'border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Category Icon, Title, and Tier */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                    <Icon className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isRecentlyUpdated && (
                      <span
                        data-testid={`delta-${config.category}`}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse shadow-sm shadow-emerald-500/20"
                      >
                        <TrendingUp className="w-3 h-3" />
                        <span>
                          {recentUpdate.delta > 0
                            ? `+${recentUpdate.delta}`
                            : recentUpdate.delta}
                        </span>
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md border ${tier.colorClass}`}
                    >
                      {tier.name}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-slate-100 tracking-tight">
                  {config.label}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                  {config.description}
                </p>
              </div>

              {/* Progress and score number */}
              <div className="mt-4 pt-3 border-t border-slate-800/60">
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">Score</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-bold text-white tracking-tight">
                      {clampedScore}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">/ 100</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-slate-700/40">
                  <div
                    role="progressbar"
                    aria-label={config.label}
                    aria-valuenow={clampedScore}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    style={{ width: `${clampedScore}%` }}
                    className={`h-full rounded-full bg-gradient-to-r ${config.colorGradient} transition-all duration-500 ease-out`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SkillDashboard;
