/**
 * Question Sets Section
 * Premium light theme with glass cards - Apple HIG inspired
 * Includes create/delete functionality with modals
 */

import { useState, useEffect } from 'react';
import { adminApi } from '../../../services/adminApi';
import type { QuestionSetOverview } from '../../../types/admin';
import { QuestionSetDetailView } from './QuestionSetDetailView';

export function QuestionSetsSection() {
  const [questionSets, setQuestionSets] = useState<QuestionSetOverview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuestionSetId, setSelectedQuestionSetId] = useState<string | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<QuestionSetOverview | null>(null);

  useEffect(() => {
    loadQuestionSets();
  }, []);

  const loadQuestionSets = async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.getQuestionSets();
      setQuestionSets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load question sets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    loadQuestionSets();
  };

  const handleDeleteSuccess = () => {
    setShowDeleteModal(false);
    setDeleteTarget(null);
    loadQuestionSets();
  };

  const openDeleteModal = (qs: QuestionSetOverview, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(qs);
    setShowDeleteModal(true);
  };

  const filteredSets = questionSets.filter(
    (qs) =>
      qs.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      qs.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
      case 'published':
        return { bg: 'rgba(34, 197, 94, 0.1)', color: '#16A34A' };
      case 'draft':
        return { bg: 'rgba(245, 158, 11, 0.1)', color: '#D97706' };
      default:
        return { bg: 'rgba(107, 114, 128, 0.1)', color: '#6B7280' };
    }
  };

  // Show detail view if a question set is selected
  if (selectedQuestionSetId) {
    return (
      <QuestionSetDetailView
        questionSetId={selectedQuestionSetId}
        onBack={() => {
          setSelectedQuestionSetId(null);
          loadQuestionSets(); // Refresh list when coming back
        }}
      />
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Question Sets</h1>
          <p style={styles.subtitle}>
            Manage assessment question sets
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)} style={styles.createButton}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Question Set
        </button>
      </div>

      {/* Search */}
      <div style={styles.searchContainer}>
        <div style={styles.searchWrapper}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={styles.searchIcon}>
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search question sets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Loading question sets...</p>
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
          <button onClick={loadQuestionSets} style={styles.retryButton}>
            Try again
          </button>
        </div>
      ) : filteredSets.length === 0 ? (
        <div style={styles.emptyContainer}>
          <div style={styles.emptyIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
            </svg>
          </div>
          <p style={styles.emptyTitle}>
            {searchQuery ? 'No results found' : 'No question sets yet'}
          </p>
          <p style={styles.emptyText}>
            {searchQuery ? 'Try adjusting your search' : 'Create your first question set to get started'}
          </p>
          {!searchQuery && (
            <button onClick={() => setShowCreateModal(true)} style={styles.emptyCreateButton}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Create Question Set
            </button>
          )}
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredSets.map((qs) => {
            const statusStyle = getStatusStyle(qs.status);
            return (
              <div key={qs.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.cardIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <path d="M14 2v6h6" />
                    </svg>
                  </div>
                  <div style={styles.cardHeaderRight}>
                    <span style={{
                      ...styles.statusBadge,
                      background: statusStyle.bg,
                      color: statusStyle.color,
                    }}>
                      {qs.status}
                    </span>
                    <button
                      onClick={(e) => openDeleteModal(qs, e)}
                      style={styles.deleteIconButton}
                      title="Delete question set"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>

                <h3 style={styles.cardTitle}>{qs.name}</h3>
                <p style={styles.cardDescription}>
                  {qs.description || 'No description provided'}
                </p>

                <div style={styles.cardStats}>
                  <div style={styles.stat}>
                    <span style={styles.statValue}>{qs.total_questions}</span>
                    <span style={styles.statLabel}>Questions</span>
                  </div>
                  <div style={styles.statDivider} />
                  <div style={styles.stat}>
                    <span style={styles.statValue}>{qs.version}</span>
                    <span style={styles.statLabel}>Version</span>
                  </div>
                </div>

                <div style={styles.cardFooter}>
                  <span style={styles.createdAt}>
                    {new Date(qs.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <button
                    style={styles.viewButton}
                    onClick={() => setSelectedQuestionSetId(qs.id)}
                  >
                    View
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateQuestionSetModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && deleteTarget && (
        <DeleteQuestionSetModal
          questionSet={deleteTarget}
          onClose={() => {
            setShowDeleteModal(false);
            setDeleteTarget(null);
          }}
          onSuccess={handleDeleteSuccess}
        />
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideIn {
          from { opacity: 0; transform: translateY(-20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}

// Create Question Set Modal
function CreateQuestionSetModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState('1.0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await adminApi.createQuestionSet({
        name: name.trim(),
        description: description.trim() || undefined,
        version: version.trim() || '1.0',
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create question set');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <h2 style={modalStyles.title}>Create Question Set</h2>
          <button onClick={onClose} style={modalStyles.closeButton}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={modalStyles.body}>
            {error && (
              <div style={modalStyles.errorBanner}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <div style={modalStyles.field}>
              <label style={modalStyles.label}>Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., CABAS Readiness Assessment"
                style={modalStyles.input}
                autoFocus
              />
            </div>

            <div style={modalStyles.field}>
              <label style={modalStyles.label}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this question set..."
                style={modalStyles.textarea}
                rows={3}
              />
            </div>

            <div style={modalStyles.field}>
              <label style={modalStyles.label}>Version</label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.0"
                style={{ ...modalStyles.input, maxWidth: '120px' }}
              />
            </div>
          </div>

          <div style={modalStyles.footer}>
            <button type="button" onClick={onClose} style={modalStyles.cancelButton} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" style={modalStyles.submitButton} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Question Set'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete Question Set Modal with name confirmation
function DeleteQuestionSetModal({
  questionSet,
  onClose,
  onSuccess,
}: {
  questionSet: QuestionSetOverview;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [confirmName, setConfirmName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showShake, setShowShake] = useState(false);

  const isConfirmed = confirmName === questionSet.name;

  const handleDelete = async () => {
    if (!isConfirmed) {
      setShowShake(true);
      setTimeout(() => setShowShake(false), 500);
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await adminApi.deleteQuestionSet(questionSet.id);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete question set');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div
        style={{
          ...modalStyles.modal,
          ...modalStyles.dangerModal,
          animation: showShake ? 'shake 0.4s ease-in-out' : 'modalSlideIn 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={modalStyles.header}>
          <div style={modalStyles.dangerIconWrapper}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </div>
          <button onClick={onClose} style={modalStyles.closeButton}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={modalStyles.body}>
          <h2 style={modalStyles.dangerTitle}>Delete Question Set</h2>
          <p style={modalStyles.dangerText}>
            This action cannot be undone. This will permanently delete the question set
            <strong style={{ color: '#1D1D1F' }}> "{questionSet.name}" </strong>
            and all <strong style={{ color: '#1D1D1F' }}>{questionSet.total_questions} questions</strong> within it.
          </p>

          {error && (
            <div style={modalStyles.errorBanner}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <div style={modalStyles.field}>
            <label style={modalStyles.label}>
              Type <strong style={{ color: '#DC2626' }}>{questionSet.name}</strong> to confirm
            </label>
            <input
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder="Enter question set name"
              style={{
                ...modalStyles.input,
                borderColor: confirmName && !isConfirmed ? 'rgba(220, 38, 38, 0.5)' : undefined,
              }}
              autoFocus
            />
          </div>
        </div>

        <div style={modalStyles.footer}>
          <button onClick={onClose} style={modalStyles.cancelButton} disabled={isDeleting}>
            Cancel
          </button>
          <button
            onClick={handleDelete}
            style={{
              ...modalStyles.dangerButton,
              opacity: isConfirmed ? 1 : 0.5,
              cursor: isConfirmed ? 'pointer' : 'not-allowed',
            }}
            disabled={isDeleting || !isConfirmed}
          >
            {isDeleting ? 'Deleting...' : 'Delete Question Set'}
          </button>
        </div>
      </div>
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  createButton: {
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
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  },
  searchContainer: {
    marginBottom: '24px',
  },
  searchWrapper: {
    position: 'relative',
    maxWidth: '320px',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'rgba(60, 60, 67, 0.4)',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    height: '42px',
    paddingLeft: '42px',
    paddingRight: '16px',
    borderRadius: '10px',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    background: 'rgba(255, 255, 255, 0.9)',
    fontSize: '14px',
    color: '#1D1D1F',
    outline: 'none',
    boxSizing: 'border-box',
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
  emptyCreateButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '16px',
    padding: '10px 18px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #1D1D1F 0%, #3A3A3C 100%)',
    color: 'white',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderRadius: '16px',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
    padding: '20px',
    transition: 'all 0.2s ease',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  cardHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  cardIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #1D1D1F 0%, #3A3A3C 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 500,
    textTransform: 'capitalize',
  },
  deleteIconButton: {
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    border: 'none',
    background: 'rgba(220, 38, 38, 0.08)',
    color: '#DC2626',
    cursor: 'pointer',
    opacity: 0.7,
    transition: 'opacity 0.15s ease',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1D1D1F',
    margin: '0 0 6px 0',
    letterSpacing: '-0.01em',
  },
  cardDescription: {
    fontSize: '13px',
    color: 'rgba(60, 60, 67, 0.6)',
    margin: '0 0 16px 0',
    lineHeight: 1.5,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  cardStats: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '14px 0',
    borderTop: '1px solid rgba(0, 0, 0, 0.04)',
    borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
    marginBottom: '14px',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  statValue: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1D1D1F',
  },
  statLabel: {
    fontSize: '11px',
    color: 'rgba(60, 60, 67, 0.5)',
  },
  statDivider: {
    width: '1px',
    height: '28px',
    background: 'rgba(0, 0, 0, 0.06)',
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  createdAt: {
    fontSize: '12px',
    color: 'rgba(60, 60, 67, 0.5)',
  },
  viewButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 14px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #1D1D1F 0%, #3A3A3C 100%)',
    color: 'white',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
  },
};

const modalStyles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'modalFadeIn 0.2s ease-out',
  },
  modal: {
    background: 'white',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '480px',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    animation: 'modalSlideIn 0.2s ease-out',
  },
  dangerModal: {
    borderTop: '4px solid #DC2626',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px 0',
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1D1D1F',
    margin: 0,
  },
  closeButton: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    border: 'none',
    background: 'rgba(0, 0, 0, 0.05)',
    color: 'rgba(60, 60, 67, 0.6)',
    cursor: 'pointer',
  },
  body: {
    padding: '20px 24px',
  },
  field: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: 'rgba(60, 60, 67, 0.8)',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    background: 'white',
    fontSize: '14px',
    color: '#1D1D1F',
    outline: 'none',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    background: 'white',
    fontSize: '14px',
    color: '#1D1D1F',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 24px 24px',
  },
  cancelButton: {
    padding: '10px 18px',
    borderRadius: '10px',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    background: 'white',
    color: 'rgba(60, 60, 67, 0.8)',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  submitButton: {
    padding: '10px 20px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #1D1D1F 0%, #3A3A3C 100%)',
    color: 'white',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    marginBottom: '16px',
    borderRadius: '10px',
    background: 'rgba(220, 38, 38, 0.06)',
    border: '1px solid rgba(220, 38, 38, 0.1)',
    color: '#DC2626',
    fontSize: '13px',
  },
  dangerIconWrapper: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'rgba(220, 38, 38, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#DC2626',
  },
  dangerTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1D1D1F',
    margin: '0 0 8px 0',
  },
  dangerText: {
    fontSize: '14px',
    color: 'rgba(60, 60, 67, 0.8)',
    lineHeight: 1.6,
    margin: '0 0 20px 0',
  },
  dangerButton: {
    padding: '10px 20px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
    color: 'white',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
  },
};

export default QuestionSetsSection;
