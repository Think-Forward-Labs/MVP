/**
 * Auth Modal
 * Premium glass styling with elegant animations
 */

import { useState, useEffect } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { Icons } from '../common/Icons';
import { authApi, setAuthToken } from '../../services/api';
import type { User, Business } from '../../types/app';

interface AuthModalProps {
  mode: 'login' | 'signup';
  onClose: () => void;
  onSwitchMode: (mode: 'login' | 'signup') => void;
  onSuccess: (user: User, business: Business | null) => void;
}

// Inject keyframe animations
const injectStyles = () => {
  if (document.getElementById('auth-modal-animations')) return;

  const styleSheet = document.createElement('style');
  styleSheet.id = 'auth-modal-animations';
  styleSheet.textContent = `
    @keyframes authModalFadeIn {
      from {
        opacity: 0;
        backdrop-filter: blur(0px);
      }
      to {
        opacity: 1;
        backdrop-filter: blur(20px);
      }
    }

    @keyframes authModalSlideIn {
      from {
        opacity: 0;
        transform: scale(0.95) translateY(10px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    @keyframes authShake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-4px); }
      40%, 80% { transform: translateX(4px); }
    }

    @keyframes authSpin {
      to {
        transform: rotate(360deg);
      }
    }

    .auth-input-wrapper {
      transition: all 0.2s ease;
    }

    .auth-input-wrapper:focus-within {
      border-color: rgba(24, 24, 27, 0.3);
      box-shadow: 0 0 0 3px rgba(24, 24, 27, 0.08);
    }

    .auth-btn {
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .auth-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    }

    .auth-btn:active:not(:disabled) {
      transform: translateY(0);
    }

    .auth-social-btn {
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .auth-social-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-color: rgba(0, 0, 0, 0.15);
    }

    .auth-social-btn:active {
      transform: translateY(0);
    }

    .auth-close-btn {
      transition: all 0.2s ease;
    }

    .auth-close-btn:hover {
      background-color: rgba(0, 0, 0, 0.05);
      transform: rotate(90deg);
    }

    .auth-switch-link {
      transition: color 0.2s ease;
    }

    .auth-switch-link:hover {
      color: #18181B !important;
      text-decoration: underline;
    }

    .auth-error {
      animation: authShake 0.4s ease;
    }
  `;
  document.head.appendChild(styleSheet);
};

export function AuthModal({ mode, onClose, onSwitchMode, onSuccess }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    injectStyles();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        // Register new user and business
        const tokenResponse = await authApi.register(email, password, name, businessName);
        setAuthToken(tokenResponse.access_token);

        // Get user info
        const meResponse = await authApi.getMe();
        onSuccess(meResponse.user as User, meResponse.business as Business | null);
      } else {
        // Login
        const tokenResponse = await authApi.login(email, password);
        setAuthToken(tokenResponse.access_token);

        // Get user info
        const meResponse = await authApi.getMe();
        onSuccess(meResponse.user as User, meResponse.business as Business | null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
        <button style={styles.modalClose} onClick={onClose} className="auth-close-btn">
          <Icons.X />
        </button>

        <div style={styles.modalHeader}>
          <div style={styles.logoContainer}>
            <Icons.Logo />
          </div>
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

        {error && (
          <div style={styles.errorMessage} className="auth-error">
            <Icons.AlertCircle />
            <span>{error}</span>
          </div>
        )}

        <form style={styles.authForm} onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <>
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Full name</label>
                <div style={styles.inputWrapper} className="auth-input-wrapper">
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

              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Business name</label>
                <div style={styles.inputWrapper} className="auth-input-wrapper">
                  <Icons.Building />
                  <input
                    type="text"
                    style={styles.input}
                    placeholder="Enter your company name"
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Email address</label>
            <div style={styles.inputWrapper} className="auth-input-wrapper">
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
            <div style={styles.inputWrapper} className="auth-input-wrapper">
              <Icons.Lock />
              <input
                type={showPassword ? 'text' : 'password'}
                style={styles.input}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
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
            className="auth-btn"
          >
            {loading ? (
              <>
                <div style={styles.spinner} />
                Please wait...
              </>
            ) : (
              mode === 'login' ? 'Sign in' : 'Create account'
            )}
          </button>
        </form>

        <div style={styles.authDivider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>or continue with</span>
          <span style={styles.dividerLine} />
        </div>

        <div style={styles.socialButtons}>
          <button style={styles.socialButton} className="auth-social-btn">
            <Icons.Google />
            Google
          </button>
          <button style={styles.socialButton} className="auth-social-btn">
            <Icons.GitHub />
            GitHub
          </button>
        </div>

        <p style={styles.authSwitch}>
          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <button
            style={styles.authSwitchButton}
            onClick={() => {
              setError(null);
              onSwitchMode(mode === 'login' ? 'signup' : 'login');
            }}
            className="auth-switch-link"
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
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '24px',
    animation: 'authModalFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
  },
  modalContent: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
    padding: '40px',
    position: 'relative',
    maxHeight: '90vh',
    overflowY: 'auto',
    animation: 'authModalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
  },
  modalClose: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#71717A',
    cursor: 'pointer',
    borderRadius: '10px',
  },
  modalHeader: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logoContainer: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px',
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: '600',
    marginTop: '16px',
    marginBottom: '8px',
    color: '#18181B',
    letterSpacing: '-0.02em',
  },
  modalSubtitle: {
    fontSize: '14px',
    color: '#71717A',
  },
  errorMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 16px',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '12px',
    marginBottom: '24px',
    color: '#DC2626',
    fontSize: '14px',
  },
  authForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  inputLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#18181B',
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    backgroundColor: '#FAFAFA',
    border: '1px solid #E4E4E7',
    borderRadius: '12px',
  },
  input: {
    flex: 1,
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '14px',
    outline: 'none',
    color: '#18181B',
  },
  passwordToggle: {
    background: 'none',
    border: 'none',
    color: '#71717A',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    transition: 'color 0.2s ease',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    background: 'none',
    border: 'none',
    fontSize: '13px',
    color: '#71717A',
    cursor: 'pointer',
    marginTop: '-8px',
    transition: 'color 0.2s ease',
  },
  submitButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '16px',
    fontSize: '15px',
    fontWeight: '500',
    color: '#FFFFFF',
    backgroundColor: '#18181B',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    marginTop: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  spinner: {
    width: '18px',
    height: '18px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#FFFFFF',
    borderRadius: '50%',
    animation: 'authSpin 0.8s linear infinite',
  },
  authDivider: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    margin: '28px 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#E4E4E7',
  },
  dividerText: {
    fontSize: '12px',
    color: '#A1A1AA',
    fontWeight: '500',
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
    gap: '10px',
    padding: '14px',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E4E7',
    borderRadius: '12px',
    cursor: 'pointer',
    color: '#18181B',
  },
  authSwitch: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#71717A',
    marginTop: '28px',
  },
  authSwitchButton: {
    background: 'none',
    border: 'none',
    color: '#52525B',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default AuthModal;
