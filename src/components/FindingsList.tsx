import React, { useState, useMemo } from 'react';
import { Search, X, FilterX, AlertCircle } from 'lucide-react';
import type { CodeReview, FindingSeverity, ReviewFinding } from '../domain/types';
import { ReviewSummary } from './ReviewSummary';
import { FindingCard } from './FindingCard';

export interface FindingsListProps {
  review: CodeReview;
  selectedFindingId?: string | null;
  onSelectFinding: (finding: ReviewFinding) => void;
  onStartChallenge: (finding: ReviewFinding) => void;
}

export const FindingsList: React.FC<FindingsListProps> = ({
  review,
  selectedFindingId = null,
  onSelectFinding,
  onStartChallenge,
}) => {
  const [severityFilter, setSeverityFilter] = useState<FindingSeverity | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredFindings = useMemo(() => {
    return review.findings.filter((finding) => {
      // 1. Severity filter
      if (severityFilter !== 'all' && finding.severity !== severityFilter) {
        return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = finding.title.toLowerCase().includes(query);
        const matchesDesc = finding.description.toLowerCase().includes(query);
        const matchesCategory = finding.category.toLowerCase().includes(query);
        const matchesPrinciple = finding.principle?.toLowerCase().includes(query);
        const matchesCode = finding.affectedCode?.toLowerCase().includes(query);

        if (!matchesTitle && !matchesDesc && !matchesCategory && !matchesPrinciple && !matchesCode) {
          return false;
        }
      }

      return true;
    });
  }, [review.findings, severityFilter, searchQuery]);

  const handleResetFilters = () => {
    setSeverityFilter('all');
    setSearchQuery('');
  };

  const hasActiveFilters = severityFilter !== 'all' || searchQuery.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Review Summary Component at Top */}
      <ReviewSummary
        summary={review.summary}
        findings={review.findings}
        selectedSeverityFilter={severityFilter}
        onFilterBySeverity={(sev) => setSeverityFilter(sev)}
      />

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search findings by title, category, or principle..."
            aria-label="Search findings"
            className="w-full bg-slate-950/70 border border-slate-800 rounded-lg pl-9 pr-9 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Counter & Active filter reset */}
        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-400 px-1">
          <span>
            Showing <strong className="text-white font-semibold">{filteredFindings.length}</strong> of{' '}
            {review.findings.length} findings
          </span>
          {hasActiveFilters && filteredFindings.length > 0 && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              <FilterX className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>
      </div>

      {/* Findings List or Empty State */}
      {filteredFindings.length > 0 ? (
        <div className="space-y-4">
          {filteredFindings.map((finding) => (
            <FindingCard
              key={finding.id}
              finding={finding}
              isSelected={selectedFindingId === finding.id}
              onSelect={onSelectFinding}
              onStartChallenge={onStartChallenge}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-10 text-center space-y-4">
          <div className="inline-flex p-3 rounded-2xl bg-slate-800/60 text-slate-400 border border-slate-700/60">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-semibold text-white">
              No findings match your current filters
            </h4>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
              {severityFilter !== 'all' && searchQuery.trim()
                ? `No ${severityFilter} severity findings matched "${searchQuery}".`
                : severityFilter !== 'all'
                ? `There are no ${severityFilter} severity findings in this review.`
                : `No findings matched "${searchQuery}".`}
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <FilterX className="w-4 h-4" />
            <span>Reset Filter</span>
          </button>
        </div>
      )}
    </div>
  );
};
