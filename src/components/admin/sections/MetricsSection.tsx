/**
 * Metrics Management Section
 * Admin interface for managing CABAS assessment metrics
 */

import { useState, useEffect, useRef } from 'react';
import { adminApi } from '../../../services/adminApi';
import type { Metric, Question, QuestionWeightConfig, DerivedMetricSource } from '../../../types/admin';

interface MetricsSectionProps {
  onError: (message: string) => void;
}

export function MetricsSection({ onError }: MetricsSectionProps) {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const detailPanelRef = useRef<HTMLDivElement>(null);

  // Load metrics
  useEffect(() => {
    loadMetrics();
    loadQuestions();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getMetrics();
      setMetrics(data);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  const loadQuestions = async () => {
    try {
      // Load all question sets to get questions
      const sets = await adminApi.getQuestionSets();
      const allQuestions: Question[] = [];

      for (const set of sets) {
        const detail = await adminApi.getQuestionSet(set.id);
        allQuestions.push(...detail.questions);
      }

      setAvailableQuestions(allQuestions);
    } catch (err) {
      console.error('Failed to load questions:', err);
    }
  };

  const handleSelectMetric = (metric: Metric) => {
    setSelectedMetric(metric);
    setIsEditing(false);
    // Scroll detail panel to top when selecting a new metric
    if (detailPanelRef.current) {
      detailPanelRef.current.scrollTop = 0;
    }
  };

  const handleUpdateMetric = async (updates: Partial<Metric>) => {
    if (!selectedMetric) return;

    try {
      await adminApi.updateMetric(selectedMetric.id, updates);
      await loadMetrics();
      setIsEditing(false);
      // Update selected metric with new data
      const updated = await adminApi.getMetric(selectedMetric.id);
      setSelectedMetric(updated);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to update metric');
    }
  };

  const handleDeleteMetric = async (metricId: string) => {
    if (!confirm('Are you sure you want to delete this metric?')) return;

    try {
      await adminApi.deleteMetric(metricId);
      await loadMetrics();
      setSelectedMetric(null);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to delete metric');
    }
  };

  // Separate core and derived metrics
  const coreMetrics = metrics.filter(m => m.category === 'core');
  const derivedMetrics = metrics.filter(m => m.category === 'derived');

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading metrics...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Metrics</h1>
          <p style={styles.subtitle}>
            Configure CABAS assessment metrics and their question weights
          </p>
        </div>
        <button
          style={styles.createButton}
          onClick={() => setShowCreateModal(true)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Metric
        </button>
      </div>

      <div style={styles.content}>
        {/* Metrics List */}
        <div style={styles.listPanel}>
          {/* Core Metrics */}
          <div style={styles.metricGroup}>
            <h3 style={styles.groupTitle}>Core Metrics ({coreMetrics.length})</h3>
            <div style={styles.metricsList}>
              {coreMetrics.map((metric) => (
                <MetricCard
                  key={metric.id}
                  metric={metric}
                  isSelected={selectedMetric?.id === metric.id}
                  onClick={() => handleSelectMetric(metric)}
                />
              ))}
              {coreMetrics.length === 0 && (
                <p style={styles.emptyText}>No core metrics defined</p>
              )}
            </div>
          </div>

          {/* Derived Metrics */}
          <div style={styles.metricGroup}>
            <h3 style={styles.groupTitle}>Derived Scores ({derivedMetrics.length})</h3>
            <div style={styles.metricsList}>
              {derivedMetrics.map((metric) => (
                <MetricCard
                  key={metric.id}
                  metric={metric}
                  isSelected={selectedMetric?.id === metric.id}
                  onClick={() => handleSelectMetric(metric)}
                />
              ))}
              {derivedMetrics.length === 0 && (
                <p style={styles.emptyText}>No derived metrics defined</p>
              )}
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        <div ref={detailPanelRef} style={styles.detailPanel}>
          {selectedMetric ? (
            <MetricDetailView
              metric={selectedMetric}
              availableQuestions={availableQuestions}
              availableMetrics={coreMetrics}
              isEditing={isEditing}
              onEdit={() => setIsEditing(true)}
              onSave={handleUpdateMetric}
              onCancel={() => setIsEditing(false)}
              onDelete={() => handleDeleteMetric(selectedMetric.id)}
            />
          ) : (
            <div style={styles.emptyDetail}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(60, 60, 67, 0.3)" strokeWidth="1.5">
                <path d="M18 20V10M12 20V4M6 20v-6" />
              </svg>
              <p style={styles.emptyDetailText}>Select a metric to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Metric Modal */}
      {showCreateModal && (
        <CreateMetricModal
          availableQuestions={availableQuestions}
          availableMetrics={coreMetrics}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            loadMetrics();
          }}
          onError={onError}
        />
      )}
    </div>
  );
}

// Metric Card Component
function MetricCard({
  metric,
  isSelected,
  onClick,
}: {
  metric: Metric;
  isSelected: boolean;
  onClick: () => void;
}) {
  const getCategoryColor = (category: string) => {
    return category === 'core'
      ? { bg: 'rgba(99, 102, 241, 0.08)', color: '#6366F1' }
      : { bg: 'rgba(234, 179, 8, 0.08)', color: '#CA8A04' };
  };

  const categoryStyle = getCategoryColor(metric.category);
  const questionCount = metric.question_weights?.length || 0;
  const sourceCount = metric.source_metrics?.length || 0;

  return (
    <div
      style={{
        ...styles.metricCard,
        ...(isSelected && styles.metricCardSelected),
      }}
      onClick={onClick}
    >
      <div style={styles.metricCardHeader}>
        <span style={styles.metricCode}>{metric.code}</span>
        <span style={{
          ...styles.categoryBadge,
          background: categoryStyle.bg,
          color: categoryStyle.color,
        }}>
          {metric.category}
        </span>
      </div>
      <h4 style={styles.metricName}>{metric.name}</h4>
      {metric.academic_term && (
        <p style={styles.academicTerm}>{metric.academic_term}</p>
      )}
      <div style={styles.metricStats}>
        {metric.category === 'core' ? (
          <span style={styles.statItem}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
            {questionCount} questions
          </span>
        ) : (
          <span style={styles.statItem}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 20V10M12 20V4M6 20v-6" />
            </svg>
            {sourceCount} source metrics
          </span>
        )}
      </div>
    </div>
  );
}

// Expandable Question Weight Item Component
function ExpandableQuestionWeight({
  questionWeight,
  fullQuestion,
}: {
  questionWeight: QuestionWeightConfig;
  fullQuestion?: Question;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div style={styles.expandableWeightContainer}>
      <div
        style={styles.weightItem}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span style={styles.weightItemCode}>{questionWeight.question_code}</span>
        <span style={styles.weightItemText}>{questionWeight.question_text}</span>
        <span style={styles.weightItemValue}>{questionWeight.weight}%</span>
        <span style={{
          ...styles.expandIcon,
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </div>
      {isExpanded && (
        <div style={styles.expandedContent}>
          <div style={styles.fullQuestionLabel}>Full Question:</div>
          <p style={styles.fullQuestionText}>
            {fullQuestion?.text || 'Question text not available'}
          </p>
          {fullQuestion?.description && (
            <>
              <div style={styles.fullQuestionLabel}>Description:</div>
              <p style={styles.fullQuestionDescription}>{fullQuestion.description}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Metric Detail View Component
function MetricDetailView({
  metric,
  availableQuestions,
  availableMetrics: _availableMetrics,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: {
  metric: Metric;
  availableQuestions: Question[];
  availableMetrics: Metric[];
  isEditing: boolean;
  onEdit: () => void;
  onSave: (updates: Partial<Metric>) => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  // Note: _availableMetrics can be used for derived metric editing in the future
  const [editData, setEditData] = useState<Partial<Metric>>({});

  useEffect(() => {
    setEditData({
      name: metric.name,
      academic_term: metric.academic_term,
      description: metric.description,
      interpretation_guide: metric.interpretation_guide,
      question_weights: metric.question_weights || [],
      source_metrics: metric.source_metrics || [],
    });
  }, [metric, isEditing]);

  const handleSave = () => {
    onSave(editData);
  };

  const updateQuestionWeight = (index: number, weight: number) => {
    const weights = [...(editData.question_weights || [])];
    weights[index] = { ...weights[index], weight };
    setEditData({ ...editData, question_weights: weights });
  };

  const addQuestionWeight = (question: Question) => {
    const weights = [...(editData.question_weights || [])];
    weights.push({
      question_id: question.id,
      question_code: question.aspect_code,
      question_text: question.text.substring(0, 50) + '...',
      weight: 10,
    });
    setEditData({ ...editData, question_weights: weights });
  };

  const removeQuestionWeight = (index: number) => {
    const weights = [...(editData.question_weights || [])];
    weights.splice(index, 1);
    setEditData({ ...editData, question_weights: weights });
  };

  const totalWeight = (editData.question_weights || []).reduce((sum, qw) => sum + qw.weight, 0);

  return (
    <div style={styles.detailContent}>
      <div style={styles.detailHeader}>
        <div>
          <div style={styles.detailCodeRow}>
            <span style={styles.detailCode}>{metric.code}</span>
            <span style={{
              ...styles.statusBadge,
              background: metric.status === 'active'
                ? 'rgba(34, 197, 94, 0.1)'
                : 'rgba(234, 179, 8, 0.1)',
              color: metric.status === 'active' ? '#16A34A' : '#CA8A04',
            }}>
              {metric.status}
            </span>
          </div>
          {isEditing ? (
            <input
              type="text"
              value={editData.name || ''}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              style={styles.editInput}
              placeholder="Metric name"
            />
          ) : (
            <h2 style={styles.detailTitle}>{metric.name}</h2>
          )}
          {isEditing ? (
            <input
              type="text"
              value={editData.academic_term || ''}
              onChange={(e) => setEditData({ ...editData, academic_term: e.target.value })}
              style={{ ...styles.editInput, fontSize: '13px', color: 'rgba(60, 60, 67, 0.6)' }}
              placeholder="Academic term (optional)"
            />
          ) : (
            metric.academic_term && (
              <p style={styles.detailAcademicTerm}>{metric.academic_term}</p>
            )
          )}
        </div>
        <div style={styles.detailActions}>
          {isEditing ? (
            <>
              <button style={styles.cancelButton} onClick={onCancel}>Cancel</button>
              <button style={styles.saveButton} onClick={handleSave}>Save Changes</button>
            </>
          ) : (
            <>
              <button style={styles.editButton} onClick={onEdit}>Edit</button>
              <button style={styles.deleteButton} onClick={onDelete}>Delete</button>
            </>
          )}
        </div>
      </div>

      {/* Description */}
      <div style={styles.detailSection}>
        <h3 style={styles.sectionTitle}>Description</h3>
        {isEditing ? (
          <textarea
            value={editData.description || ''}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            style={styles.editTextarea}
            placeholder="Describe what this metric measures..."
            rows={3}
          />
        ) : (
          <p style={styles.descriptionText}>
            {metric.description || 'No description provided'}
          </p>
        )}
      </div>

      {/* Question Weights (for core metrics) */}
      {metric.category === 'core' && (
        <div style={styles.detailSection}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Question Weights</h3>
            {isEditing && (
              <span style={{
                ...styles.weightTotal,
                color: totalWeight === 100 ? '#16A34A' : totalWeight > 100 ? '#DC2626' : '#CA8A04',
              }}>
                Total: {totalWeight}%
              </span>
            )}
          </div>

          {isEditing ? (
            <div style={styles.weightsEditor}>
              {(editData.question_weights || []).map((qw, index) => (
                <div key={index} style={styles.weightRow}>
                  <span style={styles.weightCode}>{qw.question_code}</span>
                  <span style={styles.weightText}>{qw.question_text}</span>
                  <input
                    type="number"
                    value={qw.weight}
                    onChange={(e) => updateQuestionWeight(index, parseInt(e.target.value) || 0)}
                    style={styles.weightInput}
                    min="0"
                    max="100"
                  />
                  <span style={styles.percentSign}>%</span>
                  <button
                    style={styles.removeWeightBtn}
                    onClick={() => removeQuestionWeight(index)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}

              {/* Add Question Dropdown */}
              <QuestionSelector
                questions={availableQuestions}
                excludeIds={(editData.question_weights || []).map(qw => qw.question_id)}
                onSelect={addQuestionWeight}
              />
            </div>
          ) : (
            <div style={styles.weightsList}>
              {(metric.question_weights || []).length > 0 ? (
                (metric.question_weights || []).map((qw, index) => (
                  <ExpandableQuestionWeight
                    key={index}
                    questionWeight={qw}
                    fullQuestion={availableQuestions.find(q => q.id === qw.question_id)}
                  />
                ))
              ) : (
                <p style={styles.emptyWeights}>No questions configured for this metric</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Source Metrics (for derived metrics) */}
      {metric.category === 'derived' && (
        <div style={styles.detailSection}>
          <h3 style={styles.sectionTitle}>Source Metrics</h3>
          <div style={styles.weightsList}>
            {(metric.source_metrics || []).length > 0 ? (
              (metric.source_metrics || []).map((sm, index) => (
                <div key={index} style={styles.weightItem}>
                  <span style={styles.weightItemCode}>{sm.metric_code}</span>
                  <span style={styles.weightItemText}>{sm.metric_name}</span>
                  <span style={styles.weightItemValue}>{sm.weight}%</span>
                </div>
              ))
            ) : (
              <p style={styles.emptyWeights}>No source metrics configured</p>
            )}
          </div>
        </div>
      )}

      {/* Interpretation Guide */}
      <div style={styles.detailSection}>
        <h3 style={styles.sectionTitle}>Interpretation Guide</h3>
        {isEditing ? (
          <textarea
            value={editData.interpretation_guide || ''}
            onChange={(e) => setEditData({ ...editData, interpretation_guide: e.target.value })}
            style={styles.editTextarea}
            placeholder="How should this metric be interpreted..."
            rows={3}
          />
        ) : (
          <p style={styles.descriptionText}>
            {metric.interpretation_guide || 'No interpretation guide provided'}
          </p>
        )}
      </div>
    </div>
  );
}

// Question Selector Component
function QuestionSelector({
  questions,
  excludeIds,
  onSelect,
}: {
  questions: Question[];
  excludeIds: string[];
  onSelect: (question: Question) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredQuestions = questions.filter(q =>
    !excludeIds.includes(q.id) &&
    (q.aspect_code.toLowerCase().includes(search.toLowerCase()) ||
     q.text.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={styles.questionSelector}>
      <button
        style={styles.addQuestionBtn}
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add Question
      </button>

      {isOpen && (
        <div style={styles.selectorDropdown}>
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.selectorSearch}
            autoFocus
          />
          <div style={styles.selectorList}>
            {filteredQuestions.slice(0, 10).map((q) => (
              <div
                key={q.id}
                style={styles.selectorItem}
                onClick={() => {
                  onSelect(q);
                  setIsOpen(false);
                  setSearch('');
                }}
              >
                <span style={styles.selectorCode}>{q.aspect_code}</span>
                <span style={styles.selectorText}>{q.text.substring(0, 60)}...</span>
              </div>
            ))}
            {filteredQuestions.length === 0 && (
              <p style={styles.selectorEmpty}>No matching questions</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Create Metric Modal
function CreateMetricModal({
  availableQuestions: _availableQuestions,
  availableMetrics: _availableMetrics,
  onClose,
  onCreated,
  onError,
}: {
  availableQuestions: Question[];
  availableMetrics: Metric[];
  onClose: () => void;
  onCreated: () => void;
  onError: (message: string) => void;
}) {
  // Note: _availableQuestions and _availableMetrics can be used for advanced creation in the future
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    academic_term: '',
    description: '',
    category: 'core' as 'core' | 'derived',
    question_weights: [] as QuestionWeightConfig[],
    source_metrics: [] as DerivedMetricSource[],
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!formData.code || !formData.name) {
      onError('Code and name are required');
      return;
    }

    try {
      setSaving(true);
      await adminApi.createMetric({
        code: formData.code,
        name: formData.name,
        academic_term: formData.academic_term || undefined,
        description: formData.description || undefined,
        category: formData.category,
        question_weights: formData.question_weights,
        source_metrics: formData.source_metrics,
      });
      onCreated();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to create metric');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Create Metric</h2>
          <button style={styles.modalClose} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={styles.modalBody}>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Code *</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                style={styles.formInput}
                placeholder="e.g., M1, D1"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as 'core' | 'derived' })}
                style={styles.formSelect}
              >
                <option value="core">Core Metric</option>
                <option value="derived">Derived Score</option>
              </select>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={styles.formInput}
              placeholder="e.g., Operational Strength"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Academic Term</label>
            <input
              type="text"
              value={formData.academic_term}
              onChange={(e) => setFormData({ ...formData, academic_term: e.target.value })}
              style={styles.formInput}
              placeholder="e.g., Operational Excellence Index"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={styles.formTextarea}
              placeholder="What does this metric measure?"
              rows={3}
            />
          </div>
        </div>

        <div style={styles.modalFooter}>
          <button style={styles.cancelButton} onClick={onClose}>Cancel</button>
          <button
            style={styles.saveButton}
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? 'Creating...' : 'Create Metric'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '32px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#1D1D1F',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '15px',
    color: 'rgba(60, 60, 67, 0.6)',
    margin: '6px 0 0 0',
  },
  createButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    background: 'linear-gradient(135deg, #1D1D1F 0%, #3A3A3C 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '380px 1fr',
    gap: '24px',
    minHeight: '600px',
    alignItems: 'start',
  },
  listPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxHeight: 'calc(100vh - 180px)',
    overflowY: 'auto',
    paddingRight: '8px',
  },
  metricGroup: {
    background: 'white',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
    border: '1px solid rgba(0, 0, 0, 0.06)',
  },
  groupTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'rgba(60, 60, 67, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    margin: '0 0 16px 0',
  },
  metricsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  metricCard: {
    padding: '16px',
    borderRadius: '12px',
    background: 'rgba(0, 0, 0, 0.02)',
    border: '1px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  metricCardSelected: {
    background: 'rgba(99, 102, 241, 0.06)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
  },
  metricCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  metricCode: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#1D1D1F',
    background: 'rgba(0, 0, 0, 0.06)',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  categoryBadge: {
    fontSize: '10px',
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  metricName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1D1D1F',
    margin: '0 0 4px 0',
  },
  academicTerm: {
    fontSize: '12px',
    color: 'rgba(60, 60, 67, 0.6)',
    margin: '0 0 8px 0',
    fontStyle: 'italic',
  },
  metricStats: {
    display: 'flex',
    gap: '12px',
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    color: 'rgba(60, 60, 67, 0.6)',
  },
  emptyText: {
    fontSize: '13px',
    color: 'rgba(60, 60, 67, 0.4)',
    textAlign: 'center',
    padding: '20px',
  },
  detailPanel: {
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    overflow: 'auto',
    maxHeight: 'calc(100vh - 180px)',
    position: 'sticky',
    top: '32px',
  },
  emptyDetail: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '60px',
    gap: '16px',
  },
  emptyDetailText: {
    fontSize: '14px',
    color: 'rgba(60, 60, 67, 0.4)',
    margin: 0,
  },
  detailContent: {
    padding: '24px',
  },
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    paddingBottom: '20px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
  },
  detailCodeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px',
  },
  detailCode: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#6366F1',
    background: 'rgba(99, 102, 241, 0.1)',
    padding: '4px 12px',
    borderRadius: '8px',
  },
  statusBadge: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  detailTitle: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#1D1D1F',
    margin: '0 0 4px 0',
    letterSpacing: '-0.01em',
  },
  detailAcademicTerm: {
    fontSize: '14px',
    color: 'rgba(60, 60, 67, 0.6)',
    margin: 0,
    fontStyle: 'italic',
  },
  detailActions: {
    display: 'flex',
    gap: '8px',
  },
  editButton: {
    padding: '8px 16px',
    background: 'rgba(0, 0, 0, 0.04)',
    color: '#1D1D1F',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  deleteButton: {
    padding: '8px 16px',
    background: 'rgba(220, 38, 38, 0.06)',
    color: '#DC2626',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  saveButton: {
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #1D1D1F 0%, #3A3A3C 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '8px 16px',
    background: 'rgba(0, 0, 0, 0.04)',
    color: 'rgba(60, 60, 67, 0.8)',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  detailSection: {
    marginBottom: '24px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'rgba(60, 60, 67, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    margin: 0,
  },
  weightTotal: {
    fontSize: '13px',
    fontWeight: 600,
  },
  descriptionText: {
    fontSize: '14px',
    color: '#1D1D1F',
    lineHeight: 1.6,
    margin: 0,
  },
  editInput: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 600,
    color: '#1D1D1F',
    marginBottom: '4px',
  },
  editTextarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#1D1D1F',
    lineHeight: 1.6,
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  weightsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  expandableWeightContainer: {
    borderRadius: '10px',
    overflow: 'hidden',
    border: '1px solid rgba(0, 0, 0, 0.04)',
  },
  weightItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: 'rgba(0, 0, 0, 0.02)',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
  },
  expandIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(60, 60, 67, 0.4)',
    transition: 'transform 0.2s ease',
    marginLeft: '8px',
  },
  expandedContent: {
    padding: '16px',
    background: 'rgba(99, 102, 241, 0.03)',
    borderTop: '1px solid rgba(0, 0, 0, 0.04)',
  },
  fullQuestionLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: 'rgba(60, 60, 67, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    marginBottom: '6px',
  },
  fullQuestionText: {
    fontSize: '14px',
    color: '#1D1D1F',
    lineHeight: 1.6,
    margin: '0 0 12px 0',
  },
  fullQuestionDescription: {
    fontSize: '13px',
    color: 'rgba(60, 60, 67, 0.8)',
    lineHeight: 1.5,
    margin: 0,
    fontStyle: 'italic',
  },
  weightItemCode: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#6366F1',
    background: 'rgba(99, 102, 241, 0.1)',
    padding: '4px 10px',
    borderRadius: '6px',
    minWidth: '50px',
    textAlign: 'center',
  },
  weightItemText: {
    flex: 1,
    fontSize: '13px',
    color: '#1D1D1F',
  },
  weightItemValue: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1D1D1F',
    background: 'rgba(0, 0, 0, 0.04)',
    padding: '4px 10px',
    borderRadius: '6px',
  },
  emptyWeights: {
    fontSize: '13px',
    color: 'rgba(60, 60, 67, 0.4)',
    textAlign: 'center',
    padding: '20px',
    margin: 0,
  },
  weightsEditor: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  weightRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    background: 'rgba(0, 0, 0, 0.02)',
    borderRadius: '10px',
  },
  weightCode: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#6366F1',
    background: 'rgba(99, 102, 241, 0.1)',
    padding: '4px 10px',
    borderRadius: '6px',
    minWidth: '50px',
    textAlign: 'center',
  },
  weightText: {
    flex: 1,
    fontSize: '12px',
    color: 'rgba(60, 60, 67, 0.8)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  weightInput: {
    width: '60px',
    padding: '6px 8px',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    textAlign: 'right',
  },
  percentSign: {
    fontSize: '13px',
    color: 'rgba(60, 60, 67, 0.6)',
  },
  removeWeightBtn: {
    padding: '4px',
    background: 'rgba(220, 38, 38, 0.06)',
    color: '#DC2626',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionSelector: {
    position: 'relative',
  },
  addQuestionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    background: 'rgba(99, 102, 241, 0.06)',
    color: '#6366F1',
    border: '1px dashed rgba(99, 102, 241, 0.3)',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    width: '100%',
    justifyContent: 'center',
  },
  selectorDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '4px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    zIndex: 100,
    overflow: 'hidden',
  },
  selectorSearch: {
    width: '100%',
    padding: '12px 16px',
    border: 'none',
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
    fontSize: '14px',
    outline: 'none',
  },
  selectorList: {
    maxHeight: '240px',
    overflowY: 'auto',
  },
  selectorItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px',
    cursor: 'pointer',
    transition: 'background 0.1s ease',
  },
  selectorCode: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#6366F1',
    background: 'rgba(99, 102, 241, 0.1)',
    padding: '3px 8px',
    borderRadius: '4px',
  },
  selectorText: {
    fontSize: '13px',
    color: '#1D1D1F',
    flex: 1,
  },
  selectorEmpty: {
    padding: '20px',
    textAlign: 'center',
    fontSize: '13px',
    color: 'rgba(60, 60, 67, 0.4)',
    margin: 0,
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px',
    gap: '16px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid rgba(0, 0, 0, 0.08)',
    borderTopColor: '#1D1D1F',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: '14px',
    color: 'rgba(60, 60, 67, 0.6)',
    margin: 0,
  },
  modalOverlay: {
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
  },
  modal: {
    background: 'white',
    borderRadius: '16px',
    width: '500px',
    maxWidth: '90vw',
    maxHeight: '80vh',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1D1D1F',
    margin: 0,
  },
  modalClose: {
    padding: '8px',
    background: 'rgba(0, 0, 0, 0.04)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(60, 60, 67, 0.6)',
  },
  modalBody: {
    padding: '24px',
    overflowY: 'auto',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    padding: '16px 24px',
    borderTop: '1px solid rgba(0, 0, 0, 0.06)',
    background: 'rgba(0, 0, 0, 0.02)',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '16px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  formLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: 'rgba(60, 60, 67, 0.8)',
    marginBottom: '6px',
  },
  formInput: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#1D1D1F',
    transition: 'border-color 0.15s ease',
  },
  formSelect: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#1D1D1F',
    background: 'white',
    cursor: 'pointer',
  },
  formTextarea: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#1D1D1F',
    lineHeight: 1.6,
    resize: 'vertical',
    fontFamily: 'inherit',
  },
};

export default MetricsSection;
