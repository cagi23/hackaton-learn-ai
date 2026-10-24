import React, { useRef } from 'react';
import {
  Code2,
  Sparkles,
  RotateCcw,
  FileCode,
  Loader2,
  Terminal,
} from 'lucide-react';
import { DEMO_TYPESCRIPT_CODE, DEMO_FILENAME } from '../data/demoCode';

export interface CodeInputProps {
  code: string;
  onChange: (code: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  language?: string;
  onLanguageChange?: (lang: string) => void;
}

export const CodeInput: React.FC<CodeInputProps> = ({
  code,
  onChange,
  onSubmit,
  isLoading = false,
  disabled = false,
  language = 'typescript',
  onLanguageChange,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const isCodeEmpty = !code || code.trim().length === 0;
  const isSubmitDisabled = isCodeEmpty || isLoading || disabled;

  const lines = code ? code.split('\n') : [''];
  const lineCount = lines.length;
  const charCount = code.length;

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const nextCode = code.substring(0, start) + '  ' + code.substring(end);
      onChange(nextCode);

      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 2;
          textareaRef.current.selectionEnd = start + 2;
        }
      });
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isSubmitDisabled) {
        onSubmit();
      }
    }
  };

  const handleLoadDemo = () => {
    onChange(DEMO_TYPESCRIPT_CODE);
  };

  const handleClear = () => {
    onChange('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const placeholderText = `// Paste your TypeScript or JavaScript code here...
// Or click "Load Demo Example" to inspect a realistic order service with subtle bugs.
// Shortcut: Press Ctrl+Enter (Cmd+Enter) to trigger code review.`;

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-950/80 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          {/* File & Language Pill */}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800/90 text-slate-200 border border-slate-700/60">
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              <span>{DEMO_FILENAME}</span>
            </span>

            {onLanguageChange ? (
              <select
                aria-label="Select language"
                value={language}
                onChange={(e) => onLanguageChange(e.target.value)}
                disabled={disabled || isLoading}
                className="bg-slate-800 text-xs text-indigo-300 border border-slate-700/70 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="typescript">TypeScript</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="go">Go</option>
              </select>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                <Code2 className="w-3 h-3 text-indigo-400" />
                <span>{language ? language.charAt(0).toUpperCase() + language.slice(1) : 'TypeScript'}</span>
              </span>
            )}
          </div>

          {/* Stats: lines & chars */}
          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400 pl-2 border-l border-slate-800">
            <span>
              {lineCount} {lineCount === 1 ? 'line' : 'lines'}
            </span>
            <span className="text-slate-600">•</span>
            <span>{charCount} chars</span>
          </div>
        </div>

        {/* Toolbar actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLoadDemo}
            disabled={disabled || isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 hover:border-indigo-500/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Load Demo Example</span>
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={!code || disabled || isLoading}
            aria-label="Clear code"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-600"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Code Editor body */}
      <div className="relative flex min-h-[340px] max-h-[560px] bg-slate-950 font-mono text-xs sm:text-sm">
        {/* Line numbers gutter */}
        <div
          ref={gutterRef}
          aria-hidden="true"
          className="select-none py-3 px-3 text-right bg-slate-950 border-r border-slate-800/80 text-slate-600 font-mono text-xs leading-6 overflow-hidden min-w-[3rem]"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i + 1} className="h-6">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code Textarea */}
        <div className="relative flex-1">
          <label htmlFor="code-editor-textarea" className="sr-only">
            Code editor
          </label>
          <textarea
            id="code-editor-textarea"
            ref={textareaRef}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            disabled={disabled || isLoading}
            placeholder={placeholderText}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            aria-label="Code editor"
            className="w-full h-full min-h-[340px] max-h-[560px] p-3 font-mono text-xs sm:text-sm leading-6 text-slate-100 bg-transparent resize-y outline-none border-none placeholder:text-slate-600 focus:ring-0 selection:bg-indigo-600/40"
          />
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-950/90 border-t border-slate-800/80">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Terminal className="w-3.5 h-3.5 text-slate-500" />
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">Ctrl+Enter</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">Cmd+Enter</kbd> to review</span>
        </div>

        <div className="flex items-center gap-3">
          {isCodeEmpty && (
            <span className="text-xs text-slate-500 hidden sm:inline">
              Paste code or load demo to begin
            </span>
          )}

          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitDisabled}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
              isSubmitDisabled
                ? 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-60 shadow-none'
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white border border-indigo-400/30 cursor-pointer shadow-indigo-500/20 hover:shadow-indigo-500/30'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Analyzing Code...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-indigo-200" />
                <span>Review My Code</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CodeInput;
