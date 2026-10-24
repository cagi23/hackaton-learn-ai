import React, { useState, useEffect } from 'react';
import {
  X,
  Zap,
  CheckCircle2,
  XCircle,
  Code2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Lightbulb,
} from 'lucide-react';
import type {
  FindingCategory,
  ReviewChallenge,
  SkillCategory,
} from '../domain/types';
import {
  skillService,
  mapCategoryToSkillCategory,
} from '../services/SkillService';
import {
  challengeService,
  type ChallengeEvaluationResult,
} from '../services/ChallengeService';

export interface ChallengeModalProps {
  challenge: ReviewChallenge;
  findingTitle: string;
  category: FindingCategory;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (result: {
    isCorrect: boolean;
    skillCategory: SkillCategory;
    oldScore: number;
    newScore: number;
  }) => void;
}

function formatCategoryName(cat: FindingCategory | SkillCategory): string {
  return cat
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export const ChallengeModal: React.FC<ChallengeModalProps> = ({
  challenge,
  findingTitle,
  category,
  isOpen,
  onClose,
  onComplete,
}) => {
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<ChallengeEvaluationResult | null>(null);
  const [scoreDelta, setScoreDelta] = useState<{
    oldScore: number;
    newScore: number;
  } | null>(null);

  // Reset state on modal open or challenge change
  useEffect(() => {
    if (isOpen) {
      setSelectedAnswerId(null);
      setIsSubmitted(false);
      setEvaluation(null);
      setScoreDelta(null);
    }
  }, [isOpen, challenge]);

  // Handle ESC key to dismiss modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const skillCategory = mapCategoryToSkillCategory(category);
  const categoryDisplayName = formatCategoryName(category);
  const skillDisplayName = formatCategoryName(skillCategory);

  const handleSubmit = () => {
    if (!selectedAnswerId || isSubmitted) return;

    const evalResult = challengeService.evaluateAnswer(
      challenge,
      selectedAnswerId,
      category
    );
    setEvaluation(evalResult);
    setIsSubmitted(true);

    const currentScores = skillService.getScores();
    let oldScore = currentScores[skillCategory];
    let newScore = oldScore;

    if (evalResult.isCorrect) {
      const updateResult = skillService.updateScore(category, 3);
      oldScore = updateResult.oldScore;
      newScore = updateResult.newScore;
      setScoreDelta({ oldScore, newScore });
    } else {
      setScoreDelta({ oldScore, newScore });
    }

    onComplete?.({
      isCorrect: evalResult.isCorrect,
      skillCategory,
      oldScore,
      newScore,
    });
  };

  return (
    <div
      data-testid="challenge-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="challenge-modal-title"
    >
      <div
        data-testid="challenge-modal-content"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-800/80 bg-slate-900/90 shrink-0">
          <div className="space-y-1.5 pr-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <Zap className="w-3 h-3 fill-amber-400" />
                <span>Deliberate Practice Challenge</span>
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                {categoryDisplayName}
              </span>
            </div>
            <h2
              id="challenge-modal-title"
              className="text-lg sm:text-xl font-bold text-white tracking-tight"
            >
              {findingTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close challenge"
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-700 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Question Prompt */}
          <div className="space-y-3">
            <h3 className="text-base sm:text-lg font-semibold text-slate-100 leading-snug">
              {challenge.question}
            </h3>

            {/* Optional Monospace Code Snippet */}
            {challenge.code && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/90 overflow-hidden shadow-inner">
                <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-900/80 border-b border-slate-800/80 text-[11px] font-mono text-slate-400">
                  <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Code Context</span>
                </div>
                <pre className="p-4 font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre leading-relaxed">
                  <code>{challenge.code}</code>
                </pre>
              </div>
            )}
          </div>

          {/* Answer Options */}
          <div className="space-y-3" role="group" aria-label="Challenge answers">
            {challenge.answers.map((answer, index) => {
              const letter = String.fromCharCode(65 + index);
              const isSelected = selectedAnswerId === answer.id;
              const isCorrectAnswer = answer.id === challenge.correctAnswerId;

              let cardStyles =
                'border-slate-800 bg-slate-900/60 hover:bg-slate-800/60 hover:border-slate-700 text-slate-200';
              let badgeStyles = 'bg-slate-800 text-slate-300 border-slate-700';

              if (!isSubmitted) {
                if (isSelected) {
                  cardStyles =
                    'border-indigo-500 bg-indigo-500/10 text-white ring-1 ring-indigo-500/50 shadow-md shadow-indigo-500/5';
                  badgeStyles = 'bg-indigo-600 text-white border-indigo-500';
                }
              } else {
                // Post-submission styling
                if (isCorrectAnswer) {
                  cardStyles =
                    'border-emerald-500/60 bg-emerald-950/30 text-emerald-100 ring-1 ring-emerald-500/50';
                  badgeStyles = 'bg-emerald-600 text-white border-emerald-500';
                } else if (isSelected && !isCorrectAnswer) {
                  cardStyles =
                    'border-red-500/60 bg-red-950/30 text-red-100 ring-1 ring-red-500/50';
                  badgeStyles = 'bg-red-600 text-white border-red-500';
                } else {
                  cardStyles = 'border-slate-800/60 bg-slate-900/30 text-slate-400 opacity-60';
                  badgeStyles = 'bg-slate-800/80 text-slate-500 border-slate-800';
                }
              }

              return (
                <button
                  key={answer.id}
                  type="button"
                  aria-pressed={isSelected}
                  disabled={isSubmitted}
                  onClick={() => !isSubmitted && setSelectedAnswerId(answer.id)}
                  className={`w-full flex items-start gap-3.5 p-4 rounded-xl border text-left transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer disabled:cursor-default ${cardStyles}`}
                >
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold shrink-0 border transition-colors ${badgeStyles}`}
                  >
                    {letter}
                  </span>

                  <div className="flex-1 text-sm leading-relaxed pt-0.5">
                    {answer.text}
                  </div>

                  {isSubmitted && isCorrectAnswer && (
                    <div className="shrink-0 flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Correct Answer</span>
                    </div>
                  )}

                  {isSubmitted && isSelected && !isCorrectAnswer && (
                    <div className="shrink-0 flex items-center gap-1 text-xs font-semibold text-red-400 bg-red-950/60 px-2 py-0.5 rounded-md border border-red-500/30">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Your Answer</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Submission Result Feedback */}
          {isSubmitted && evaluation && (
            <div className="space-y-4 pt-2">
              {evaluation.isCorrect ? (
                <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-emerald-950/20 p-5 shadow-lg shadow-emerald-950/20 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-emerald-300 font-bold text-base">
                      <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <span>Correct! Well Done.</span>
                    </div>

                    {scoreDelta && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-bold tracking-wide">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        <span>
                          {skillDisplayName}: {scoreDelta.oldScore} → {scoreDelta.newScore}
                        </span>
                        <span className="text-emerald-300 bg-emerald-500/30 px-1.5 py-0.5 rounded-md font-mono">
                          +3
                        </span>
                        <span>↑</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed">
                    Great intuition! Deliberate practice reinforces robust engineering principles.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-950/40 via-slate-900 to-red-950/20 p-5 shadow-lg shadow-amber-950/20 space-y-2">
                  <div className="flex items-center gap-2.5 text-amber-300 font-bold text-base">
                    <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <XCircle className="w-4 h-4 text-amber-400" />
                    </div>
                    <span>Not quite right.</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Engineering growth comes from analyzing edge cases. Check the explanation below to master this concept.
                  </p>
                </div>
              )}

              {/* In-Depth Explanation Box */}
              <div className="rounded-2xl border border-indigo-500/30 bg-slate-950/60 p-5 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  <Lightbulb className="w-4 h-4" />
                  <h4>Why is this the correct answer?</h4>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {challenge.explanation}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-6 border-t border-slate-800/80 bg-slate-900/90 flex items-center justify-end gap-3 shrink-0">
          {!isSubmitted ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedAnswerId}
                onClick={handleSubmit}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer active:scale-[0.98]"
              >
                <span>Check Answer</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer active:scale-[0.98]"
            >
              <span>Continue Reviewing</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
