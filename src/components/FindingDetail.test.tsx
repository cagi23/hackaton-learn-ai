import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { FindingDetail } from './FindingDetail';
import type { ReviewFinding } from '../domain/types';

describe('FindingDetail component', () => {
  const sampleFinding: ReviewFinding = {
    id: 'finding-1',
    title: 'Unchecked Null or Undefined Property Access',
    category: 'type-safety',
    severity: 'high',
    affectedCode: 'const name = user.profile.name;',
    description: 'Accessing nested properties without null checks can throw TypeError at runtime.',
    whyItMatters: 'If user or profile is null or undefined, the application crashes with an unhandled exception in production.',
    principle: 'Null Safety & Defensive Checks',
    suggestion: 'Use optional chaining (?.) or nullish coalescing (??) to safely traverse nested properties.',
    improvedCode: 'const name = user?.profile?.name ?? "Anonymous";',
    challenge: {
      question: 'Which operator prevents TypeError when user is undefined?',
      answers: [
        { id: 'a1', text: 'Optional chaining (?.)' },
        { id: 'a2', text: 'Non-null assertion (!)' },
        { id: 'a3', text: 'Bitwise NOT (~)' },
      ],
      correctAnswerId: 'a1',
      explanation: 'Optional chaining short-circuits to undefined instead of throwing.',
    },
  };

  it('renders title, severity, category badge, and description', () => {
    render(
      <FindingDetail
        finding={sampleFinding}
        onBack={vi.fn()}
        onStartChallenge={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'Unchecked Null or Undefined Property Access' })).toBeInTheDocument();
    expect(screen.getByText(/HIGH/i)).toBeInTheDocument();
    expect(screen.getByText(/TYPE SAFETY/i)).toBeInTheDocument();
    expect(
      screen.getByText('Accessing nested properties without null checks can throw TypeError at runtime.')
    ).toBeInTheDocument();
  });

  it('renders "WHY DOES THIS MATTER?" section and content', () => {
    render(
      <FindingDetail
        finding={sampleFinding}
        onBack={vi.fn()}
        onStartChallenge={vi.fn()}
      />
    );

    expect(screen.getByText(/WHY DOES THIS MATTER\?/i)).toBeInTheDocument();
    expect(screen.getByText(sampleFinding.whyItMatters)).toBeInTheDocument();
  });

  it('renders "ENGINEERING PRINCIPLE" section and content', () => {
    render(
      <FindingDetail
        finding={sampleFinding}
        onBack={vi.fn()}
        onStartChallenge={vi.fn()}
      />
    );

    expect(screen.getByText(/ENGINEERING PRINCIPLE/i)).toBeInTheDocument();
    expect(screen.getByText('Null Safety & Defensive Checks')).toBeInTheDocument();
  });

  it('renders "HOW TO IMPROVE IT" suggestion and code blocks', () => {
    render(
      <FindingDetail
        finding={sampleFinding}
        onBack={vi.fn()}
        onStartChallenge={vi.fn()}
      />
    );

    expect(screen.getByText(/HOW TO IMPROVE IT/i)).toBeInTheDocument();
    expect(screen.getByText(sampleFinding.suggestion)).toBeInTheDocument();
    expect(screen.getByText('const name = user.profile.name;')).toBeInTheDocument();
    expect(
      screen.getByText('const name = user?.profile?.name ?? "Anonymous";')
    ).toBeInTheDocument();
  });

  it('calls onStartChallenge when "Challenge Me" button is clicked', () => {
    const handleStartChallenge = vi.fn();
    render(
      <FindingDetail
        finding={sampleFinding}
        onBack={vi.fn()}
        onStartChallenge={handleStartChallenge}
      />
    );

    const challengeButton = screen.getByRole('button', { name: /challenge me/i });
    fireEvent.click(challengeButton);

    expect(handleStartChallenge).toHaveBeenCalledTimes(1);
    expect(handleStartChallenge).toHaveBeenCalledWith(sampleFinding);
  });

  it('calls onBack when back button is clicked', () => {
    const handleBack = vi.fn();
    render(
      <FindingDetail
        finding={sampleFinding}
        onBack={handleBack}
        onStartChallenge={vi.fn()}
      />
    );

    const backButton = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backButton);

    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('does not render back button when onBack is not provided', () => {
    render(
      <FindingDetail
        finding={sampleFinding}
        onStartChallenge={vi.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
  });

  it('omits affected code section when affectedCode is not provided', () => {
    const findingWithoutAffected: ReviewFinding = {
      ...sampleFinding,
      affectedCode: undefined,
    };

    render(
      <FindingDetail
        finding={findingWithoutAffected}
        onBack={vi.fn()}
        onStartChallenge={vi.fn()}
      />
    );

    expect(screen.queryByText(/Problematic Code/i)).not.toBeInTheDocument();
  });

  it('omits improved code block when improvedCode is not provided', () => {
    const findingWithoutImproved: ReviewFinding = {
      ...sampleFinding,
      improvedCode: undefined,
    };

    render(
      <FindingDetail
        finding={findingWithoutImproved}
        onBack={vi.fn()}
        onStartChallenge={vi.fn()}
      />
    );

    expect(screen.queryByText(/Improved Code/i)).not.toBeInTheDocument();
    // Suggestion is still rendered
    expect(screen.getByText(findingWithoutImproved.suggestion)).toBeInTheDocument();
  });

  it('allows copying code when copy button is clicked', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <FindingDetail
        finding={sampleFinding}
        onBack={vi.fn()}
        onStartChallenge={vi.fn()}
      />
    );

    const copyButtons = screen.getAllByRole('button', { name: /copy/i });
    expect(copyButtons.length).toBeGreaterThan(0);

    await act(async () => {
      fireEvent.click(copyButtons[0]);
    });
    expect(writeTextMock).toHaveBeenCalled();
  });

  it('renders critical, medium, and low severity badges correctly', () => {
    const severities: Array<ReviewFinding['severity']> = ['critical', 'medium', 'low'];

    for (const sev of severities) {
      const { unmount } = render(
        <FindingDetail
          finding={{ ...sampleFinding, severity: sev }}
          onStartChallenge={vi.fn()}
        />
      );

      expect(screen.getByText(new RegExp(sev, 'i'))).toBeInTheDocument();
      unmount();
    }
  });

  it('handles clipboard writeText error gracefully without throwing', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('Permission denied')),
      },
    });

    render(
      <FindingDetail
        finding={sampleFinding}
        onBack={vi.fn()}
        onStartChallenge={vi.fn()}
      />
    );

    const copyButtons = screen.getAllByRole('button', { name: /copy/i });
    await act(async () => {
      fireEvent.click(copyButtons[0]);
    });

    // Should not throw or crash
    expect(screen.getByText('Problematic Code')).toBeInTheDocument();
  });
});
