import type { CSSProperties } from 'react';

interface SelectInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  options: string[];
  multiSelect?: boolean;
  maxSelections?: number;
  disabled?: boolean;
}

export function SelectInput({
  value,
  onChange,
  options,
  multiSelect = false,
  maxSelections = 3,
  disabled = false,
}: SelectInputProps) {
  // Parse selected values
  const selectedValues: string[] = value ? value.split('|||') : [];

  const handleSelect = (option: string) => {
    if (disabled) return;

    if (multiSelect) {
      let newSelected: string[];
      if (selectedValues.includes(option)) {
        // Deselect
        newSelected = selectedValues.filter((v) => v !== option);
      } else {
        // Select (if under limit)
        if (selectedValues.length < maxSelections) {
          newSelected = [...selectedValues, option];
        } else {
          return; // At limit
        }
      }
      onChange(newSelected.join('|||'));
    } else {
      // Single select
      onChange(option);
    }
  };

  const isSelected = (option: string) => {
    if (multiSelect) {
      return selectedValues.includes(option);
    }
    return value === option;
  };

  const atLimit = multiSelect && selectedValues.length >= maxSelections;

  return (
    <div style={styles.container}>
      {multiSelect && (
        <p style={styles.hint}>
          Select up to {maxSelections} options ({selectedValues.length}/{maxSelections} selected)
        </p>
      )}

      <div style={styles.optionsContainer}>
        {options.map((option, index) => {
          const selected = isSelected(option);
          const disabledOption = disabled || (atLimit && !selected);

          return (
            <button
              key={index}
              style={{
                ...styles.optionButton,
                ...(selected ? styles.optionSelected : {}),
                ...(disabledOption && !selected ? styles.optionDisabled : {}),
              }}
              onClick={() => handleSelect(option)}
              disabled={disabledOption && !selected}
              type="button"
            >
              <span style={styles.checkbox}>
                {selected && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 6L5 9L10 3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <span style={styles.optionText}>{option}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    padding: '20px',
  },
  hint: {
    fontSize: '13px',
    color: '#71717A',
    marginBottom: '16px',
    margin: '0 0 16px 0',
  },
  optionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  optionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    backgroundColor: '#FAFAFA',
    border: '1px solid #E4E4E7',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    textAlign: 'left',
    width: '100%',
  },
  optionSelected: {
    backgroundColor: '#18181B',
    borderColor: '#18181B',
    color: '#FFFFFF',
  },
  optionDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  checkbox: {
    width: '20px',
    height: '20px',
    borderRadius: '4px',
    border: '2px solid currentColor',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionText: {
    fontSize: '14px',
    fontWeight: '500',
    lineHeight: '1.4',
  },
};

export default SelectInput;
