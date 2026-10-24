import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FindingsList } from './FindingsList';
import type { CodeReview } from '../domain/types';

describe('FindingsList component', () => {
  const sampleReview: CodeReview = {
    summary: {
      overallQuality: 'Needs Improvement',
      findingsCount: 3,
    },
    findings: [
      {
        id: 'finding-1',
        title: 'Possible Undefined Access',
        category: 'type-safety',
        severity: 'high',
        affectedCode: 'users.find().email',
        description: 'users.find() can return undefined.',
        whyItMatters: 'Can crash on runtime.',
        principle: 'Null Safety & Defensive Checks',
        suggestion: 'Use optional chaining.',
        challenge: {
          question: 'How to fix?',
          answers: [{ id: '1', text: 'Use ?.' }],
          correctAnswerId: '1',
          explanation: 'Safe access.',
        },
      },
      {
        id: 'finding-2',
        title: 'SQL Injection Risk',
        category: 'security',
        severity: 'critical',
        affectedCode: 'db.query(`SELECT * FROM users WHERE id = ${id}`)',
        description: 'Unescaped user input in raw SQL query.',
        whyItMatters: 'Vulnerable to data exfiltration.',
        principle: 'Least Privilege & Input Sanitization',
        suggestion: 'Use parameterized queries.',
        challenge: {
          question: 'Best SQL fix?',
          answers: [{ id: '1', text: 'Parameterized query' }],
          correctAnswerId: '1',
          explanation: 'Parameters prevent injection.',
        },
      },
      {
        id: 'finding-3',
        title: 'Long Method Needs Refactoring',
        category: 'maintainability',
        severity: 'medium',
        description: 'Method exceeds 100 lines and does multiple things.',
        whyItMatters: 'Hard to maintain and test.',
        principle: 'Single Responsibility Principle',
        suggestion: 'Extract into smaller functions.',
        challenge: {
          question: 'What principle is violated?',
          answers: [{ id: '1', text: 'SRP' }],
          correctAnswerId: '1',
          explanation: 'Single responsibility makes code maintainable.',
        },
      },
    ],
  };

  it('renders ReviewSummary at the top', () => {
    render(
      <FindingsList
        review={sampleReview}
        onSelectFinding={vi.fn()}
        onStartChallenge={vi.fn()}
      />
    );

    expect(screen.getByText(/REVIEW COMPLETE/i)).toBeInTheDocument();
    expect(screen.getByText('Needs Improvement')).toBeInTheDocument();
  });

  it('renders all finding cards by default', () => {
    render(
      <FindingsList
        review={sampleReview}
        onSelectFinding={vi.fn()}
        onStartChallenge={vi.fn()}
      />
    );

    expect(screen.getByText('Possible Undefined Access')).toBeInTheDocument();
    expect(screen.getByText('SQL Injection Risk')).toBeInTheDocument();
    expect(screen.getByText('Long Method Needs Refactoring')).toBeInTheDocument();
  });

  it('displays category, severity, principle, and snippet on finding cards', () => {
    render(
      <FindingsList
        review={sampleReview}
        onSelectFinding={vi.fn()}
        onStartChallenge={vi.fn()}
      />
    );

    // Categories / principles
    expect(screen.getByText(/Null Safety & Defensive Checks/i)).toBeInTheDocument();
    expect(screen.getByText(/Least Privilege & Input Sanitization/i)).toBeInTheDocument();
    // Affected code snippet
    expect(screen.getByText('users.find().email')).toBeInTheDocument();
  });

  it('filters findings when clicking severity breakdown in ReviewSummary', () => {
    render(
      <FindingsList
        review={sampleReview}
        onSelectFinding={vi.fn()}
        onStartChallenge={vi.fn()}
      />
    );

    // Click 'Critical' filter
    const criticalFilter = screen.getByRole('button', { name: /critical/i });
    fireEvent.click(criticalFilter);

    // Only critical finding should be visible
    expect(screen.getByText('SQL Injection Risk')).toBeInTheDocument();
    expect(screen.queryByText('Possible Undefined Access')).not.toBeInTheDocument();
    expect(screen.queryByText('Long Method Needs Refactoring')).not.toBeInTheDocument();
  });

  it('shows helpful empty state when no findings match selected severity and allows resetting filter', () => {
    render(
      <FindingsList
        review={sampleReview}
        onSelectFinding={vi.fn()}
        onStartChallenge={vi.fn()}
      />
    );

    // Click 'Low' filter (which has 0 findings)
    const lowFilter = screen.getByRole('button', { name: /low/i });
    fireEvent.click(lowFilter);

    expect(screen.getByText(/No findings match/i)).toBeInTheDocument();
    const resetButton = screen.getByRole('button', { name: /reset filter|show all/i });
    fireEvent.click(resetButton);

    // All findings should be shown again
    expect(screen.getByText('Possible Undefined Access')).toBeInTheDocument();
    expect(screen.getByText('SQL Injection Risk')).toBeInTheDocument();
  });

  it('calls onSelectFinding when "Explore Issue" is clicked', () => {
    const handleSelect = vi.fn();
    render(
      <FindingsList
        review={sampleReview}
        onSelectFinding={handleSelect}
        onStartChallenge={vi.fn()}
      />
    );

    const exploreButtons = screen.getAllByRole('button', { name: /explore issue/i });
    fireEvent.click(exploreButtons[0]);

    expect(handleSelect).toHaveBeenCalledWith(sampleReview.findings[0]);
  });

  it('calls onStartChallenge when "Challenge Me" is clicked', () => {
    const handleChallenge = vi.fn();
    render(
      <FindingsList
        review={sampleReview}
        onSelectFinding={vi.fn()}
        onStartChallenge={handleChallenge}
      />
    );

    const challengeButtons = screen.getAllByRole('button', { name: /challenge me/i });
    fireEvent.click(challengeButtons[1]);

    expect(handleChallenge).toHaveBeenCalledWith(sampleReview.findings[1]);
  });

  it('highlights selected finding card when selectedFindingId is provided', () => {
    render(
      <FindingsList
        review={sampleReview}
        selectedFindingId="finding-2"
        onSelectFinding={vi.fn()}
        onStartChallenge={vi.fn()}
      />
    );

    const selectedCard = screen.getByTestId('finding-card-finding-2');
    expect(selectedCard).toHaveAttribute('data-selected', 'true');

    const otherCard = screen.getByTestId('finding-card-finding-1');
    expect(otherCard).toHaveAttribute('data-selected', 'false');
  });

  it('filters by search input text', () => {
    render(
      <FindingsList
        review={sampleReview}
        onSelectFinding={vi.fn()}
        onStartChallenge={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search findings/i);
    fireEvent.change(searchInput, { target: { value: 'injection' } });

    expect(screen.getByText('SQL Injection Risk')).toBeInTheDocument();
    expect(screen.queryByText('Possible Undefined Access')).not.toBeInTheDocument();
  });
});
