import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Eye,
  EyeOff,
  Sparkles,
  Bot,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { reviewService } from '../services/ReviewService';
import { MockReviewProvider } from '../services/providers/MockReviewProvider';
import { LLMReviewProvider } from '../services/providers/LLMReviewProvider';

export const SETTINGS_STORAGE_KEY = 'reviewlens_config';

export interface ReviewLensConfig {
  mode: 'mock' | 'live';
  providerType: 'gemini' | 'openai';
  apiKey: string;
  model: string;
}

export const DEFAULT_CONFIG: ReviewLensConfig = {
  mode: 'mock',
  providerType: 'gemini',
  apiKey: '',
  model: '',
};

export function loadStoredConfig(): ReviewLensConfig {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(SETTINGS_STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        mode: parsed.mode === 'live' ? 'live' : 'mock',
        providerType: parsed.providerType === 'openai' ? 'openai' : 'gemini',
        apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
        model: typeof parsed.model === 'string' ? parsed.model : '',
      };
    }
  } catch {
    // fallback on error
  }
  return { ...DEFAULT_CONFIG };
}

export function saveStoredConfig(config: ReviewLensConfig): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(config));
    }
  } catch {
    // ignore storage write errors
  }
}

export function applyConfigToReviewService(config: ReviewLensConfig): void {
  if (config.mode === 'live') {
    reviewService.setProvider(
      new LLMReviewProvider({
        apiKey: config.apiKey,
        model: config.model.trim() || undefined,
        providerType: config.providerType,
      })
    );
  } else {
    reviewService.setProvider(new MockReviewProvider());
  }
}

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (config: ReviewLensConfig) => void;
  initialConfig?: Partial<ReviewLensConfig>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialConfig,
}) => {
  const [mode, setMode] = useState<'mock' | 'live'>('mock');
  const [providerType, setProviderType] = useState<'gemini' | 'openai'>('gemini');
  const [apiKey, setApiKey] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);

  // Initialize form state when opened
  useEffect(() => {
    if (isOpen) {
      const stored = loadStoredConfig();
      const merged = { ...stored, ...initialConfig };
      setMode(merged.mode);
      setProviderType(merged.providerType);
      setApiKey(merged.apiKey);
      setModel(merged.model);
      setShowApiKey(false);
    }
  }, [isOpen, initialConfig]);

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

  const handleSave = () => {
    const config: ReviewLensConfig = {
      mode,
      providerType,
      apiKey: apiKey.trim(),
      model: model.trim(),
    };

    saveStoredConfig(config);
    applyConfigToReviewService(config);
    onSave?.(config);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 id="settings-modal-title" className="text-lg font-bold text-white tracking-tight">
                AI Review Settings
              </h2>
              <p className="text-xs text-slate-400">
                Configure review engine and AI provider credentials
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Engine Mode Toggle */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Review Engine Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Mock Mode Button */}
              <button
                type="button"
                onClick={() => setMode('mock')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === 'mock'
                    ? 'border-indigo-500 bg-indigo-950/40 text-white ring-2 ring-indigo-500/30'
                    : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-sm text-indigo-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    Mock Provider (Demo Mode)
                  </span>
                  {mode === 'mock' && <Check className="w-4 h-4 text-indigo-400" />}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  100% deterministic, offline, guaranteed zero latency
                </p>
              </button>

              {/* Live AI Mode Button */}
              <button
                type="button"
                onClick={() => setMode('live')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === 'live'
                    ? 'border-indigo-500 bg-indigo-950/40 text-white ring-2 ring-indigo-500/30'
                    : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-sm text-indigo-300 flex items-center gap-2">
                    <Bot className="w-4 h-4 text-indigo-400" />
                    Live AI Mode
                  </span>
                  {mode === 'live' && <Check className="w-4 h-4 text-indigo-400" />}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Direct LLM calls with Gemini or OpenAI
                </p>
              </button>
            </div>
          </div>

          {/* Live AI Specific Fields */}
          {mode === 'live' && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              {/* Provider Selection */}
              <div className="space-y-1.5">
                <label htmlFor="ai-provider-select" className="text-xs font-semibold text-slate-300">
                  Provider
                </label>
                <select
                  id="ai-provider-select"
                  value={providerType}
                  onChange={(e) => setProviderType(e.target.value as 'gemini' | 'openai')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="gemini">Google Gemini (Recommended)</option>
                  <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                </select>
              </div>

              {/* API Key Input */}
              <div className="space-y-1.5">
                <label htmlFor="ai-api-key-input" className="text-xs font-semibold text-slate-300">
                  API Key
                </label>
                <div className="relative">
                  <input
                    id="ai-api-key-input"
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={
                      providerType === 'gemini'
                        ? 'AIzaSy...'
                        : 'sk-proj-...'
                    }
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    aria-label="Toggle password visibility"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    {showApiKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Custom Model */}
              <div className="space-y-1.5">
                <label htmlFor="ai-model-input" className="text-xs font-semibold text-slate-300">
                  Model
                </label>
                <input
                  id="ai-model-input"
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder={
                    providerType === 'gemini'
                      ? 'gemini-1.5-flash (default)'
                      : 'gpt-4o-mini (default)'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              {/* Privacy Notice */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Your API key is only stored in your browser's local memory and is sent directly to the AI provider.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer active:scale-[0.98]"
          >
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
