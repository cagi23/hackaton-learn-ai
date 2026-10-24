import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChallengeModal } from './ChallengeModal';
import { skillService } from '../services/SkillService';
import { challengeService } from '../services/ChallengeService';
import type { ReviewChallenge, FindingCategory } from '../domain/types';

describe('ChallengeModal component', () => {
  const sampleChallenge: ReviewChallenge = {
    question: 'How should any types in function signatures be safely refactored?',
    code: 'function parsePayload(input: any): any {\n  return JSON.parse(input);\n}',
    answers: [
      { id: 'opt-a', text: 'Cast it with as unknown.' },
      { id: 'opt-b', text: 'Use unknown with type narrowing or a schema validator like Zod.' },
      { id: 'opt-c', text: 'Leave it as any if it comes from an external API.' },
    ],
    correctAnswerId: 'opt-b',
    explanation: 'Using unknown forces consumers to validate and narrow types safely before accessing fields, preventing runtime crashes.',
  };

  const defaultProps = {
    challenge: sampleChallenge,
    findingTitle: 'Implicit Any in API Boundary',
    category: 'type-safety' as FindingCategory,
    isOpen: true,
    onClose: vi.fn(),
    onComplete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    skillService.resetScores();
  });

  it('does not render anything when isOpen is false', () => {
    render(<ChallengeModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Deliberate Practice Challenge')).not.toBeInTheDocument();
    expect(screen.queryByText(sampleChallenge.question)).not.toBeInTheDocument();
  });

  it('renders modal header with title, finding title, and category pill when isOpen is true', () => {
    render(<ChallengeModal {...defaultProps} />);

    expect(screen.getByText('Deliberate Practice Challenge')).toBeInTheDocument();
    expect(screen.getByText('Implicit Any in API Boundary')).toBeInTheDocument();
    expect(screen.getByText(/type safety/i)).toBeInTheDocument();
  });

  it('renders question text, code snippet, and all 3 answer options with letter badges', () => {
    render(<ChallengeModal {...defaultProps} />);

    expect(screen.getByText(sampleChallenge.question)).toBeInTheDocument();
    expect(screen.getByText(/function parsePayload/)).toBeInTheDocument();

    expect(screen.getByText('Cast it with as unknown.')).toBeInTheDocument();
    expect(screen.getByText('Use unknown with type narrowing or a schema validator like Zod.')).toBeInTheDocument();
    expect(screen.getByText('Leave it as any if it comes from an external API.')).toBeInTheDocument();

    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('omits code snippet block if challenge.code is not provided', () => {
    const challengeWithoutCode: ReviewChallenge = {
      ...sampleChallenge,
      code: undefined,
    };
    render(<ChallengeModal {...defaultProps} challenge={challengeWithoutCode} />);

    expect(screen.getByText(sampleChallenge.question)).toBeInTheDocument();
    expect(screen.queryByText(/function parsePayload/)).not.toBeInTheDocument();
  });

  it('disables the "Check Answer" button when no option is selected', () => {
    render(<ChallengeModal {...defaultProps} />);

    const checkButton = screen.getByRole('button', { name: /check answer/i });
    expect(checkButton).toBeDisabled();
  });

  it('enables the "Check Answer" button after selecting an answer option', () => {
    render(<ChallengeModal {...defaultProps} />);

    const checkButton = screen.getByRole('button', { name: /check answer/i });
    expect(checkButton).toBeDisabled();

    const optionB = screen.getByText('Use unknown with type narrowing or a schema validator like Zod.');
    fireEvent.click(optionB);

    expect(checkButton).toBeEnabled();
  });

  it('evaluates correct answer deterministically, updates skill score, shows success UI, and calls onComplete', () => {
    const updateScoreSpy = vi.spyOn(skillService, 'updateScore');
    const evaluateSpy = vi.spyOn(challengeService, 'evaluateAnswer');
    const onCompleteMock = vi.fn();

    render(<ChallengeModal {...defaultProps} onComplete={onCompleteMock} />);

    // Select correct option B
    const optionB = screen.getByText('Use unknown with type narrowing or a schema validator like Zod.');
    fireEvent.click(optionB);

    const checkButton = screen.getByRole('button', { name: /check answer/i });
    fireEvent.click(checkButton);

    // Deterministic evaluation called
    expect(evaluateSpy).toHaveBeenCalledWith(sampleChallenge, 'opt-b', 'type-safety');

    // Score update called for type-safety (+3)
    expect(updateScoreSpy).toHaveBeenCalledWith('type-safety', 3);

    // Vibrant success feedback
    expect(screen.getByText(/correct! well done/i)).toBeInTheDocument();

    // Animated / formatted score delta displayed (e.g. 63 -> 66 (+3))
    expect(screen.getByText(/63\s*→\s*66/i)).toBeInTheDocument();
    expect(screen.getByText(/\+3/)).toBeInTheDocument();

    // In-depth explanation displayed
    expect(screen.getByText(/why is this the correct answer\?/i)).toBeInTheDocument();
    expect(screen.getByText(sampleChallenge.explanation)).toBeInTheDocument();

    // onComplete callback invoked with result
    expect(onCompleteMock).toHaveBeenCalledWith(
      expect.objectContaining({
        isCorrect: true,
        skillCategory: 'type-safety',
        oldScore: 63,
        newScore: 66,
      })
    );

    // Primary button becomes "Continue Reviewing"
    expect(screen.getByRole('button', { name: /continue reviewing/i })).toBeInTheDocument();
  });

  it('evaluates incorrect answer deterministically, does NOT update score, reveals correct answer, and shows constructive feedback', () => {
    const updateScoreSpy = vi.spyOn(skillService, 'updateScore');
    const evaluateSpy = vi.spyOn(challengeService, 'evaluateAnswer');
    const onCompleteMock = vi.fn();

    render(<ChallengeModal {...defaultProps} onComplete={onCompleteMock} />);

    // Select incorrect option A
    const optionA = screen.getByText('Cast it with as unknown.');
    fireEvent.click(optionA);

    const checkButton = screen.getByRole('button', { name: /check answer/i });
    fireEvent.click(checkButton);

    // Deterministic evaluation called
    expect(evaluateSpy).toHaveBeenCalledWith(sampleChallenge, 'opt-a', 'type-safety');

    // Score update is NOT called
    expect(updateScoreSpy).not.toHaveBeenCalled();

    // Constructive failure feedback
    expect(screen.getByText(/not quite right/i)).toBeInTheDocument();

    // Correct answer is highlighted with "Correct Answer" pill
    expect(screen.getByText('Correct Answer')).toBeInTheDocument();

    // In-depth explanation displayed
    expect(screen.getByText(/why is this the correct answer\?/i)).toBeInTheDocument();
    expect(screen.getByText(sampleChallenge.explanation)).toBeInTheDocument();

    // onComplete called with isCorrect: false
    expect(onCompleteMock).toHaveBeenCalledWith(
      expect.objectContaining({
        isCorrect: false,
        skillCategory: 'type-safety',
      })
    );

    // Primary button becomes "Continue Reviewing"
    expect(screen.getByRole('button', { name: /continue reviewing/i })).toBeInTheDocument();
  });

  it('disables all answer choices once an answer has been submitted', () => {
    render(<ChallengeModal {...defaultProps} />);

    const optionB = screen.getByText('Use unknown with type narrowing or a schema validator like Zod.');
    fireEvent.click(optionB);

    const checkButton = screen.getByRole('button', { name: /check answer/i });
    fireEvent.click(checkButton);

    // Buttons / options should be disabled
    const optionButtons = screen.getAllByRole('button').filter(btn => btn.getAttribute('aria-pressed') !== null);
    optionButtons.forEach(btn => {
      expect(btn).toBeDisabled();
    });
  });

  it('calls onClose when clicking the "Continue Reviewing" button after completion', () => {
    const handleClose = vi.fn();
    render(<ChallengeModal {...defaultProps} onClose={handleClose} />);

    const optionB = screen.getByText('Use unknown with type narrowing or a schema validator like Zod.');
    fireEvent.click(optionB);

    const checkButton = screen.getByRole('button', { name: /check answer/i });
    fireEvent.click(checkButton);

    const continueBtn = screen.getByRole('button', { name: /continue reviewing/i });
    fireEvent.click(continueBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking the header close (X) button', () => {
    const handleClose = vi.fn();
    render(<ChallengeModal {...defaultProps} onClose={handleClose} />);

    const closeBtn = screen.getByRole('button', { name: /close challenge/i });
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking the modal backdrop overlay', () => {
    const handleClose = vi.fn();
    render(<ChallengeModal {...defaultProps} onClose={handleClose} />);

    const backdrop = screen.getByTestId('challenge-modal-backdrop');
    fireEvent.click(backdrop);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onClose when clicking inside the modal content box', () => {
    const handleClose = vi.fn();
    render(<ChallengeModal {...defaultProps} onClose={handleClose} />);

    const modalContent = screen.getByTestId('challenge-modal-content');
    fireEvent.click(modalContent);

    expect(handleClose).not.toHaveBeenCalled();
  });

  it('calls onClose when ESC key is pressed', () => {
    const handleClose = vi.fn();
    render(<ChallengeModal {...defaultProps} onClose={handleClose} />);

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
