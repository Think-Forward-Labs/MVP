import { useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { Icons } from '../common/Icons';

interface AuthModalProps {
  mode: 'login' | 'signup';
  onClose: () => void;
  onSwitchMode: (mode: 'login' | 'signup') => void;
  onSuccess: (email: string) => void;
}

export function AuthModal({ mode, onClose, onSwitchMode, onSuccess }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      onSuccess(email);
    }, 800);
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
        <button style={styles.modalClose} onClick={onClose}>
          <Icons.X />
        </button>

        <div style={styles.modalHeader}>
          <Icons.Logo />
          <h2 style={styles.modalTitle}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p style={styles.modalSubtitle}>
            {mode === 'login'
              ? 'Enter your credentials to access your dashboard'
              : 'Start your business assessment journey'
            }
          </p>
        </div>

        <form style={styles.authForm} onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>Full name</label>
              <div style={styles.inputWrapper}>
                <Icons.User />
                <input
                  type="text"
                  style={styles.input}
                  placeholder="Enter your name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Email address</label>
            <div style={styles.inputWrapper}>
              <Icons.Mail />
              <input
                type="email"
                style={styles.input}
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Password</label>
            <div style={styles.inputWrapper}>
              <Icons.Lock />
              <input
                type={showPassword ? 'text' : 'password'}
                style={styles.input}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                style={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
              </button>
            </div>
          </div>

          {mode === 'login' && (
            <button type="button" style={styles.forgotPassword}>
              Forgot password?
            </button>
          )}

          <button
            type="submit"
            style={{...styles.submitButton, opacity: loading ? 0.7 : 1}}
            disabled={loading}
          >
            {loading ? 'Please wait...' : (mode === 'login' ? 'Sign in' : 'Create account')}
          </button>
        </form>

        <div style={styles.authDivider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>or continue with</span>
          <span style={styles.dividerLine} />
        </div>

        <div style={styles.socialButtons}>
          <button style={styles.socialButton}>
            <Icons.Google />
            Google
          </button>
          <button style={styles.socialButton}>
            <Icons.GitHub />
            GitHub
          </button>
        </div>

        <p style={styles.authSwitch}>
          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <button
            style={styles.authSwitchButton}
            onClick={() => onSwitchMode(mode === 'login' ? 'signup' : 'login')}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '24px',
  },
  modalContent: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '40px',
    position: 'relative',
  },
  modalClose: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#71717A',
    cursor: 'pointer',
    borderRadius: '6px',
  },
  modalHeader: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: '600',
    marginTop: '16px',
    marginBottom: '8px',
  },
  modalSubtitle: {
    fontSize: '14px',
    color: '#71717A',
  },
  authForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  inputLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#18181B',
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: '#FAFAFA',
    border: '1px solid #E4E4E7',
    borderRadius: '10px',
  },
  input: {
    flex: 1,
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '14px',
    outline: 'none',
  },
  passwordToggle: {
    background: 'none',
    border: 'none',
    color: '#71717A',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    background: 'none',
    border: 'none',
    fontSize: '13px',
    color: '#71717A',
    cursor: 'pointer',
    marginTop: '-8px',
  },
  submitButton: {
    padding: '14px',
    fontSize: '15px',
    fontWeight: '500',
    color: '#FFFFFF',
    backgroundColor: '#18181B',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    marginTop: '8px',
  },
  authDivider: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    margin: '24px 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#E4E4E7',
  },
  dividerText: {
    fontSize: '12px',
    color: '#A1A1AA',
  },
  socialButtons: {
    display: 'flex',
    gap: '12px',
  },
  socialButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E4E7',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  authSwitch: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#71717A',
    marginTop: '24px',
  },
  authSwitchButton: {
    background: 'none',
    border: 'none',
    color: '#18181B',
    fontWeight: '500',
    cursor: 'pointer',
  },
};

export default AuthModal;
