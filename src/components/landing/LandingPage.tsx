import type { CSSProperties } from 'react';
import { Icons } from '../common/Icons';

interface LandingPageProps {
  onLogin: () => void;
  onSignup: () => void;
}

export function LandingPage({ onLogin, onSignup }: LandingPageProps) {
  return (
    <div style={styles.landingContainer}>
      {/* Navigation */}
      <nav style={styles.landingNav}>
        <div style={styles.landingNavInner}>
          <div style={styles.logoContainer}>
            <Icons.Logo />
            <span style={styles.logoText}>Think Forward</span>
          </div>
          <div style={styles.navActions}>
            <button style={styles.navLinkButton} onClick={onLogin}>Log in</button>
            <button style={styles.primaryButton} onClick={onSignup}>Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={styles.heroSection}>
        <div style={styles.heroContent}>
          <div style={styles.heroBadge}>Business Readiness Platform</div>
          <h1 style={styles.heroTitle}>
            Understand your capabilities.<br />
            Move forward with clarity.
          </h1>
          <p style={styles.heroSubtitle}>
            Think Forward analyzes your business through interviews, documents, and data
            integrations to provide actionable insights on your organizational readiness.
          </p>
          <div style={styles.heroActions}>
            <button style={styles.heroPrimaryButton} onClick={onSignup}>
              Start Assessment
              <Icons.ArrowRight />
            </button>
            <button style={styles.heroSecondaryButton}>
              See how it works
            </button>
          </div>
        </div>

        {/* Hero Visual */}
        <div style={styles.heroVisual}>
          <div style={styles.heroCard}>
            <div style={styles.heroCardHeader}>
              <span style={styles.heroCardTitle}>Readiness Score</span>
              <span style={styles.heroCardBadge}>Live</span>
            </div>
            <div style={styles.heroScoreContainer}>
              <span style={styles.heroScore}>78</span>
              <span style={styles.heroScoreLabel}>/100</span>
            </div>
            <div style={styles.heroMetrics}>
              <div style={styles.heroMetric}>
                <span style={styles.heroMetricLabel}>Strategy</span>
                <div style={styles.heroMetricBar}>
                  <div style={{...styles.heroMetricFill, width: '85%'}} />
                </div>
              </div>
              <div style={styles.heroMetric}>
                <span style={styles.heroMetricLabel}>Operations</span>
                <div style={styles.heroMetricBar}>
                  <div style={{...styles.heroMetricFill, width: '72%'}} />
                </div>
              </div>
              <div style={styles.heroMetric}>
                <span style={styles.heroMetricLabel}>Technology</span>
                <div style={styles.heroMetricBar}>
                  <div style={{...styles.heroMetricFill, width: '68%'}} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={styles.featuresSection}>
        <div style={styles.featuresHeader}>
          <h2 style={styles.featuresTitle}>Three ways to understand your business</h2>
          <p style={styles.featuresSubtitle}>
            Our AI-powered platform gathers insights through multiple channels to build a complete picture.
          </p>
        </div>

        <div style={styles.featuresGrid}>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>
              <Icons.Interview />
            </div>
            <h3 style={styles.featureTitle}>Structured Interviews</h3>
            <p style={styles.featureDesc}>
              Answer targeted questions via text or voice. Our AI adapts follow-ups based on your responses.
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>
              <Icons.Documents />
            </div>
            <h3 style={styles.featureTitle}>Document Analysis</h3>
            <p style={styles.featureDesc}>
              Upload policies, reports, and internal docs. Our agents extract insights and identify gaps.
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>
              <Icons.Integrations />
            </div>
            <h3 style={styles.featureTitle}>Data Integrations</h3>
            <p style={styles.featureDesc}>
              Connect your CRM, databases, and social accounts for real-time capability assessment.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={styles.ctaSection}>
        <h2 style={styles.ctaTitle}>Ready to assess your business?</h2>
        <p style={styles.ctaSubtitle}>Join forward-thinking organizations using data-driven insights.</p>
        <button style={styles.ctaButton} onClick={onSignup}>
          Get Started Free
          <Icons.ArrowRight />
        </button>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div style={styles.footerLogo}>
            <Icons.Logo />
            <span style={styles.logoText}>Think Forward</span>
          </div>
          <p style={styles.footerText}>© 2026 Think Forward. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  landingContainer: {
    minHeight: '100vh',
    backgroundColor: '#FAFAFA',
  },

  // Navigation
  landingNav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(250, 250, 250, 0.8)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid #F4F4F5',
    zIndex: 100,
  },
  landingNavInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#18181B',
    letterSpacing: '-0.01em',
  },
  navActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  navLinkButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#71717A',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },
  primaryButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#FFFFFF',
    backgroundColor: '#18181B',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },

  // Hero
  heroSection: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '140px 24px 80px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '80px',
    alignItems: 'center',
  },
  heroContent: {
    maxWidth: '540px',
  },
  heroBadge: {
    display: 'inline-block',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#71717A',
    backgroundColor: '#F4F4F5',
    borderRadius: '100px',
    marginBottom: '24px',
  },
  heroTitle: {
    fontSize: '48px',
    fontWeight: '600',
    lineHeight: '1.1',
    letterSpacing: '-0.02em',
    marginBottom: '24px',
  },
  heroSubtitle: {
    fontSize: '18px',
    color: '#71717A',
    lineHeight: '1.6',
    marginBottom: '32px',
  },
  heroActions: {
    display: 'flex',
    gap: '12px',
  },
  heroPrimaryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 24px',
    fontSize: '15px',
    fontWeight: '500',
    color: '#FFFFFF',
    backgroundColor: '#18181B',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  heroSecondaryButton: {
    padding: '14px 24px',
    fontSize: '15px',
    fontWeight: '500',
    color: '#18181B',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E4E7',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  heroVisual: {
    display: 'flex',
    justifyContent: 'center',
  },
  heroCard: {
    width: '100%',
    maxWidth: '380px',
    padding: '32px',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E4E4E7',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
  },
  heroCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  heroCardTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#71717A',
  },
  heroCardBadge: {
    padding: '4px 8px',
    fontSize: '11px',
    fontWeight: '500',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    borderRadius: '4px',
  },
  heroScoreContainer: {
    display: 'flex',
    alignItems: 'baseline',
    marginBottom: '32px',
  },
  heroScore: {
    fontSize: '64px',
    fontWeight: '600',
    letterSpacing: '-0.02em',
  },
  heroScoreLabel: {
    fontSize: '24px',
    color: '#A1A1AA',
    marginLeft: '4px',
  },
  heroMetrics: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  heroMetric: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  heroMetricLabel: {
    fontSize: '13px',
    color: '#71717A',
  },
  heroMetricBar: {
    height: '6px',
    backgroundColor: '#F4F4F5',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  heroMetricFill: {
    height: '100%',
    backgroundColor: '#18181B',
    borderRadius: '3px',
  },

  // Features
  featuresSection: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '80px 24px',
  },
  featuresHeader: {
    textAlign: 'center',
    marginBottom: '48px',
  },
  featuresTitle: {
    fontSize: '32px',
    fontWeight: '600',
    letterSpacing: '-0.02em',
    marginBottom: '12px',
  },
  featuresSubtitle: {
    fontSize: '16px',
    color: '#71717A',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '24px',
  },
  featureCard: {
    padding: '32px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E4E4E7',
  },
  featureIcon: {
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F5',
    borderRadius: '12px',
    marginBottom: '20px',
  },
  featureTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '12px',
  },
  featureDesc: {
    fontSize: '14px',
    color: '#71717A',
    lineHeight: '1.6',
  },

  // CTA
  ctaSection: {
    textAlign: 'center',
    padding: '80px 24px',
    backgroundColor: '#18181B',
    color: '#FFFFFF',
  },
  ctaTitle: {
    fontSize: '32px',
    fontWeight: '600',
    marginBottom: '12px',
  },
  ctaSubtitle: {
    fontSize: '16px',
    color: '#A1A1AA',
    marginBottom: '32px',
  },
  ctaButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 28px',
    fontSize: '15px',
    fontWeight: '500',
    color: '#18181B',
    backgroundColor: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
  },

  // Footer
  footer: {
    borderTop: '1px solid #F4F4F5',
    padding: '24px',
  },
  footerInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  footerText: {
    fontSize: '13px',
    color: '#A1A1AA',
  },
};

export default LandingPage;
