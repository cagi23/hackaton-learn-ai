import { useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import type { CodeReview, ReviewFinding, SkillCategory, SkillScores } from './domain/types';
import { reviewService } from './services/ReviewService';
import { skillService } from './services/SkillService';
import { Header } from './components/Header';
import { SkillDashboard } from './components/SkillDashboard';
import { CodeInput } from './components/CodeInput';
import { ReviewLoadingState } from './components/ReviewLoadingState';
import { FindingsList } from './components/FindingsList';
import { FindingDetail } from './components/FindingDetail';
import { ChallengeModal } from './components/ChallengeModal';
import {
  SettingsModal,
  loadStoredConfig,
  saveStoredConfig,
  applyConfigToReviewService,
  type ReviewLensConfig,
} from './components/SettingsModal';
import { ErrorAlert } from './components/ErrorAlert';

export default function App() {
  const [code, setCode] = useState<string>('');
  const [review, setReview] = useState<CodeReview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedFinding, setSelectedFinding] = useState<ReviewFinding | null>(null);
  const [activeChallengeFinding, setActiveChallengeFinding] = useState<ReviewFinding | null>(null);
  const [skillScores, setSkillScores] = useState<SkillScores>(() => skillService.getScores());
  const [recentSkillUpdate, setRecentSkillUpdate] = useState<{
    category: SkillCategory;
    delta: number;
  } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [error, setError] = useState<{
    title: string;
    message: string;
    showMockFallback?: boolean;
  } | null>(null);
  const [activeConfig, setActiveConfig] = useState<ReviewLensConfig>(() => loadStoredConfig());
  const [providerMode, setProviderMode] = useState<'mock' | 'live'>(() => loadStoredConfig().mode);

  // Synchronize reviewService with stored configuration on mount
  useEffect(() => {
    applyConfigToReviewService(activeConfig);
  }, []);

  const handleResetSkills = () => {
    const resetValues = skillService.resetScores();
    setSkillScores(resetValues);
    setRecentSkillUpdate(null);
  };

  const handleSwitchToMock = () => {
    const updatedConfig: ReviewLensConfig = { ...activeConfig, mode: 'mock' };
    saveStoredConfig(updatedConfig);
    applyConfigToReviewService(updatedConfig);
    setActiveConfig(updatedConfig);
    setProviderMode('mock');
    setError(null);
  };

  const handleSubmitReview = async () => {
    if (!code || !code.trim()) {
      setError({
        title: 'Empty Code Input',
        message: 'Please provide or load a code snippet before requesting a review.',
        showMockFallback: false,
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const reviewResult = await reviewService.reviewCode(code);
      setReview(reviewResult);
      setSelectedFinding(null);
    } catch (err: unknown) {
      const isLive = providerMode === 'live';
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while reviewing your code.';
      const isApiOrNetworkIssue =
        isLive || /api|key|quota|unauthorized|network|fetch|rate limit/i.test(errorMessage);

      setError({
        title: isLive ? 'AI Review Request Failed' : 'Review Failed',
        message: errorMessage,
        showMockFallback: isApiOrNetworkIssue,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const providerDisplayName =
    providerMode === 'live'
      ? activeConfig.model || (activeConfig.providerType === 'openai' ? 'OpenAI' : 'Google Gemini')
      : 'Mock Provider';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Application Header */}
      <Header
        providerName={providerDisplayName}
        isLiveMode={providerMode === 'live'}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onResetSkills={handleResetSkills}
      />

      {/* Global Error Banner */}
      {error && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-5">
          <ErrorAlert
            title={error.title}
            message={error.message}
            showMockFallback={error.showMockFallback}
            onSwitchToMock={handleSwitchToMock}
            onDismiss={() => setError(null)}
          />
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Section 1: Developer Skill Dashboard */}
        <section aria-label="Developer Skill Dashboard">
          <SkillDashboard
            scores={skillScores}
            recentUpdate={recentSkillUpdate}
            onReset={handleResetSkills}
          />
        </section>

        {/* Section 2: Main Review Workflow Area */}
        <section aria-label="Code Review Workspace" className="space-y-6">
          {isLoading && <ReviewLoadingState />}

          {!isLoading && !review && (
            <CodeInput
              code={code}
              onChange={setCode}
              onSubmit={handleSubmitReview}
              isLoading={isLoading}
            />
          )}

          {!isLoading && review && !selectedFinding && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setReview(null);
                    setSelectedFinding(null);
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Review Different Code</span>
                </button>
              </div>

              <FindingsList
                review={review}
                selectedFindingId={null}
                onSelectFinding={(f) => setSelectedFinding(f)}
                onStartChallenge={(f) => setActiveChallengeFinding(f)}
              />
            </div>
          )}

          {!isLoading && review && selectedFinding && (
            <FindingDetail
              finding={selectedFinding}
              onBack={() => setSelectedFinding(null)}
              onStartChallenge={(f) => setActiveChallengeFinding(f)}
            />
          )}
        </section>
      </main>

      {/* Interactive Deliberate Practice Challenge Modal */}
      {activeChallengeFinding && (
        <ChallengeModal
          isOpen={!!activeChallengeFinding}
          challenge={activeChallengeFinding.challenge}
          findingTitle={activeChallengeFinding.title}
          category={activeChallengeFinding.category}
          onClose={() => setActiveChallengeFinding(null)}
          onComplete={(result) => {
            setSkillScores(skillService.getScores());
            const delta = result.newScore - result.oldScore;
            if (delta > 0) {
              setRecentSkillUpdate({
                category: result.skillCategory,
                delta,
              });
            } else {
              setRecentSkillUpdate(null);
            }
          }}
        />
      )}

      {/* Provider & AI Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={(newConfig) => {
          setProviderMode(newConfig.mode);
          setActiveConfig(newConfig);
        }}
      />
    </div>
  );
}
