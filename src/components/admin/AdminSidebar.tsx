/**
 * Admin Sidebar Navigation
 * Premium light glass-morphism design inspired by Apple HIG
 */

import { useState } from 'react';
import type { Admin, AdminSection } from '../../types/admin';

interface AdminSidebarProps {
  admin: Admin;
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  onLogout: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

interface NavItem {
  id: AdminSection;
  label: string;
  icon: React.ReactNode;
  requiresRole?: 'super_admin';
}

const navItems: NavItem[] = [
  {
    id: 'businesses',
    label: 'Businesses',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16" />
      </svg>
    ),
  },
  {
    id: 'question-sets',
    label: 'Question Sets',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
      </svg>
    ),
  },
  {
    id: 'metrics',
    label: 'Metrics',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
  },
  {
    id: 'reviews',
    label: 'Reviews',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h6" />
      </svg>
    ),
  },
  {
    id: 'evaluations',
    label: 'Evaluations',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: 'admins',
    label: 'Team',
    requiresRole: 'super_admin',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
];

export function AdminSidebar({
  admin,
  activeSection,
  onSectionChange,
  onLogout,
  collapsed = false,
  onToggleCollapse,
  isDark = false,
  onToggleTheme,
}: AdminSidebarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Dark mode overrides
  const darkSidebar: React.CSSProperties = isDark ? {
    background: 'rgba(11,18,34,0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    boxShadow: 'none',
  } : {};

  return (
    <aside style={{
      ...styles.sidebar,
      ...darkSidebar,
      width: collapsed ? '72px' : '260px',
      transition: 'width 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
    }}>
      {/* Brand Header */}
      <div style={{
        ...styles.header,
        padding: collapsed ? '20px 16px 16px' : '20px 20px 16px',
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
        <div
          style={{
            ...styles.logo,
            cursor: onToggleCollapse ? 'pointer' : 'default',
          }}
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span style={styles.logoText}>TF</span>
        </div>
        {!collapsed && (
          <div style={styles.brandInfo}>
            <h1 style={{
              ...styles.brandTitle,
              color: isDark ? 'rgba(255,255,255,0.92)' : '#1D1D1F',
            }}>ThinkForward</h1>
            <span style={{
              ...styles.brandBadge,
              color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(60, 60, 67, 0.6)',
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0, 0, 0, 0.04)',
            }}>Admin</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{
        ...styles.nav,
        padding: collapsed ? '8px 8px' : '8px 12px',
      }}>
        <div style={styles.navSection}>
          {!collapsed && <span style={{
            ...styles.navLabel,
            color: isDark ? 'rgba(255,255,255,0.20)' : 'rgba(60, 60, 67, 0.4)',
          }}>Platform</span>}
          {navItems.map((item) => {
            const isAvailable = !item.requiresRole || admin.role === item.requiresRole;
            const isActive = activeSection === item.id;
            const isHovered = hoveredItem === item.id;

            if (!isAvailable) return null;

            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  ...styles.navItem,
                  ...(isActive && (isDark ? {
                    background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.92)',
                  } : styles.navItemActive)),
                  ...(isHovered && !isActive && {
                    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0, 0, 0, 0.03)',
                  }),
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  padding: collapsed ? '10px' : '10px 12px',
                  color: isDark && !isActive ? 'rgba(255,255,255,0.55)' : undefined,
                  position: 'relative',
                }}
              >
                <span style={{
                  ...styles.navIcon,
                  ...(isActive ? styles.navIconActive : (isDark ? {
                    background: 'rgba(255,255,255,0.04)',
                    color: 'rgba(255,255,255,0.4)',
                  } : {})),
                }}>
                  {item.icon}
                </span>
                {!collapsed && <span style={styles.navText}>{item.label}</span>}
                {collapsed && isHovered && (
                  <span className="sidebar-tooltip" style={{ opacity: 1 }}>{item.label}</span>
                )}
                {isActive && !collapsed && <div style={{
                  ...styles.activeIndicator,
                  background: isDark ? 'rgba(255,255,255,0.6)' : '#1D1D1F',
                }} />}
              </button>
            );
          })}
        </div>
      </nav>

      {/* User Footer */}
      <div style={{
        ...styles.footer,
        padding: collapsed ? '12px 8px' : '16px',
        borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0, 0, 0, 0.06)',
      }}>
        {collapsed ? (
          /* Collapsed: Avatar only */
          <div
            style={{
              ...styles.avatar,
              width: '40px',
              height: '40px',
              margin: '0 auto 8px',
            }}
            title={admin.name}
          >
            <span style={styles.avatarText}>
              {admin.name.charAt(0).toUpperCase()}
            </span>
          </div>
        ) : (
          /* Expanded: Full user card */
          <div style={{
            ...styles.userCard,
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0, 0, 0, 0.02)',
          }}>
            <div style={styles.avatar}>
              <span style={styles.avatarText}>
                {admin.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div style={styles.userInfo}>
              <p style={{
                ...styles.userName,
                color: isDark ? 'rgba(255,255,255,0.85)' : '#1D1D1F',
              }}>{admin.name}</p>
              <p style={{
                ...styles.userRole,
                color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(60, 60, 67, 0.6)',
              }}>
                {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </p>
            </div>
          </div>
        )}

        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            style={{
              ...styles.logoutButton,
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? '10px' : '10px 12px',
              color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(60, 60, 67, 0.6)',
              marginBottom: '4px',
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0, 0, 0, 0.03)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {isDark ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
            {!collapsed && <span>{isDark ? 'Light mode' : 'Dark mode'}</span>}
          </button>
        )}

        <button
          onClick={() => window.open('/docs', '_blank')}
          title={collapsed ? 'Documentation' : undefined}
          style={{
            ...styles.logoutButton,
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '10px' : '10px 12px',
            color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(60, 60, 67, 0.6)',
            marginBottom: '4px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
          </svg>
          {!collapsed && <span>Documentation</span>}
        </button>

        <button
          onClick={onLogout}
          title={collapsed ? 'Sign out' : undefined}
          style={{
            ...styles.logoutButton,
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '10px' : '10px 12px',
            color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(60, 60, 67, 0.6)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(220, 38, 38, 0.06)';
            e.currentTarget.style.color = '#DC2626';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(60, 60, 67, 0.6)';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '260px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderRight: '1px solid rgba(0, 0, 0, 0.06)',
    boxShadow: '2px 0 12px rgba(0, 0, 0, 0.03)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '20px 20px 16px',
  },
  logo: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #1D1D1F 0%, #3A3A3C 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
    flexShrink: 0,
  },
  logoText: {
    fontSize: '15px',
    fontWeight: 700,
    color: 'white',
  },
  brandInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  brandTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1D1D1F',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  brandBadge: {
    fontSize: '10px',
    fontWeight: 600,
    color: 'rgba(60, 60, 67, 0.6)',
    background: 'rgba(0, 0, 0, 0.04)',
    padding: '3px 8px',
    borderRadius: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  nav: {
    flex: 1,
    padding: '8px 12px',
    overflowY: 'auto',
  },
  navSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  navLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: 'rgba(60, 60, 67, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    padding: '12px 12px 8px',
  },
  navItem: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '10px 12px',
    borderRadius: '10px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    textAlign: 'left',
    color: 'rgba(60, 60, 67, 0.8)',
  },
  navItemHover: {
    background: 'rgba(0, 0, 0, 0.03)',
  },
  navItemActive: {
    background: 'rgba(0, 0, 0, 0.05)',
    color: '#1D1D1F',
  },
  navIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'rgba(0, 0, 0, 0.03)',
    color: 'rgba(60, 60, 67, 0.6)',
    transition: 'all 0.15s ease',
  },
  navIconActive: {
    background: 'linear-gradient(135deg, #1D1D1F 0%, #3A3A3C 100%)',
    color: 'white',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
  },
  navText: {
    fontSize: '14px',
    fontWeight: 500,
    letterSpacing: '-0.01em',
  },
  activeIndicator: {
    position: 'absolute',
    right: '12px',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#1D1D1F',
  },
  footer: {
    padding: '16px',
    borderTop: '1px solid rgba(0, 0, 0, 0.06)',
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    borderRadius: '12px',
    background: 'rgba(0, 0, 0, 0.02)',
    marginBottom: '8px',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'white',
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#1D1D1F',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  userRole: {
    fontSize: '11px',
    color: 'rgba(60, 60, 67, 0.6)',
    margin: '2px 0 0 0',
  },
  logoutButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '10px',
    border: 'none',
    background: 'transparent',
    color: 'rgba(60, 60, 67, 0.6)',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
};

export default AdminSidebar;
