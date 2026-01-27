import type { CSSProperties } from 'react';
import type { ScaleConfig } from '../../../types/interview';

interface ScaleInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  scale: ScaleConfig;
  disabled?: boolean;
}

export function ScaleInput({ value, onChange, scale, disabled = false }: ScaleInputProps) {
  const selectedValue = value ? parseInt(value, 10) : null;
  const scalePoints = Array.from(
    { length: scale.max - scale.min + 1 },
    (_, i) => scale.min + i
  );

  return (
    <div style={styles.container}>
      <div style={styles.labelsTop}>
        <span style={styles.labelMin}>{scale.min_label}</span>
        <span style={styles.labelMax}>{scale.max_label}</span>
      </div>

      <div style={styles.scaleContainer}>
        {scalePoints.map((point) => (
          <button
            key={point}
            style={{
              ...styles.scaleButton,
              ...(selectedValue === point ? styles.scaleButtonSelected : {}),
              ...(disabled ? styles.disabled : {}),
            }}
            onClick={() => !disabled && onChange(point.toString())}
            disabled={disabled}
            type="button"
          >
            {point}
          </button>
        ))}
      </div>

      <div style={styles.labelsBottom}>
        <span style={styles.scaleNumber}>{scale.min}</span>
        <span style={styles.scaleLine} />
        <span style={styles.scaleNumber}>{scale.max}</span>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    padding: '24px 20px',
  },
  labelsTop: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '20px',
    gap: '16px',
  },
  labelMin: {
    fontSize: '13px',
    color: '#71717A',
    flex: 1,
    lineHeight: '1.4',
  },
  labelMax: {
    fontSize: '13px',
    color: '#71717A',
    flex: 1,
    textAlign: 'right',
    lineHeight: '1.4',
  },
  scaleContainer: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    marginBottom: '12px',
  },
  scaleButton: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    border: '2px solid #E4E4E7',
    backgroundColor: '#FFFFFF',
    fontSize: '16px',
    fontWeight: '500',
    color: '#71717A',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleButtonSelected: {
    backgroundColor: '#18181B',
    borderColor: '#18181B',
    color: '#FFFFFF',
  },
  disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  labelsBottom: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '8px',
  },
  scaleNumber: {
    fontSize: '12px',
    color: '#A1A1AA',
    fontWeight: '500',
  },
  scaleLine: {
    flex: 1,
    maxWidth: '200px',
    height: '1px',
    backgroundColor: '#E4E4E7',
  },
};

export default ScaleInput;
