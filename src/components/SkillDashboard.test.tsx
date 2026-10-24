import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SkillDashboard } from './SkillDashboard';
import type { SkillScores } from '../domain/types';

describe('SkillDashboard component', () => {
  const sampleScores: SkillScores = {
    'bug-detection': 75,
    security: 45,
    maintainability: 90,
    'type-safety': 60,
    testing: 82,
  };

  it('renders all 5 skill categories with their numerical values', () => {
    render(<SkillDashboard scores={sampleScores} />);

    expect(screen.getByText('Bug Detection')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText('Maintainability')).toBeInTheDocument();
    expect(screen.getByText('Type Safety')).toBeInTheDocument();
    expect(screen.getByText('Testing')).toBeInTheDocument();

    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('90')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
    expect(screen.getByText('82')).toBeInTheDocument();
  });

  it('displays progress bars with correct aria-valuenow and width styles', () => {
    render(<SkillDashboard scores={sampleScores} />);

    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars).toHaveLength(5);

    // Verify bug-detection: 75%
    const bugBar = screen.getByLabelText(/Bug Detection/i);
    expect(bugBar).toHaveAttribute('aria-valuenow', '75');
    expect(bugBar).toHaveStyle({ width: '75%' });

    // Verify security: 45%
    const securityBar = screen.getByLabelText(/Security/i);
    expect(securityBar).toHaveAttribute('aria-valuenow', '45');
    expect(securityBar).toHaveStyle({ width: '45%' });

    // Verify maintainability: 90%
    const maintBar = screen.getByLabelText(/Maintainability/i);
    expect(maintBar).toHaveAttribute('aria-valuenow', '90');
    expect(maintBar).toHaveStyle({ width: '90%' });
  });

  it('displays proficiency tiers based on scores', () => {
    render(<SkillDashboard scores={sampleScores} />);

    // security: 45 -> Novice
    expect(screen.getByText('Novice')).toBeInTheDocument();
    // bug-detection: 75, type-safety: 60 -> Proficient
    const proficientBadges = screen.getAllByText('Proficient');
    expect(proficientBadges.length).toBeGreaterThanOrEqual(1);
    // maintainability: 90, testing: 82 -> Master
    const masterBadges = screen.getAllByText('Master');
    expect(masterBadges.length).toBeGreaterThanOrEqual(1);
  });

  it('renders recent score update indicator when recentUpdate prop is provided', () => {
    render(
      <SkillDashboard
        scores={sampleScores}
        recentUpdate={{
          category: 'security',
          delta: 3,
        }}
      />
    );

    // Should render a +3 indicator
    expect(screen.getByText(/\+3/)).toBeInTheDocument();
  });

  it('does not render recent score update indicator when recentUpdate is null or undefined', () => {
    const { rerender } = render(
      <SkillDashboard scores={sampleScores} recentUpdate={null} />
    );

    expect(screen.queryByText(/\+3/)).not.toBeInTheDocument();

    rerender(<SkillDashboard scores={sampleScores} />);
    expect(screen.queryByText(/\+3/)).not.toBeInTheDocument();
  });

  it('calls onReset when reset action button is clicked', () => {
    const handleReset = vi.fn();
    render(<SkillDashboard scores={sampleScores} onReset={handleReset} />);

    const resetButton = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetButton);

    expect(handleReset).toHaveBeenCalledTimes(1);
  });
});
