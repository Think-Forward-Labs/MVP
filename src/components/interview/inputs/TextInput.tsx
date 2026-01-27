import { forwardRef } from 'react';
import type { CSSProperties } from 'react';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
}

export const TextInput = forwardRef<HTMLTextAreaElement, TextInputProps>(
  ({ value, onChange, onKeyDown, placeholder = "Type your response here...", disabled = false, rows = 6 }, ref) => {
    return (
      <textarea
        ref={ref}
        style={styles.textInput}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        rows={rows}
        disabled={disabled}
      />
    );
  }
);

TextInput.displayName = 'TextInput';

const styles: Record<string, CSSProperties> = {
  textInput: {
    width: '100%',
    padding: '20px',
    fontSize: '16px',
    lineHeight: '1.6',
    border: 'none',
    outline: 'none',
    resize: 'none',
    fontFamily: 'inherit',
    backgroundColor: 'transparent',
    boxSizing: 'border-box',
  },
};

export default TextInput;
