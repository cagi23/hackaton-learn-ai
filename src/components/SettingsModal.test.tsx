import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SettingsModal,
  SETTINGS_STORAGE_KEY,
  type ReviewLensConfig,
} from './SettingsModal';
import { reviewService } from '../services/ReviewService';
import { MockReviewProvider } from '../services/providers/MockReviewProvider';
import { LLMReviewProvider } from '../services/providers/LLMReviewProvider';

describe('SettingsModal Component', () => {
  const onClose = vi.fn();
  const onSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    reviewService.setProvider(new MockReviewProvider());
  });

  it('does not render anything when isOpen is false', () => {
    render(<SettingsModal isOpen={false} onClose={onClose} onSave={onSave} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText(/AI Review Settings|Settings/i)).not.toBeInTheDocument();
  });

  it('renders modal dialog and mode choices when isOpen is true', () => {
    render(<SettingsModal isOpen={true} onClose={onClose} onSave={onSave} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/AI Review Settings/i)).toBeInTheDocument();
    expect(screen.getByText(/Mock Provider \(Demo Mode\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Live AI Mode/i)).toBeInTheDocument();
  });

  it('displays deterministic mock description when Mock mode is selected', () => {
    render(<SettingsModal isOpen={true} onClose={onClose} onSave={onSave} />);
    expect(
      screen.getByText(/100% deterministic, offline, guaranteed zero latency/i)
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/API Key/i)).not.toBeInTheDocument();
  });

  it('reveals Live AI fields (provider, API key, model, security notice) when switching to Live AI mode', () => {
    render(<SettingsModal isOpen={true} onClose={onClose} onSave={onSave} />);

    const liveModeButton = screen.getByRole('button', { name: /Live AI Mode/i });
    fireEvent.click(liveModeButton);

    expect(screen.getByLabelText(/Provider/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^API Key$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Model/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Your API key is only stored in your browser's local memory and is sent directly to the AI provider/i
      )
    ).toBeInTheDocument();
  });

  it('toggles API key input type between password and text when visibility button is toggled', () => {
    render(<SettingsModal isOpen={true} onClose={onClose} onSave={onSave} />);

    fireEvent.click(screen.getByRole('button', { name: /Live AI Mode/i }));

    const apiKeyInput = screen.getByLabelText(/^API Key$/i);
    expect(apiKeyInput).toHaveAttribute('type', 'password');

    const toggleButton = screen.getByRole('button', { name: /Toggle password visibility/i });
    fireEvent.click(toggleButton);
    expect(apiKeyInput).toHaveAttribute('type', 'text');

    fireEvent.click(toggleButton);
    expect(apiKeyInput).toHaveAttribute('type', 'password');
  });

  it('calls onClose when Cancel button or Close button is clicked', () => {
    render(<SettingsModal isOpen={true} onClose={onClose} onSave={onSave} />);

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);
    expect(onClose).toHaveBeenCalledTimes(1);

    const closeIconButton = screen.getByRole('button', { name: /Close settings/i });
    fireEvent.click(closeIconButton);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('calls onClose when Escape key is pressed', () => {
    render(<SettingsModal isOpen={true} onClose={onClose} onSave={onSave} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('saves Mock configuration to localStorage and sets MockReviewProvider in reviewService', () => {
    render(<SettingsModal isOpen={true} onClose={onClose} onSave={onSave} />);

    const saveButton = screen.getByRole('button', { name: /Save Settings|Save/i });
    fireEvent.click(saveButton);

    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.mode).toBe('mock');

    expect(reviewService.getProvider()).toBeInstanceOf(MockReviewProvider);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'mock',
      })
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('saves Live AI configuration to localStorage and sets LLMReviewProvider in reviewService', () => {
    render(<SettingsModal isOpen={true} onClose={onClose} onSave={onSave} />);

    fireEvent.click(screen.getByRole('button', { name: /Live AI Mode/i }));

    const providerSelect = screen.getByLabelText(/Provider/i);
    fireEvent.change(providerSelect, { target: { value: 'gemini' } });

    const apiKeyInput = screen.getByLabelText(/^API Key$/i);
    fireEvent.change(apiKeyInput, { target: { value: 'AIzaSyTestGeminiKey123' } });

    const modelInput = screen.getByLabelText(/Model/i);
    fireEvent.change(modelInput, { target: { value: 'gemini-1.5-flash' } });

    const saveButton = screen.getByRole('button', { name: /Save Settings|Save/i });
    fireEvent.click(saveButton);

    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.mode).toBe('live');
    expect(parsed.providerType).toBe('gemini');
    expect(parsed.apiKey).toBe('AIzaSyTestGeminiKey123');
    expect(parsed.model).toBe('gemini-1.5-flash');

    expect(reviewService.getProvider()).toBeInstanceOf(LLMReviewProvider);
    expect(onSave).toHaveBeenCalledWith({
      mode: 'live',
      providerType: 'gemini',
      apiKey: 'AIzaSyTestGeminiKey123',
      model: 'gemini-1.5-flash',
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('hydrates form state from localStorage on open', () => {
    const existingConfig: ReviewLensConfig = {
      mode: 'live',
      providerType: 'openai',
      apiKey: 'sk-existing-key-12345',
      model: 'gpt-4o-mini',
    };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(existingConfig));

    render(<SettingsModal isOpen={true} onClose={onClose} onSave={onSave} />);

    expect(screen.getByLabelText(/^API Key$/i)).toHaveValue('sk-existing-key-12345');
    expect(screen.getByLabelText(/Model/i)).toHaveValue('gpt-4o-mini');
  });
});
