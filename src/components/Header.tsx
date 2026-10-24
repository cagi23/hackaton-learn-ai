import React from 'react';
import { Eye, Settings, RotateCcw, Sparkles } from 'lucide-react';

export interface HeaderProps {
  providerName: string;
  isLiveMode?: boolean;
  onOpenSettings?: () => void;
  onResetSkills?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  providerName,
  isLiveMode = false,
  onOpenSettings,
  onResetSkills,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm shadow-indigo-500/10 flex items-center justify-center">
            <Eye className="w-5 h-5 text-indigo-400" />
            <Sparkles className="w-3 h-3 text-indigo-300 absolute -top-1 -right-1" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                ReviewLens
              </h1>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                Interactive
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              AI Code Review That Teaches You Why
            </p>
          </div>
        </div>

        {/* Right side controls: status pill & action buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active provider pill */}
          <div
            data-testid="provider-badge"
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              isLiveMode
                ? 'bg-blue-500/10 text-blue-300 border-blue-500/30 shadow-sm shadow-blue-500/5'
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-sm shadow-emerald-500/5'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isLiveMode
                  ? 'bg-blue-400 animate-pulse shadow-sm shadow-blue-400'
                  : 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400'
              }`}
            />
            <span className="font-semibold">
              {isLiveMode ? 'Live AI Mode' : 'Mock Demo Mode'}
            </span>
            {providerName && (
              <span className="text-slate-400 font-normal border-l border-slate-700/60 pl-2">
                {providerName}
              </span>
            )}
          </div>

          {/* Reset Skills action */}
          {onResetSkills && (
            <button
              type="button"
              onClick={onResetSkills}
              title="Reset skills progress"
              aria-label="Reset skills progress"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          {/* Config / Settings button */}
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              title="Configure AI settings"
              aria-label="Settings"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
