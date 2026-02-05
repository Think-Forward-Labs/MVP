/**
 * Admins Section
 * Premium light theme with glass cards - Apple HIG inspired
 */

import { useState, useEffect } from 'react';
import { adminApi } from '../../../services/adminApi';
import type { AdminListItem, AdminRole } from '../../../types/admin';

export function AdminsSection() {
  const [admins, setAdmins] = useState<AdminListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'admin' as 'admin' | 'support',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.getAdmins();
      setAdmins(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admins');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setIsCreating(true);

    try {
      await adminApi.createAdmin(createForm);
      setShowCreateModal(false);
      setCreateForm({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'admin',
      });
      loadAdmins();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create admin');
    } finally {
      setIsCreating(false);
    }
  };

  const getRoleStyle = (role: AdminRole) => {
    switch (role) {
      case 'super_admin':
        return { bg: 'rgba(139, 92, 246, 0.1)', color: '#7C3AED' };
      case 'admin':
        return { bg: 'rgba(99, 102, 241, 0.1)', color: '#4F46E5' };
      case 'support':
        return { bg: 'rgba(34, 197, 94, 0.1)', color: '#16A34A' };
      default:
        return { bg: 'rgba(107, 114, 128, 0.1)', color: '#6B7280' };
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Team</h1>
          <p style={styles.subtitle}>
            Manage admin users and permissions
          </p>
        </div>
        <div style={styles.headerActions}>
          <div style={styles.stats}>
            <div style={styles.statItem}>
              <span style={styles.statValue}>{admins.length}</span>
              <span style={styles.statLabel}>Total</span>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statItem}>
              <span style={styles.statValue}>
                {admins.filter(a => a.is_active).length}
              </span>
              <span style={styles.statLabel}>Active</span>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={styles.addButton}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Admin
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Loading team members...</p>
        </div>
      ) : error ? (
        <div style={styles.errorContainer}>
          <div style={styles.errorIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p style={styles.errorText}>{error}</p>
          <button onClick={loadAdmins} style={styles.retryButton}>
            Try again
          </button>
        </div>
      ) : admins.length === 0 ? (
        <div style={styles.emptyContainer}>
          <div style={styles.emptyIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <p style={styles.emptyTitle}>No team members yet</p>
          <p style={styles.emptyText}>Add your first admin to get started</p>
        </div>
      ) : (
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Admin</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin, index) => {
                const roleStyle = getRoleStyle(admin.role);
                return (
                  <tr
                    key={admin.id}
                    style={{
                      ...styles.tr,
                      borderBottom: index === admins.length - 1 ? 'none' : '1px solid rgba(0, 0, 0, 0.04)',
                    }}
                  >
                    <td style={styles.td}>
                      <div style={styles.adminCell}>
                        <div style={styles.avatar}>
                          {admin.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={styles.adminName}>{admin.name}</p>
                          <p style={styles.adminEmail}>{admin.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.roleBadge,
                        background: roleStyle.bg,
                        color: roleStyle.color,
                      }}>
                        {admin.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        ...(admin.is_active
                          ? { background: 'rgba(34, 197, 94, 0.1)', color: '#16A34A' }
                          : { background: 'rgba(239, 68, 68, 0.1)', color: '#DC2626' }),
                      }}>
                        <span style={{
                          ...styles.statusDot,
                          background: admin.is_active ? '#22C55E' : '#EF4444',
                        }} />
                        {admin.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.date}>
                        {new Date(admin.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>Add Team Member</h2>
                <p style={styles.modalSubtitle}>Create a new admin account</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={styles.closeButton}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} style={styles.form}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>First Name</label>
                  <input
                    type="text"
                    value={createForm.first_name}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, first_name: e.target.value })
                    }
                    required
                    style={styles.input}
                    placeholder="John"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Last Name</label>
                  <input
                    type="text"
                    value={createForm.last_name}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, last_name: e.target.value })
                    }
                    required
                    style={styles.input}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, email: e.target.value })
                  }
                  required
                  style={styles.input}
                  placeholder="admin@thinkforward.ai"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Password</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, password: e.target.value })
                  }
                  required
                  style={styles.input}
                  placeholder="Minimum 8 characters"
                  minLength={8}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Role</label>
                <select
                  value={createForm.role}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      role: e.target.value as 'admin' | 'support',
                    })
                  }
                  style={styles.select}
                >
                  <option value="admin">Admin</option>
                  <option value="support">Support</option>
                </select>
              </div>

              {createError && (
                <div style={styles.formError}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {createError}
                </div>
              )}

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  style={{
                    ...styles.submitButton,
                    opacity: isCreating ? 0.7 : 1,
                    cursor: isCreating ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isCreating ? (
                    <div style={styles.buttonSpinner} />
                  ) : (
                    'Create Admin'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '32px 40px',
    maxWidth: '1100px',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '28px',
  },
  title: {
    fontSize: '26px',
    fontWeight: 600,
    color: '#1D1D1F',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '14px',
    color: 'rgba(60, 60, 67, 0.6)',
    margin: '4px 0 0 0',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  stats: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '12px 20px',
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderRadius: '12px',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#1D1D1F',
  },
  statLabel: {
    fontSize: '11px',
    color: 'rgba(60, 60, 67, 0.6)',
    marginTop: '2px',
  },
  statDivider: {
    width: '1px',
    height: '28px',
    background: 'rgba(0, 0, 0, 0.08)',
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #1D1D1F 0%, #3A3A3C 100%)',
    color: 'white',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 0',
    gap: '16px',
  },
  spinner: {
    width: '28px',
    height: '28px',
    border: '2px solid rgba(0, 0, 0, 0.08)',
    borderTopColor: '#1D1D1F',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: '14px',
    color: 'rgba(60, 60, 67, 0.6)',
    margin: 0,
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '80px 0',
    gap: '12px',
  },
  errorIcon: {
    color: '#DC2626',
    marginBottom: '4px',
  },
  errorText: {
    fontSize: '14px',
    color: '#DC2626',
    margin: 0,
  },
  retryButton: {
    marginTop: '8px',
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    background: '#1D1D1F',
    color: 'white',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '80px 0',
    gap: '8px',
  },
  emptyIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    background: 'rgba(0, 0, 0, 0.03)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(60, 60, 67, 0.3)',
    marginBottom: '8px',
  },
  emptyTitle: {
    fontSize: '15px',
    fontWeight: 500,
    color: '#1D1D1F',
    margin: 0,
  },
  emptyText: {
    fontSize: '13px',
    color: 'rgba(60, 60, 67, 0.6)',
    margin: 0,
  },
  tableCard: {
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderRadius: '16px',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '14px 20px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: 600,
    color: 'rgba(60, 60, 67, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    background: 'rgba(0, 0, 0, 0.02)',
    borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
  },
  tr: {
    transition: 'background 0.15s ease',
  },
  td: {
    padding: '16px 20px',
    fontSize: '14px',
    color: '#1D1D1F',
    verticalAlign: 'middle',
  },
  adminCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 600,
    color: 'white',
    flexShrink: 0,
  },
  adminName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#1D1D1F',
    margin: 0,
  },
  adminEmail: {
    fontSize: '12px',
    color: 'rgba(60, 60, 67, 0.5)',
    margin: '2px 0 0 0',
  },
  roleBadge: {
    display: 'inline-block',
    padding: '5px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
    textTransform: 'capitalize',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '5px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
  },
  date: {
    color: 'rgba(60, 60, 67, 0.6)',
    fontSize: '13px',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    width: '100%',
    maxWidth: '440px',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(40px) saturate(200%)',
    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(255, 255, 255, 0.2) inset',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: '24px 24px 0',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1D1D1F',
    margin: 0,
    letterSpacing: '-0.01em',
  },
  modalSubtitle: {
    fontSize: '13px',
    color: 'rgba(60, 60, 67, 0.6)',
    margin: '4px 0 0 0',
  },
  closeButton: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    border: 'none',
    background: 'rgba(0, 0, 0, 0.04)',
    color: 'rgba(60, 60, 67, 0.6)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  form: {
    padding: '24px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '16px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: '#1D1D1F',
    marginBottom: '8px',
    paddingLeft: '2px',
  },
  input: {
    width: '100%',
    height: '44px',
    padding: '0 14px',
    borderRadius: '10px',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    background: 'rgba(255, 255, 255, 0.9)',
    fontSize: '14px',
    color: '#1D1D1F',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    height: '44px',
    padding: '0 14px',
    borderRadius: '10px',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    background: 'rgba(255, 255, 255, 0.9)',
    fontSize: '14px',
    color: '#1D1D1F',
    outline: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  formError: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    borderRadius: '10px',
    background: 'rgba(220, 38, 38, 0.06)',
    border: '1px solid rgba(220, 38, 38, 0.1)',
    color: '#DC2626',
    fontSize: '13px',
    marginBottom: '16px',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    paddingTop: '8px',
  },
  cancelButton: {
    padding: '10px 18px',
    borderRadius: '10px',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    background: 'transparent',
    color: 'rgba(60, 60, 67, 0.8)',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  submitButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 20px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #1D1D1F 0%, #3A3A3C 100%)',
    color: 'white',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    minWidth: '120px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
  },
  buttonSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};

export default AdminsSection;
