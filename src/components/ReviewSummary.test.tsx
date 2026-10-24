import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReviewSummary } from './ReviewSummary';
import type { CodeReviewSummary, ReviewFinding } from '../domain/types';

describe('ReviewSummary component', () => {
  const sampleSummary: CodeReviewSummary = {
    overallQuality: 'Needs Improvement',
    findingsCount: 4,
  };

  const sampleFindings: ReviewFinding[] = [
    {
      id: 'f-1',
      title: 'Unsafe Undefined Access',
      category: 'type-safety',
      severity: 'high',
      description: 'Potential undefined property access',
      whyItMatters: 'Causes crash',
      principle: 'Null Safety',
      suggestion: 'Use optional chaining',
      challenge: {
        question: 'How to fix?',
        answers: [{ id: '1', text: 'Optional chaining' }],
        correctAnswerId: '1',
        explanation: 'Safe access',
      },
    },
    {
      id: 'f-2',
      title: 'Unhandled Async Error',
      category: 'bug',
      severity: 'critical',
      description: 'Promise rejection unhandled',
      whyItMatters: 'Service failure',
      principle: 'Error Handling',
      suggestion: 'Use try/catch',
      challenge: {
        question: 'How to handle?',
        answers: [{ id: '1', text: 'try-catch' }],
        correctAnswerId: '1',
        explanation: 'Try catch handles error',
      },
    },
    {
      id: 'f-3',
      title: 'Magic String Literal',
      category: 'maintainability',
      severity: 'medium',
      description: 'Duplicated hardcoded strings',
      whyItMatters: 'Typo prone',
      principle: 'DRY',
      suggestion: 'Extract constant',
      challenge: {
        question: 'What to do?',
        answers: [{ id: '1', text: 'Use const' }],
        correctAnswerId: '1',
        explanation: 'Constants prevent typos',
      },
    },
    {
      id: 'f-4',
      title: 'Unoptimized Array Map',
      category: 'performance',
      severity: 'medium',
      description: 'Redundant loop over large array',
      whyItMatters: 'Slow runtime',
      principle: 'Efficiency',
      suggestion: 'Single pass reduce',
      challenge: {
        question: 'How to optimize?',
        answers: [{ id: '1', text: 'Single pass' }],
        correctAnswerId: '1',
        explanation: 'Single pass is O(N)',
      },
    },
  ];

  it('renders "REVIEW COMPLETE" badge and overall quality text', () => {
    render(<ReviewSummary summary={sampleSummary} findings={sampleFindings} />);

    expect(screen.getByText(/REVIEW COMPLETE/i)).toBeInTheDocument();
    expect(screen.getByText('Needs Improvement')).toBeInTheDocument();
  });

  it('renders total findings count badge', () => {
    render(<ReviewSummary summary={sampleSummary} findings={sampleFindings} />);

    // Total findings badge (4 findings)
    expect(screen.getByText(/4 Findings/i)).toBeInTheDocument();
  });

  it('computes correct count for each severity from findings list', () => {
    render(<ReviewSummary summary={sampleSummary} findings={sampleFindings} />);

    // Critical: 1, High: 1, Medium: 2, Low: 0
    const criticalCard = screen.getByRole('button', { name: /critical/i });
    expect(criticalCard).toHaveTextContent('1');

    const highCard = screen.getByRole('button', { name: /high/i });
    expect(highCard).toHaveTextContent('1');

    const mediumCard = screen.getByRole('button', { name: /medium/i });
    expect(mediumCard).toHaveTextContent('2');

    const lowCard = screen.getByRole('button', { name: /low/i });
    expect(lowCard).toHaveTextContent('0');
  });

  it('calls onFilterBySeverity when clicking a severity card', () => {
    const handleFilter = vi.fn();
    render(
      <ReviewSummary
        summary={sampleSummary}
        findings={sampleFindings}
        onFilterBySeverity={handleFilter}
      />
    );

    const highButton = screen.getByRole('button', { name: /high/i });
    fireEvent.click(highButton);
    expect(handleFilter).toHaveBeenCalledWith('high');

    const criticalButton = screen.getByRole('button', { name: /critical/i });
    fireEvent.click(criticalButton);
    expect(handleFilter).toHaveBeenCalledWith('critical');
  });

  it('highlights the selected severity filter', () => {
    render(
      <ReviewSummary
        summary={sampleSummary}
        findings={sampleFindings}
        selectedSeverityFilter="critical"
      />
    );

    const criticalButton = screen.getByRole('button', { name: /critical/i });
    expect(criticalButton).toHaveAttribute('aria-pressed', 'true');

    const highButton = screen.getByRole('button', { name: /high/i });
    expect(highButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('allows clicking "All" filter to reset severity filter', () => {
    const handleFilter = vi.fn();
    render(
      <ReviewSummary
        summary={sampleSummary}
        findings={sampleFindings}
        selectedSeverityFilter="critical"
        onFilterBySeverity={handleFilter}
      />
    );

    const allButton = screen.getByRole('button', { name: /all/i });
    fireEvent.click(allButton);
    expect(handleFilter).toHaveBeenCalledWith('all');
  });

  it('handles empty findings gracefully with 0 counts', () => {
    render(
      <ReviewSummary
        summary={{ overallQuality: 'Excellent', findingsCount: 0 }}
        findings={[]}
      />
    );

    expect(screen.getByText('Excellent')).toBeInTheDocument();
    expect(screen.getByText(/0 Findings/i)).toBeInTheDocument();

    const criticalButton = screen.getByRole('button', { name: /critical/i });
    expect(criticalButton).toHaveTextContent('0');
  });
});
