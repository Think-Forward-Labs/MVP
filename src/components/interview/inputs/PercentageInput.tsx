import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';

interface PercentageInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  disabled?: boolean;
  label?: string;
}

export function PercentageInput({
  value,
  onChange,
  onKeyDown,
  disabled = false,
  label = "Enter percentage",
}: PercentageInputProps) {
  const [localValue, setLocalValue] = useState(value || '50');

  useEffect(() => {
    if (value) {
      setLocalValue(value);
    }
  }, [value]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value.replace(/[^0-9]/g, '');

    // Clamp between 0 and 100
    const numValue = parseInt(newValue, 10);
    if (!isNaN(numValue)) {
      newValue = Math.min(100, Math.max(0, numValue)).toString();
    }

    setLocalValue(newValue);
    onChange(newValue);
  };

  const percentage = parseInt(localValue, 10) || 0;

  return (
    <div style={styles.container}>
      <label style={styles.label}>{label}</label>

      <div style={styles.sliderContainer}>
        <input
          type="range"
          min="0"
          max="100"
          value={percentage}
          onChange={handleSliderChange}
          onKeyDown={onKeyDown}
          disabled={disabled}
          style={styles.slider}
        />
        <div
          style={{
            ...styles.sliderTrack,
            width: `${percentage}%`,
          }}
        />
      </div>

      <div style={styles.inputRow}>
        <div style={styles.inputWrapper}>
          <input
            type="text"
            value={localValue}
            onChange={handleInputChange}
            onKeyDown={onKeyDown}
            disabled={disabled}
            style={styles.numberInput}
            maxLength={3}
          />
          <span style={styles.percentSymbol}>%</span>
        </div>

        <div style={styles.presets}>
          {[0, 25, 50, 75, 100].map((preset) => (
            <button
              key={preset}
              style={{
                ...styles.presetButton,
                ...(percentage === preset ? styles.presetActive : {}),
              }}
              onClick={() => {
                setLocalValue(preset.toString());
                onChange(preset.toString());
              }}
              disabled={disabled}
              type="button"
            >
              {preset}%
            </button>
          ))}
        </div>
      </div>

      <div style={styles.legend}>
        <span style={styles.legendItem}>0% = None</span>
        <span style={styles.legendItem}>100% = All</span>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    padding: '24px 20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#18181B',
    marginBottom: '20px',
  },
  sliderContainer: {
    position: 'relative',
    height: '8px',
    backgroundColor: '#E4E4E7',
    borderRadius: '4px',
    marginBottom: '24px',
  },
  slider: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer',
    zIndex: 2,
  },
  sliderTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: '#18181B',
    borderRadius: '4px',
    transition: 'width 0.1s ease',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '16px',
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#F4F4F5',
    borderRadius: '8px',
    padding: '8px 12px',
  },
  numberInput: {
    width: '48px',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '20px',
    fontWeight: '600',
    textAlign: 'right',
    outline: 'none',
    fontFamily: 'inherit',
  },
  percentSymbol: {
    fontSize: '16px',
    color: '#71717A',
    fontWeight: '500',
  },
  presets: {
    display: 'flex',
    gap: '8px',
  },
  presetButton: {
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#71717A',
    backgroundColor: '#F4F4F5',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  presetActive: {
    backgroundColor: '#18181B',
    color: '#FFFFFF',
  },
  legend: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '8px',
  },
  legendItem: {
    fontSize: '12px',
    color: '#A1A1AA',
  },
};

export default PercentageInput;
