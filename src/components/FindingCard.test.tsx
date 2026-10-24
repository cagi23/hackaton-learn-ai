import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FindingCard } from './FindingCard';
import type { ReviewFinding } from '../domain/types';

describe('FindingCard component', () => {
  const sampleFinding: ReviewFinding = {
    id: 'f-100',
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
  };

  it('renders severity and category label badge', () => {
    render(<FindingCard finding={sampleFinding} onSelect={vi.fn()} />);

    expect(screen.getByText(/HIGH/)).toBeInTheDocument();
    expect(screen.getByText(/TYPE SAFETY/)).toBeInTheDocument();
  });

  it('renders title, description, and principle badge', () => {
    render(<FindingCard finding={sampleFinding} onSelect={vi.fn()} />);

    expect(screen.getByText('Possible Undefined Access')).toBeInTheDocument();
    expect(screen.getByText('users.find() can return undefined.')).toBeInTheDocument();
    expect(screen.getByText('Null Safety & Defensive Checks')).toBeInTheDocument();
  });

  it('renders affected code snippet when provided', () => {
    render(<FindingCard finding={sampleFinding} onSelect={vi.fn()} />);

    expect(screen.getByText('users.find().email')).toBeInTheDocument();
  });

  it('omits affected code snippet section when affectedCode is not provided', () => {
    const findingWithoutCode: ReviewFinding = {
      ...sampleFinding,
      affectedCode: undefined,
    };
    render(<FindingCard finding={findingWithoutCode} onSelect={vi.fn()} />);

    expect(screen.queryByText(/Affected Code/i)).not.toBeInTheDocument();
  });

  it('calls onSelect when "Explore Issue" is clicked', () => {
    const handleSelect = vi.fn();
    render(<FindingCard finding={sampleFinding} onSelect={handleSelect} />);

    const exploreButton = screen.getByRole('button', { name: /explore issue/i });
    fireEvent.click(exploreButton);

    expect(handleSelect).toHaveBeenCalledWith(sampleFinding);
  });

  it('calls onStartChallenge when "Challenge Me" is clicked', () => {
    const handleChallenge = vi.fn();
    render(
      <FindingCard
        finding={sampleFinding}
        onSelect={vi.fn()}
        onStartChallenge={handleChallenge}
      />
    );

    const challengeButton = screen.getByRole('button', { name: /challenge me/i });
    fireEvent.click(challengeButton);

    expect(handleChallenge).toHaveBeenCalledWith(sampleFinding);
  });

  it('omits "Challenge Me" button when onStartChallenge is omitted', () => {
    render(<FindingCard finding={sampleFinding} onSelect={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /challenge me/i })).not.toBeInTheDocument();
  });

  it('sets data-selected to true when isSelected is true', () => {
    render(
      <FindingCard
        finding={sampleFinding}
        isSelected={true}
        onSelect={vi.fn()}
      />
    );

    const card = screen.getByTestId('finding-card-f-100');
    expect(card).toHaveAttribute('data-selected', 'true');
  });
});
