import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CodeInput } from './CodeInput';
import { DEMO_TYPESCRIPT_CODE } from '../data/demoCode';

describe('CodeInput component', () => {
  const defaultProps = {
    code: '',
    onChange: vi.fn(),
    onSubmit: vi.fn(),
  };

  it('renders code in textarea and placeholder when empty', () => {
    const { rerender } = render(<CodeInput {...defaultProps} />);
    const textarea = screen.getByRole('textbox', { name: /code editor|code input/i });
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue('');

    rerender(<CodeInput {...defaultProps} code="const x = 42;" />);
    expect(textarea).toHaveValue('const x = 42;');
  });

  it('fires onChange when typing in the textarea', () => {
    const handleChange = vi.fn();
    render(<CodeInput {...defaultProps} onChange={handleChange} />);

    const textarea = screen.getByRole('textbox', { name: /code editor|code input/i });
    fireEvent.change(textarea, { target: { value: 'function test() {}' } });

    expect(handleChange).toHaveBeenCalledWith('function test() {}');
  });

  it('calls onChange with DEMO_TYPESCRIPT_CODE when clicking "Load Demo Example"', () => {
    const handleChange = vi.fn();
    render(<CodeInput {...defaultProps} onChange={handleChange} />);

    const loadButton = screen.getByRole('button', { name: /load (demo )?example/i });
    fireEvent.click(loadButton);

    expect(handleChange).toHaveBeenCalledWith(DEMO_TYPESCRIPT_CODE);
  });

  it('calls onSubmit when clicking "Review My Code" with non-empty code', () => {
    const handleSubmit = vi.fn();
    render(
      <CodeInput
        {...defaultProps}
        code="const greet = 'hello';"
        onSubmit={handleSubmit}
      />
    );

    const submitButton = screen.getByRole('button', { name: /review my code/i });
    expect(submitButton).not.toBeDisabled();
    fireEvent.click(submitButton);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it('disables "Review My Code" button when code is empty or whitespace', () => {
    const { rerender } = render(<CodeInput {...defaultProps} code="" />);
    const submitButton = screen.getByRole('button', { name: /review my code/i });
    expect(submitButton).toBeDisabled();

    rerender(<CodeInput {...defaultProps} code={'   \n  \t  '} />);
    expect(submitButton).toBeDisabled();
  });

  it('disables "Review My Code" button and shows loading state when isLoading is true', () => {
    render(
      <CodeInput
        {...defaultProps}
        code="const x = 1;"
        isLoading={true}
      />
    );

    const submitButton = screen.getByRole('button', { name: /reviewing|review my code|analyzing/i });
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/analyzing|reviewing/i)).toBeInTheDocument();
  });

  it('calls onSubmit on Ctrl+Enter keyboard shortcut when code is present', () => {
    const handleSubmit = vi.fn();
    render(
      <CodeInput
        {...defaultProps}
        code="const sum = (a: number, b: number) => a + b;"
        onSubmit={handleSubmit}
      />
    );

    const textarea = screen.getByRole('textbox', { name: /code editor|code input/i });
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });

    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it('calls onSubmit on Cmd+Enter (metaKey) keyboard shortcut', () => {
    const handleSubmit = vi.fn();
    render(
      <CodeInput
        {...defaultProps}
        code="const product = 5 * 10;"
        onSubmit={handleSubmit}
      />
    );

    const textarea = screen.getByRole('textbox', { name: /code editor|code input/i });
    fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true });

    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it('does not call onSubmit on Ctrl+Enter if code is empty', () => {
    const handleSubmit = vi.fn();
    render(<CodeInput {...defaultProps} code="" onSubmit={handleSubmit} />);

    const textarea = screen.getByRole('textbox', { name: /code editor|code input/i });
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('does not call onSubmit on Ctrl+Enter if isLoading is true', () => {
    const handleSubmit = vi.fn();
    render(
      <CodeInput
        {...defaultProps}
        code="const x = 1;"
        isLoading={true}
        onSubmit={handleSubmit}
      />
    );

    const textarea = screen.getByRole('textbox', { name: /code editor|code input/i });
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('resets code by calling onChange with empty string when "Clear" is clicked', () => {
    const handleChange = vi.fn();
    render(
      <CodeInput
        {...defaultProps}
        code="console.log('test');"
        onChange={handleChange}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear/i });
    expect(clearButton).not.toBeDisabled();
    fireEvent.click(clearButton);

    expect(handleChange).toHaveBeenCalledWith('');
  });

  it('disables "Clear" button when code is empty', () => {
    render(<CodeInput {...defaultProps} code="" />);

    const clearButton = screen.getByRole('button', { name: /clear/i });
    expect(clearButton).toBeDisabled();
  });

  it('displays character and line count indicators', () => {
    const multilineCode = "line 1\nline 2\nline 3";
    render(<CodeInput {...defaultProps} code={multilineCode} />);

    expect(screen.getByText(/3 lines/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`${multilineCode.length} chars`, 'i'))).toBeInTheDocument();
  });

  it('handles Tab key indentation in textarea', () => {
    const handleChange = vi.fn();
    render(
      <CodeInput
        {...defaultProps}
        code="hello"
        onChange={handleChange}
      />
    );

    const textarea = screen.getByRole('textbox', { name: /code editor|code input/i }) as HTMLTextAreaElement;
    textarea.selectionStart = 5;
    textarea.selectionEnd = 5;

    fireEvent.keyDown(textarea, { key: 'Tab' });

    expect(handleChange).toHaveBeenCalledWith('hello  ');
  });

  it('displays language and handles language changes if onLanguageChange is provided', () => {
    const handleLanguageChange = vi.fn();
    render(
      <CodeInput
        {...defaultProps}
        language="typescript"
        onLanguageChange={handleLanguageChange}
      />
    );

    const select = screen.getByRole('combobox', { name: /select language/i });
    expect(select).toHaveValue('typescript');

    fireEvent.change(select, { target: { value: 'javascript' } });
    expect(handleLanguageChange).toHaveBeenCalledWith('javascript');
  });

  it('disables interactions when disabled prop is true', () => {
    const handleChange = vi.fn();
    const handleSubmit = vi.fn();
    render(
      <CodeInput
        {...defaultProps}
        code="const x = 1;"
        disabled={true}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />
    );

    const textarea = screen.getByRole('textbox', { name: /code editor|code input/i });
    expect(textarea).toBeDisabled();

    const submitButton = screen.getByRole('button', { name: /review my code/i });
    expect(submitButton).toBeDisabled();

    const loadButton = screen.getByRole('button', { name: /load (demo )?example/i });
    expect(loadButton).toBeDisabled();
  });
});
