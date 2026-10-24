import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from './App';
import { DEMO_TYPESCRIPT_CODE } from './data/demoCode';
import { reviewService } from './services/ReviewService';
import { MockReviewProvider } from './services/providers/MockReviewProvider';
import { skillService, DEFAULT_SKILL_SCORES } from './services/SkillService';

describe('App End-to-End Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    reviewService.setProvider(new MockReviewProvider());
    skillService.resetScores();
    vi.restoreAllMocks();
  });

  it('1. Initial render shows Header, SkillDashboard, and CodeInput', () => {
    render(<App />);

    // Header brand and mode pill
    expect(screen.getByRole('heading', { name: /ReviewLens/i })).toBeInTheDocument();
    expect(screen.getByText(/AI Code Review That Teaches You Why/i)).toBeInTheDocument();
    expect(screen.getByTestId('provider-badge')).toBeInTheDocument();
    expect(screen.getByText(/Mock Demo Mode/i)).toBeInTheDocument();

    // Skill Dashboard
    expect(screen.getByText(/Skill Proficiency/i)).toBeInTheDocument();
    expect(screen.getByText(/Bug Detection/i)).toBeInTheDocument();
    expect(screen.getByText(/Security/i)).toBeInTheDocument();

    // Code Input
    expect(screen.getByRole('button', { name: /Load Demo Example/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Review My Code/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Code editor/i)).toBeInTheDocument();
  });

  it('2. Clicking "Load Demo Example" loads DEMO_TYPESCRIPT_CODE into editor', () => {
    render(<App />);

    const loadDemoButton = screen.getByRole('button', { name: /Load Demo Example/i });
    fireEvent.click(loadDemoButton);

    const textarea = screen.getByLabelText<HTMLTextAreaElement>(/Code editor/i);
    expect(textarea.value).toBe(DEMO_TYPESCRIPT_CODE);
    expect(textarea.value).toContain('export class OrderService');
  });

  it('3. Submitting review displays findings list and review summary', async () => {
    render(<App />);

    // Load demo code
    fireEvent.click(screen.getByRole('button', { name: /Load Demo Example/i }));

    // Click submit
    const reviewButton = screen.getByRole('button', { name: /Review My Code/i });
    fireEvent.click(reviewButton);

    // Verify ReviewSummary rendered
    expect(await screen.findByText(/REVIEW COMPLETE/i)).toBeInTheDocument();
    expect(screen.getAllByText(/4 Findings/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Needs Improvement/i)).toBeInTheDocument();

    // Verify finding cards are rendered
    expect(
      screen.getByText(/Unsafe Undefined Access on Array Search Result/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Unhandled Async Payment Gateway Failure/i)
    ).toBeInTheDocument();
  });

  it('4. Clicking "Explore Issue" navigates to FindingDetail with pedagogy sections', async () => {
    render(<App />);

    // Load demo and run review
    fireEvent.click(screen.getByRole('button', { name: /Load Demo Example/i }));
    fireEvent.click(screen.getByRole('button', { name: /Review My Code/i }));

    // Wait for findings to appear
    await screen.findByText(/REVIEW COMPLETE/i);

    // Click Explore Issue on the first finding card
    const exploreButtons = screen.getAllByRole('button', { name: /Explore Issue/i });
    fireEvent.click(exploreButtons[0]);

    // Verify FindingDetail views
    expect(screen.getByText(/WHY DOES THIS MATTER\?/i)).toBeInTheDocument();
    expect(screen.getByText(/ENGINEERING PRINCIPLE/i)).toBeInTheDocument();
    expect(screen.getByText(/Null Safety & Defensive Checks/i)).toBeInTheDocument();
    expect(screen.getByText(/HOW TO IMPROVE IT/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Back to Findings/i })).toBeInTheDocument();
  });

  it('5. Clicking "Back to Findings" returns from FindingDetail to FindingsList', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Load Demo Example/i }));
    fireEvent.click(screen.getByRole('button', { name: /Review My Code/i }));
    await screen.findByText(/REVIEW COMPLETE/i);

    // Open detail
    const exploreButtons = screen.getAllByRole('button', { name: /Explore Issue/i });
    fireEvent.click(exploreButtons[0]);
    expect(screen.getByText(/WHY DOES THIS MATTER\?/i)).toBeInTheDocument();

    // Click Back
    fireEvent.click(screen.getByRole('button', { name: /Back to Findings/i }));

    // We are back to findings list
    expect(screen.getByText(/REVIEW COMPLETE/i)).toBeInTheDocument();
    expect(screen.getAllByText(/4 Findings/i)[0]).toBeInTheDocument();
  });

  it('6. Clicking "Challenge Me" opens ChallengeModal and answering correctly updates skill score', async () => {
    render(<App />);

    // Check initial type-safety score
    const initialTypeSafetyScore = DEFAULT_SKILL_SCORES['type-safety'];

    fireEvent.click(screen.getByRole('button', { name: /Load Demo Example/i }));
    fireEvent.click(screen.getByRole('button', { name: /Review My Code/i }));
    await screen.findByText(/REVIEW COMPLETE/i);

    // Go to first finding detail (which is type-safety category)
    const exploreButtons = screen.getAllByRole('button', { name: /Explore Issue/i });
    fireEvent.click(exploreButtons[0]);

    // Click Challenge Me
    const challengeButton = screen.getByRole('button', { name: /Challenge Me/i });
    fireEvent.click(challengeButton);

    // Verify modal is open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Deliberate Practice Challenge')).toBeInTheDocument();
    expect(
      screen.getByText(
        /What is the most idiomatic TypeScript approach to safely read a property/i
      )
    ).toBeInTheDocument();

    // Select the correct answer (opt-1)
    const answerButton = screen.getByText(
      /Use optional chaining with a nullish coalescing fallback/i
    );
    fireEvent.click(answerButton);

    // Submit answer
    const checkAnswerBtn = screen.getByRole('button', { name: /Check Answer/i });
    fireEvent.click(checkAnswerBtn);

    // Verify feedback
    expect(screen.getByText(/Correct! Well Done/i)).toBeInTheDocument();
    expect(screen.getAllByText(/\+3/)[0]).toBeInTheDocument();

    // Continue and close modal
    const continueBtn = screen.getByRole('button', { name: /Continue Reviewing/i });
    fireEvent.click(continueBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Verify score updated in SkillDashboard
    const expectedScore = initialTypeSafetyScore + 3;
    expect(
      screen.getByRole('progressbar', { name: /Type Safety/i })
    ).toHaveAttribute('aria-valuenow', `${expectedScore}`);
  });

  it('7. Displays error alert when submission fails or code is rejected', async () => {
    render(<App />);

    // Load demo code
    fireEvent.click(screen.getByRole('button', { name: /Load Demo Example/i }));

    // Mock reviewService.reviewCode to simulate rejection on empty or invalid input
    vi.spyOn(reviewService, 'reviewCode').mockRejectedValueOnce(
      new Error('Code snippet cannot be empty or contain only whitespace.')
    );

    const reviewButton = screen.getByRole('button', { name: /Review My Code/i });
    fireEvent.click(reviewButton);

    // Should display error alert
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Review Failed/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Code snippet cannot be empty or contain only whitespace/i)
    ).toBeInTheDocument();

    // Dismiss error alert
    const dismissBtn = screen.getByRole('button', { name: /Dismiss/i });
    fireEvent.click(dismissBtn);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('8. Displays error alert with mock fallback button when provider fails, and switching to mock recovers', async () => {
    render(<App />);

    // Load demo code
    fireEvent.click(screen.getByRole('button', { name: /Load Demo Example/i }));

    // Mock reviewService.reviewCode to throw an error
    vi.spyOn(reviewService, 'reviewCode').mockRejectedValueOnce(
      new Error('API key rejected or quota exceeded: 401 Unauthorized')
    );

    const reviewButton = screen.getByRole('button', { name: /Review My Code/i });
    fireEvent.click(reviewButton);

    // Expect error alert
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByText(/API key rejected or quota exceeded/i)
    ).toBeInTheDocument();

    // Click Switch to Mock Mode fallback button and verify recovery
    const fallbackBtn = screen.getByRole('button', { name: /Switch to Mock Mode/i });
    fireEvent.click(fallbackBtn);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText(/Mock Demo Mode/i)).toBeInTheDocument();
  });

  it('9. Opens and closes SettingsModal from Header settings trigger', () => {
    render(<App />);

    const settingsBtn = screen.getByRole('button', { name: /Settings/i });
    fireEvent.click(settingsBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/AI Review Settings/i)).toBeInTheDocument();

    // Close settings modal
    fireEvent.click(screen.getByRole('button', { name: /Close settings/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('10. Resets skill scores when clicking Reset in Header', () => {
    render(<App />);

    // Update a score first
    skillService.updateScore('testing', 10);

    const resetBtn = screen.getByRole('button', { name: /^Reset skills progress$/i });
    fireEvent.click(resetBtn);

    // Back to default testing score
    const defaultTestingScore = DEFAULT_SKILL_SCORES.testing;
    expect(
      screen.getByRole('progressbar', { name: /Testing/i })
    ).toHaveAttribute('aria-valuenow', `${defaultTestingScore}`);
  });
});
