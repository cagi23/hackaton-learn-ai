import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ReviewLoadingState, DEFAULT_STAGES } from './ReviewLoadingState';

describe('ReviewLoadingState component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('renders main heading and informational callout', () => {
    render(<ReviewLoadingState />);

    // Main heading
    expect(
      screen.getByRole('heading', { name: /reviewing your code\.\.\.|reviewlens ai mentor analyzing/i })
    ).toBeInTheDocument();

    // Informational callout
    expect(
      screen.getByText(/ReviewLens doesn't just find defects — it generates interactive challenges to test your understanding\./i)
    ).toBeInTheDocument();
  });

  it('displays all 4 domain inspection steps', () => {
    render(<ReviewLoadingState />);

    expect(screen.getByText(/Checking correctness & runtime bugs/i)).toBeInTheDocument();
    expect(screen.getByText(/Checking type safety & null guarantees/i)).toBeInTheDocument();
    expect(screen.getByText(/Analyzing maintainability & design principles/i)).toBeInTheDocument();
    expect(screen.getByText(/Preparing deliberate practice challenges/i)).toBeInTheDocument();
  });

  it('renders custom statusMessage when provided', () => {
    render(<ReviewLoadingState statusMessage="Running deep AST analysis on TypeScript source..." />);

    expect(
      screen.getByText('Running deep AST analysis on TypeScript source...')
    ).toBeInTheDocument();
  });

  it('marks active, completed, and pending steps based on controlled currentStage', () => {
    const { rerender } = render(<ReviewLoadingState currentStage={1} />);

    // Check step status labels or data-status attributes
    const stepItems = screen.getAllByTestId('loading-stage-item');
    expect(stepItems).toHaveLength(4);

    // Stage 0 should be completed
    expect(stepItems[0]).toHaveAttribute('data-stage-status', 'completed');
    // Stage 1 should be in-progress / active
    expect(stepItems[1]).toHaveAttribute('data-stage-status', 'in-progress');
    // Stage 2 & 3 should be pending
    expect(stepItems[2]).toHaveAttribute('data-stage-status', 'pending');
    expect(stepItems[3]).toHaveAttribute('data-stage-status', 'pending');

    // Rerender at stage 3
    rerender(<ReviewLoadingState currentStage={3} />);
    expect(stepItems[0]).toHaveAttribute('data-stage-status', 'completed');
    expect(stepItems[1]).toHaveAttribute('data-stage-status', 'completed');
    expect(stepItems[2]).toHaveAttribute('data-stage-status', 'completed');
    expect(stepItems[3]).toHaveAttribute('data-stage-status', 'in-progress');
  });

  it('automatically advances through stages over time when currentStage is not provided', () => {
    render(<ReviewLoadingState />);

    const stepItems = screen.getAllByTestId('loading-stage-item');
    expect(stepItems[0]).toHaveAttribute('data-stage-status', 'in-progress');
    expect(stepItems[1]).toHaveAttribute('data-stage-status', 'pending');

    // Advance timer by 1000ms
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(stepItems[0]).toHaveAttribute('data-stage-status', 'completed');
    expect(stepItems[1]).toHaveAttribute('data-stage-status', 'in-progress');
    expect(stepItems[2]).toHaveAttribute('data-stage-status', 'pending');

    // Advance timer by another 1000ms
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(stepItems[1]).toHaveAttribute('data-stage-status', 'completed');
    expect(stepItems[2]).toHaveAttribute('data-stage-status', 'in-progress');

    // Advance timer again
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(stepItems[2]).toHaveAttribute('data-stage-status', 'completed');
    expect(stepItems[3]).toHaveAttribute('data-stage-status', 'in-progress');
  });

  it('stops auto-advancing once the final stage is reached', () => {
    render(<ReviewLoadingState />);

    const stepItems = screen.getAllByTestId('loading-stage-item');

    // Advance past the 4 stages (e.g. 5000ms)
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // The final stage should remain active or in-progress
    expect(stepItems[0]).toHaveAttribute('data-stage-status', 'completed');
    expect(stepItems[1]).toHaveAttribute('data-stage-status', 'completed');
    expect(stepItems[2]).toHaveAttribute('data-stage-status', 'completed');
    expect(stepItems[3]).toHaveAttribute('data-stage-status', 'in-progress');
  });

  it('has accessible status region', () => {
    render(<ReviewLoadingState />);
    const statusRegion = screen.getByRole('status');
    expect(statusRegion).toBeInTheDocument();
  });

  it('exports DEFAULT_STAGES with domain categories and labels', () => {
    expect(DEFAULT_STAGES).toHaveLength(4);
    expect(DEFAULT_STAGES[0].label).toContain('correctness');
    expect(DEFAULT_STAGES[1].label).toContain('type safety');
    expect(DEFAULT_STAGES[2].label).toContain('maintainability');
    expect(DEFAULT_STAGES[3].label).toContain('challenges');
  });
});
