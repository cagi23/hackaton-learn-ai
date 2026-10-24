import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ErrorAlert } from './ErrorAlert';

describe('ErrorAlert Component', () => {
  it('renders alert with title and message', () => {
    render(
      <ErrorAlert
        title="Test Error"
        message="This is a test error message."
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Test Error')).toBeInTheDocument();
    expect(screen.getByText('This is a test error message.')).toBeInTheDocument();
  });

  it('calls onDismiss when clicking Dismiss button', () => {
    const handleDismiss = vi.fn();
    render(
      <ErrorAlert
        title="Test Error"
        message="Failure occurred."
        onDismiss={handleDismiss}
      />
    );

    const dismissBtn = screen.getByRole('button', { name: /Dismiss/i });
    fireEvent.click(dismissBtn);

    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders "Switch to Mock Mode" button when showMockFallback is true and calls onSwitchToMock when clicked', () => {
    const handleSwitch = vi.fn();
    render(
      <ErrorAlert
        title="AI Failure"
        message="API quota exceeded."
        showMockFallback={true}
        onSwitchToMock={handleSwitch}
        onDismiss={vi.fn()}
      />
    );

    const switchBtn = screen.getByRole('button', { name: /Switch to Mock Mode/i });
    expect(switchBtn).toBeInTheDocument();

    fireEvent.click(switchBtn);
    expect(handleSwitch).toHaveBeenCalledTimes(1);
  });

  it('does not render "Switch to Mock Mode" button when showMockFallback is false', () => {
    render(
      <ErrorAlert
        title="Empty Code"
        message="Please provide code."
        showMockFallback={false}
        onSwitchToMock={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: /Switch to Mock Mode/i })).not.toBeInTheDocument();
  });
});
