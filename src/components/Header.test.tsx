import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from './Header';

describe('Header component', () => {
  it('renders brand title and tagline', () => {
    render(<Header providerName="Mock Review Engine" />);

    expect(screen.getByText('ReviewLens')).toBeInTheDocument();
    expect(
      screen.getByText('AI Code Review That Teaches You Why')
    ).toBeInTheDocument();
  });

  it('displays active provider badge in mock mode', () => {
    render(<Header providerName="Mock Review Engine" isLiveMode={false} />);

    expect(screen.getByText(/Mock Demo Mode/i)).toBeInTheDocument();
    expect(screen.getByText(/Mock Review Engine/i)).toBeInTheDocument();
  });

  it('displays active provider badge in live mode', () => {
    render(<Header providerName="OpenAI GPT-4o" isLiveMode={true} />);

    expect(screen.getByText(/Live AI Mode/i)).toBeInTheDocument();
    expect(screen.getByText(/OpenAI GPT-4o/i)).toBeInTheDocument();
  });

  it('calls onOpenSettings when settings button is clicked', () => {
    const handleOpenSettings = vi.fn();
    render(
      <Header
        providerName="Mock Review Engine"
        onOpenSettings={handleOpenSettings}
      />
    );

    const settingsButton = screen.getByRole('button', { name: /settings/i });
    fireEvent.click(settingsButton);

    expect(handleOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('calls onResetSkills when reset button is clicked', () => {
    const handleResetSkills = vi.fn();
    render(
      <Header
        providerName="Mock Review Engine"
        onResetSkills={handleResetSkills}
      />
    );

    const resetButton = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetButton);

    expect(handleResetSkills).toHaveBeenCalledTimes(1);
  });

  it('renders cleanly without crashing when optional callbacks are omitted', () => {
    const { container } = render(<Header providerName="Mock Review Engine" />);
    expect(container).toBeInTheDocument();
  });
});
