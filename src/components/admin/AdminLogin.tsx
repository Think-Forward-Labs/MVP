/**
 * Admin Login Page
 * Premium light theme with glass-morphism inspired by Apple HIG
 */

import { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';
import type { Admin } from '../../types/admin';

interface AdminLoginProps {
  onSuccess: (admin: Admin) => void;
}

export function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await adminApi.login(email, password);
      onSuccess(response.admin);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Subtle gradient background */}
      <div style={styles.backgroundGradient} />

      {/* Floating shapes for depth */}
      <div style={styles.shapesContainer}>
        <div style={{ ...styles.shape, ...styles.shape1 }} />
        <div style={{ ...styles.shape, ...styles.shape2 }} />
        <div style={{ ...styles.shape, ...styles.shape3 }} />
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Login Card */}
        <div
          style={{
            ...styles.card,
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            animation: shake ? 'shake 0.5s ease-in-out' : undefined,
          }}
        >
          {/* Logo & Header */}
          <div style={styles.header}>
            <div style={styles.logoContainer}>
              <div style={styles.logo}>
                <span style={styles.logoText}>TF</span>
              </div>
            </div>
            <h1 style={styles.title}>Admin Portal</h1>
            <p style={styles.subtitle}>Sign in to manage the platform</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Email Input */}
            <div style={styles.inputGroup}>
              <label htmlFor="email" style={styles.label}>
                Email address
              </label>
              <div
                style={{
                  ...styles.inputWrapper,
                  ...(focusedField === 'email' && styles.inputWrapperFocused),
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={styles.inputIcon}>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="admin@thinkforward.ai"
                  required
                  style={styles.input}
                />
              </div>
            </div>

            {/* Password Input */}
            <div style={styles.inputGroup}>
              <label htmlFor="password" style={styles.label}>
                Password
              </label>
              <div
                style={{
                  ...styles.inputWrapper,
                  ...(focusedField === 'password' && styles.inputWrapperFocused),
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={styles.inputIcon}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter your password"
                  required
                  style={styles.input}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div style={styles.errorContainer}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#DC2626' }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span style={styles.errorText}>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                ...styles.button,
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? (
                <div style={styles.spinner} />
              ) : (
                <>
                  Sign in
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p style={styles.footer}>
          ThinkForward.ai · Admin Portal
        </p>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(3deg); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    position: 'relative',
    overflow: 'hidden',
    background: '#FAFAFA',
  },
  backgroundGradient: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(135deg, #F5F5F7 0%, #E8E8ED 50%, #F5F5F7 100%)',
  },
  shapesContainer: {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  shape: {
    position: 'absolute',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.06))',
    filter: 'blur(60px)',
  },
  shape1: {
    top: '-10%',
    right: '-5%',
    width: '400px',
    height: '400px',
    animation: 'float 20s ease-in-out infinite',
  },
  shape2: {
    bottom: '-15%',
    left: '-10%',
    width: '500px',
    height: '500px',
    animation: 'float 25s ease-in-out infinite reverse',
  },
  shape3: {
    top: '40%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '300px',
    height: '300px',
    opacity: 0.5,
  },
  content: {
    position: 'relative',
    zIndex: 10,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    background: 'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.02)',
    padding: '40px 32px',
    transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logoContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  logo: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #1D1D1F 0%, #3A3A3C 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: 700,
    color: 'white',
    letterSpacing: '-0.02em',
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#1D1D1F',
    margin: '0 0 8px 0',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '15px',
    color: 'rgba(60, 60, 67, 0.6)',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#1D1D1F',
    paddingLeft: '4px',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '12px',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    transition: 'all 0.2s ease',
  },
  inputWrapperFocused: {
    borderColor: 'rgba(99, 102, 241, 0.5)',
    boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.08)',
    background: 'white',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    color: 'rgba(60, 60, 67, 0.4)',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    height: '48px',
    padding: '0 16px 0 44px',
    borderRadius: '12px',
    border: 'none',
    background: 'transparent',
    fontSize: '15px',
    color: '#1D1D1F',
    outline: 'none',
    boxSizing: 'border-box',
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 16px',
    borderRadius: '12px',
    background: 'rgba(220, 38, 38, 0.06)',
    border: '1px solid rgba(220, 38, 38, 0.1)',
  },
  errorText: {
    fontSize: '14px',
    color: '#DC2626',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    height: '52px',
    marginTop: '8px',
    borderRadius: '14px',
    border: 'none',
    background: 'linear-gradient(135deg, #1D1D1F 0%, #3A3A3C 100%)',
    color: 'white',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  footer: {
    marginTop: '32px',
    fontSize: '13px',
    color: 'rgba(60, 60, 67, 0.4)',
    letterSpacing: '-0.01em',
  },
};

export default AdminLogin;
