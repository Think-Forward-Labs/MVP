/**
 * Question Set Detail View
 * Premium UI for viewing and editing question set with all questions
 * Apple HIG inspired design with horizontal question navigator
 */

import { useState, useEffect, useRef } from 'react';
import { adminApi } from '../../../services/adminApi';
import type { QuestionSetDetail, Question, MetricWeight, ScoreAnchor, ChecklistItem, ExampleAnswer, Interdependency, Dimension, DimensionAnchor, CriticalFlag } from '../../../types/admin';

interface QuestionSetDetailViewProps {
  questionSetId: string;
  onBack: () => void;
}

type TabType = 'overview' | 'scoring' | 'dimensions' | 'training' | 'checklist';

export function QuestionSetDetailView({ questionSetId, onBack }: QuestionSetDetailViewProps) {
  const [questionSet, setQuestionSet] = useState<QuestionSetDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState<Partial<Question> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const numberStripRef = useRef<HTMLDivElement>(null);

  // Modal states for add/delete
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadQuestionSet();
  }, [questionSetId]);

  useEffect(() => {
    if (numberStripRef.current) {
      const container = numberStripRef.current;
      const activeButton = container.querySelector(`[data-index="${currentQuestionIndex}"]`) as HTMLElement;
      if (activeButton) {
        const containerRect = container.getBoundingClientRect();
        const buttonRect = activeButton.getBoundingClientRect();
        const scrollLeft = activeButton.offsetLeft - containerRect.width / 2 + buttonRect.width / 2;
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [currentQuestionIndex]);

  // When changing questions, exit edit mode
  useEffect(() => {
    if (isEditing) {
      setIsEditing(false);
      setEditedQuestion(null);
    }
  }, [currentQuestionIndex]);

  const loadQuestionSet = async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.getQuestionSet(questionSetId);
      data.questions.sort((a, b) => (a.order || a.question_number) - (b.order || b.question_number));
      setQuestionSet(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load question set');
    } finally {
      setIsLoading(false);
    }
  };

  const currentQuestion = questionSet?.questions[currentQuestionIndex];

  const startEditing = () => {
    if (currentQuestion) {
      setEditedQuestion({ ...currentQuestion });
      setIsEditing(true);
      setSaveError(null);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedQuestion(null);
    setSaveError(null);
  };

  const saveQuestion = async () => {
    if (!editedQuestion || !currentQuestion) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      await adminApi.updateQuestion(currentQuestion.id, editedQuestion);
      // Update local state
      if (questionSet) {
        const updatedQuestions = [...questionSet.questions];
        updatedQuestions[currentQuestionIndex] = { ...currentQuestion, ...editedQuestion } as Question;
        setQuestionSet({ ...questionSet, questions: updatedQuestions });
      }
      setIsEditing(false);
      setEditedQuestion(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = <K extends keyof Question>(field: K, value: Question[K]) => {
    if (editedQuestion) {
      setEditedQuestion({ ...editedQuestion, [field]: value });
    }
  };

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToNext = () => {
    if (questionSet && currentQuestionIndex < questionSet.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleAddSuccess = () => {
    setShowAddModal(false);
    loadQuestionSet();
  };

  const handleDeleteSuccess = () => {
    setShowDeleteModal(false);
    // If we deleted the last question, go to the previous one
    if (questionSet && currentQuestionIndex >= questionSet.questions.length - 1) {
      setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1));
    }
    loadQuestionSet();
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      open: 'Open Text',
      scale: 'Scale',
      percentage: 'Percentage',
      single_select: 'Single Select',
      multi_select: 'Multi Select',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      open: { bg: 'rgba(99, 102, 241, 0.1)', text: '#4F46E5' },
      scale: { bg: 'rgba(34, 197, 94, 0.1)', text: '#16A34A' },
      percentage: { bg: 'rgba(245, 158, 11, 0.1)', text: '#D97706' },
      single_select: { bg: 'rgba(139, 92, 246, 0.1)', text: '#7C3AED' },
      multi_select: { bg: 'rgba(236, 72, 153, 0.1)', text: '#DB2777' },
    };
    return colors[type] || { bg: 'rgba(107, 114, 128, 0.1)', text: '#6B7280' };
  };

  const getAspectColor = (aspect: string) => {
    const colors = [
      { bg: 'rgba(59, 130, 246, 0.1)', text: '#2563EB' },
      { bg: 'rgba(16, 185, 129, 0.1)', text: '#059669' },
      { bg: 'rgba(245, 158, 11, 0.1)', text: '#D97706' },
      { bg: 'rgba(139, 92, 246, 0.1)', text: '#7C3AED' },
      { bg: 'rgba(236, 72, 153, 0.1)', text: '#DB2777' },
      { bg: 'rgba(99, 102, 241, 0.1)', text: '#4F46E5' },
    ];
    const index = aspect.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  // Get the display question (edited or original)
  const displayQuestion = isEditing && editedQuestion ? { ...currentQuestion, ...editedQuestion } as Question : currentQuestion;

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Loading question set...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !questionSet) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <div style={styles.errorIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p style={styles.errorText}>{error || 'Question set not found'}</p>
          <button onClick={onBack} style={styles.backButtonError}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Question Sets
        </button>
        <div style={styles.headerRow}>
          <div style={styles.headerInfo}>
            <h1 style={styles.title}>{questionSet.name}</h1>
            <div style={styles.headerMeta}>
              <span style={styles.versionBadge}>v{questionSet.version}</span>
              <span style={styles.metaText}>{questionSet.total_questions} questions</span>
              <span style={styles.metaDot}>·</span>
              <span style={styles.metaText}>{questionSet.estimated_duration_minutes} min</span>
            </div>
          </div>
          <button onClick={() => setShowAddModal(true)} style={styles.addQuestionButton}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Question
          </button>
        </div>
      </div>

      {/* Question Navigator */}
      <div style={styles.navigatorCard}>
        <button
          onClick={goToPrevious}
          disabled={currentQuestionIndex === 0}
          style={{
            ...styles.navArrow,
            opacity: currentQuestionIndex === 0 ? 0.3 : 1,
            cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div style={styles.numberStrip} ref={numberStripRef}>
          {questionSet.questions.map((q, index) => (
            <button
              key={q.id}
              data-index={index}
              onClick={() => setCurrentQuestionIndex(index)}
              style={{
                ...styles.numberButton,
                ...(index === currentQuestionIndex ? styles.numberButtonActive : {}),
              }}
            >
              {q.question_number || q.order || index + 1}
            </button>
          ))}
        </div>

        <button
          onClick={goToNext}
          disabled={currentQuestionIndex === questionSet.questions.length - 1}
          style={{
            ...styles.navArrow,
            opacity: currentQuestionIndex === questionSet.questions.length - 1 ? 0.3 : 1,
            cursor: currentQuestionIndex === questionSet.questions.length - 1 ? 'not-allowed' : 'pointer',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        <div style={styles.navInfo}>
          Question {currentQuestionIndex + 1} of {questionSet.questions.length}
        </div>
      </div>

      {/* Question Card */}
      {displayQuestion && (
        <div style={styles.questionCard}>
          {/* Question Header with Edit Button */}
          <div style={styles.questionHeader}>
            <div style={styles.questionBadges}>
              {displayQuestion.aspect && (
                <span style={{
                  ...styles.aspectBadge,
                  background: getAspectColor(displayQuestion.aspect).bg,
                  color: getAspectColor(displayQuestion.aspect).text,
                }}>
                  {displayQuestion.aspect_code && `${displayQuestion.aspect_code} · `}{displayQuestion.aspect}
                </span>
              )}
              <span style={{
                ...styles.typeBadge,
                background: getTypeColor(displayQuestion.type).bg,
                color: getTypeColor(displayQuestion.type).text,
              }}>
                {getTypeLabel(displayQuestion.type)}
              </span>
              {displayQuestion.status && (
                <span style={{
                  ...styles.statusBadge,
                  background: displayQuestion.status === 'active' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                  color: displayQuestion.status === 'active' ? '#16A34A' : '#6B7280',
                }}>
                  {displayQuestion.status}
                </span>
              )}
            </div>
            <div style={styles.editActions}>
              {isEditing ? (
                <>
                  <button onClick={cancelEditing} style={styles.cancelButton} disabled={isSaving}>
                    Cancel
                  </button>
                  <button onClick={saveQuestion} style={styles.saveButton} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={startEditing} style={styles.editButton}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Edit
                  </button>
                  <button onClick={() => setShowDeleteModal(true)} style={styles.deleteButton}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {saveError && (
            <div style={styles.saveErrorBanner}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {saveError}
            </div>
          )}

          {/* Question Text */}
          {isEditing ? (
            <div style={styles.editFieldContainer}>
              <label style={styles.editLabel}>Question Text</label>
              <textarea
                value={editedQuestion?.text || ''}
                onChange={(e) => updateField('text', e.target.value)}
                style={styles.editTextarea}
                rows={3}
              />
            </div>
          ) : (
            <div style={styles.questionText}>
              "{displayQuestion.text}"
            </div>
          )}

          {isEditing ? (
            <div style={styles.editFieldContainer}>
              <label style={styles.editLabel}>Description (optional)</label>
              <textarea
                value={editedQuestion?.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                style={styles.editTextarea}
                rows={2}
                placeholder="Helper text or context for this question..."
              />
            </div>
          ) : displayQuestion.description && (
            <p style={styles.questionDescription}>{displayQuestion.description}</p>
          )}

          {/* Scale Preview / Editor */}
          {displayQuestion.type === 'scale' && (
            isEditing ? (
              <ScaleEditor
                scale={editedQuestion?.scale || displayQuestion.scale}
                onChange={(scale) => updateField('scale', scale)}
              />
            ) : displayQuestion.scale && (
              <div style={styles.scalePreview}>
                <div style={styles.scaleLabels}>
                  <span>{displayQuestion.scale.min} - {displayQuestion.scale.min_label}</span>
                  <span>{displayQuestion.scale.max} - {displayQuestion.scale.max_label}</span>
                </div>
                <div style={styles.scaleBar}>
                  {Array.from({ length: displayQuestion.scale.max - displayQuestion.scale.min + 1 }, (_, i) => (
                    <div key={i} style={styles.scalePoint}>
                      {displayQuestion.scale!.min + i}
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          {/* Options Preview / Editor */}
          {(displayQuestion.type === 'single_select' || displayQuestion.type === 'multi_select') && (
            isEditing ? (
              <OptionsEditor
                options={editedQuestion?.options || displayQuestion.options || []}
                onChange={(options) => updateField('options', options)}
              />
            ) : displayQuestion.options && displayQuestion.options.length > 0 && (
              <div style={styles.optionsPreview}>
                <span style={styles.optionsLabel}>Options:</span>
                <div style={styles.optionsList}>
                  {displayQuestion.options.map((opt, i) => (
                    <span key={i} style={styles.optionChip}>{opt}</span>
                  ))}
                </div>
              </div>
            )
          )}

          {/* Tabs */}
          <div style={styles.tabsContainer}>
            <div style={styles.tabs}>
              {(['overview', 'scoring', 'dimensions', 'training', 'checklist'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    ...styles.tab,
                    ...(activeTab === tab ? styles.tabActive : {}),
                  }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div style={styles.tabContent}>
            {activeTab === 'overview' && (
              <OverviewTab
                question={displayQuestion}
                isEditing={isEditing}
                editedQuestion={editedQuestion}
                updateField={updateField}
              />
            )}
            {activeTab === 'scoring' && (
              <ScoringTab
                question={displayQuestion}
                isEditing={isEditing}
                editedQuestion={editedQuestion}
                updateField={updateField}
              />
            )}
            {activeTab === 'dimensions' && (
              <DimensionsTab
                question={displayQuestion}
                isEditing={isEditing}
                editedQuestion={editedQuestion}
                updateField={updateField}
              />
            )}
            {activeTab === 'training' && (
              <TrainingTab
                question={displayQuestion}
                isEditing={isEditing}
                editedQuestion={editedQuestion}
                updateField={updateField}
              />
            )}
            {activeTab === 'checklist' && (
              <ChecklistTab
                question={displayQuestion}
                isEditing={isEditing}
                editedQuestion={editedQuestion}
                updateField={updateField}
              />
            )}
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {showAddModal && questionSet && (
        <AddQuestionModal
          questionSetId={questionSet.id}
          nextQuestionNumber={questionSet.questions.length + 1}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      {/* Delete Question Modal */}
      {showDeleteModal && currentQuestion && (
        <DeleteQuestionModal
          question={currentQuestion}
          onClose={() => setShowDeleteModal(false)}
          onSuccess={handleDeleteSuccess}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideIn {
          from { opacity: 0; transform: translateY(-20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

// Add Question Modal
function AddQuestionModal({
  questionSetId,
  nextQuestionNumber,
  onClose,
  onSuccess,
}: {
  questionSetId: string;
  nextQuestionNumber: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [questionNumber, setQuestionNumber] = useState(nextQuestionNumber);
  const [text, setText] = useState('');
  const [type, setType] = useState<string>('open');
  const [aspect, setAspect] = useState('');
  const [aspectCode, setAspectCode] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Question text is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await adminApi.addQuestion(questionSetId, {
        question_number: questionNumber,
        text: text.trim(),
        type,
        aspect: aspect.trim() || undefined,
        aspect_code: aspectCode.trim() || undefined,
        description: description.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add question');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <h2 style={modalStyles.title}>Add Question</h2>
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

            <div style={modalStyles.row}>
              <div style={{ ...modalStyles.field, flex: '0 0 100px' }}>
                <label style={modalStyles.label}>Number</label>
                <input
                  type="number"
                  value={questionNumber}
                  onChange={(e) => setQuestionNumber(parseInt(e.target.value) || 1)}
                  style={modalStyles.input}
                  min={1}
                />
              </div>
              <div style={{ ...modalStyles.field, flex: 1 }}>
                <label style={modalStyles.label}>Type *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  style={modalStyles.select}
                >
                  <option value="open">Open Text</option>
                  <option value="scale">Scale</option>
                  <option value="percentage">Percentage</option>
                  <option value="single_select">Single Select</option>
                  <option value="multi_select">Multi Select</option>
                </select>
              </div>
            </div>

            <div style={modalStyles.field}>
              <label style={modalStyles.label}>Question Text *</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter the question text..."
                style={modalStyles.textarea}
                rows={3}
                autoFocus
              />
            </div>

            <div style={modalStyles.row}>
              <div style={{ ...modalStyles.field, flex: 1 }}>
                <label style={modalStyles.label}>Aspect</label>
                <input
                  type="text"
                  value={aspect}
                  onChange={(e) => setAspect(e.target.value)}
                  placeholder="e.g., Background"
                  style={modalStyles.input}
                />
              </div>
              <div style={{ ...modalStyles.field, flex: '0 0 100px' }}>
                <label style={modalStyles.label}>Aspect Code</label>
                <input
                  type="text"
                  value={aspectCode}
                  onChange={(e) => setAspectCode(e.target.value)}
                  placeholder="e.g., B1"
                  style={modalStyles.input}
                />
              </div>
            </div>

            <div style={modalStyles.field}>
              <label style={modalStyles.label}>Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Helper text or context..."
                style={modalStyles.textarea}
                rows={2}
              />
            </div>
          </div>

          <div style={modalStyles.footer}>
            <button type="button" onClick={onClose} style={modalStyles.cancelButton} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" style={modalStyles.submitButton} disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete Question Modal
function DeleteQuestionModal({
  question,
  onClose,
  onSuccess,
}: {
  question: Question;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await adminApi.deleteQuestion(question.id);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete question');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={{ ...modalStyles.modal, ...modalStyles.dangerModal }} onClick={(e) => e.stopPropagation()}>
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
          <h2 style={modalStyles.dangerTitle}>Delete Question</h2>
          <p style={modalStyles.dangerText}>
            Are you sure you want to delete question <strong>#{question.question_number || question.order}</strong>?
          </p>
          <div style={modalStyles.questionPreview}>
            "{question.text.length > 100 ? question.text.substring(0, 100) + '...' : question.text}"
          </div>

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
        </div>

        <div style={modalStyles.footer}>
          <button onClick={onClose} style={modalStyles.cancelButton} disabled={isDeleting}>
            Cancel
          </button>
          <button onClick={handleDelete} style={modalStyles.dangerButton} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete Question'}
          </button>
        </div>
      </div>
    </div>
  );
}

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
    maxWidth: '520px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    animation: 'modalSlideIn 0.2s ease-out',
  },
  dangerModal: {
    borderTop: '4px solid #DC2626',
    maxWidth: '440px',
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
  row: {
    display: 'flex',
    gap: '12px',
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
  select: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    background: 'white',
    fontSize: '14px',
    color: '#1D1D1F',
    outline: 'none',
    boxSizing: 'border-box',
    cursor: 'pointer',
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
    margin: '0 0 16px 0',
  },
  questionPreview: {
    padding: '14px 16px',
    borderRadius: '10px',
    background: 'rgba(0, 0, 0, 0.03)',
    fontSize: '14px',
    color: 'rgba(60, 60, 67, 0.8)',
    fontStyle: 'italic',
    lineHeight: 1.5,
    marginBottom: '16px',
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

// Scale Editor Component
function ScaleEditor({ scale, onChange }: { scale?: { min: number; max: number; min_label: string; max_label: string }; onChange: (scale: { min: number; max: number; min_label: string; max_label: string }) => void }) {
  const currentScale = scale || { min: 1, max: 5, min_label: '', max_label: '' };

  return (
    <div style={styles.editFieldContainer}>
      <label style={styles.editLabel}>Scale Configuration</label>
      <div style={styles.scaleEditorGrid}>
        <div style={styles.scaleEditorField}>
          <label style={styles.smallLabel}>Min Value</label>
          <input
            type="number"
            value={currentScale.min}
            onChange={(e) => onChange({ ...currentScale, min: parseInt(e.target.value) || 1 })}
            style={styles.editInputSmall}
          />
        </div>
        <div style={styles.scaleEditorField}>
          <label style={styles.smallLabel}>Min Label</label>
          <input
            type="text"
            value={currentScale.min_label}
            onChange={(e) => onChange({ ...currentScale, min_label: e.target.value })}
            style={styles.editInput}
            placeholder="e.g., Very Poor"
          />
        </div>
        <div style={styles.scaleEditorField}>
          <label style={styles.smallLabel}>Max Value</label>
          <input
            type="number"
            value={currentScale.max}
            onChange={(e) => onChange({ ...currentScale, max: parseInt(e.target.value) || 5 })}
            style={styles.editInputSmall}
          />
        </div>
        <div style={styles.scaleEditorField}>
          <label style={styles.smallLabel}>Max Label</label>
          <input
            type="text"
            value={currentScale.max_label}
            onChange={(e) => onChange({ ...currentScale, max_label: e.target.value })}
            style={styles.editInput}
            placeholder="e.g., Excellent"
          />
        </div>
      </div>
    </div>
  );
}

// Options Editor Component
function OptionsEditor({ options, onChange }: { options: string[]; onChange: (options: string[]) => void }) {
  const addOption = () => onChange([...options, '']);
  const removeOption = (index: number) => onChange(options.filter((_, i) => i !== index));
  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    onChange(newOptions);
  };

  return (
    <div style={styles.editFieldContainer}>
      <label style={styles.editLabel}>Options</label>
      <div style={styles.optionsEditorList}>
        {options.map((opt, i) => (
          <div key={i} style={styles.optionEditorRow}>
            <input
              type="text"
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
              style={styles.editInput}
              placeholder={`Option ${i + 1}`}
            />
            <button onClick={() => removeOption(i)} style={styles.removeButton}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        <button onClick={addOption} style={styles.addButton}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Option
        </button>
      </div>
    </div>
  );
}

// Tab Components with Edit Support
interface TabProps {
  question: Question;
  isEditing: boolean;
  editedQuestion: Partial<Question> | null;
  updateField: <K extends keyof Question>(field: K, value: Question[K]) => void;
}

function OverviewTab({ question, isEditing, editedQuestion, updateField }: TabProps) {
  return (
    <div style={styles.tabPanel}>
      {/* Purpose */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Purpose</h4>
        {isEditing ? (
          <textarea
            value={editedQuestion?.purpose || ''}
            onChange={(e) => updateField('purpose', e.target.value)}
            style={styles.editTextarea}
            rows={3}
            placeholder="Why does this question exist? What does it assess?"
          />
        ) : question.purpose ? (
          <p style={styles.sectionText}>{question.purpose}</p>
        ) : (
          <p style={styles.emptyText}>No purpose defined</p>
        )}
      </div>

      {/* Metrics Weights */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Metrics Contribution</h4>
        {isEditing ? (
          <MetricsEditor
            metrics={editedQuestion?.metrics_weights || question.metrics_weights || []}
            onChange={(metrics) => updateField('metrics_weights', metrics)}
          />
        ) : question.metrics_weights && question.metrics_weights.length > 0 ? (
          <div style={styles.metricsGrid}>
            {question.metrics_weights.map((metric, i) => (
              <div key={i} style={styles.metricCard}>
                <div style={styles.metricHeader}>
                  <span style={styles.metricCode}>{metric.metric_code}</span>
                  <span style={styles.metricWeight}>{metric.weight}%</span>
                </div>
                <span style={styles.metricName}>{metric.metric_name}</span>
                <div style={styles.metricBar}>
                  <div style={{ ...styles.metricBarFill, width: `${metric.weight}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={styles.emptyText}>No metrics defined</p>
        )}
      </div>

      {/* Interdependencies */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Interdependencies</h4>
        <p style={styles.sectionSubtitle}>Links to other questions that affect scoring</p>
        {isEditing ? (
          <InterdependenciesEditor
            interdependencies={editedQuestion?.interdependencies || question.interdependencies || []}
            onChange={(deps) => updateField('interdependencies', deps)}
            currentQuestionId={question.id}
          />
        ) : question.interdependencies && question.interdependencies.length > 0 ? (
          <div style={styles.interdependenciesGrid}>
            {question.interdependencies.map((dep, i) => (
              <div key={i} style={styles.interdependencyCard}>
                <div style={styles.interdependencyHeader}>
                  <span style={styles.interdependencyCode}>{dep.linked_question_code}</span>
                  <span style={styles.interdependencyLink}>Linked Question</span>
                </div>
                <div style={styles.interdependencyContent}>
                  <div style={styles.interdependencyField}>
                    <span style={styles.interdependencyLabel}>Relationship:</span>
                    <p style={styles.interdependencyText}>{dep.description}</p>
                  </div>
                  <div style={styles.interdependencyField}>
                    <span style={styles.interdependencyLabel}>Scoring Impact:</span>
                    <p style={styles.interdependencyImpact}>{dep.scoring_impact}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={styles.emptyText}>No interdependencies defined</p>
        )}
      </div>

      {/* Detection Keywords */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Detection Keywords</h4>
        {isEditing ? (
          <KeywordsEditor
            keywords={editedQuestion?.detection_keywords || question.detection_keywords || []}
            onChange={(keywords) => updateField('detection_keywords', keywords)}
          />
        ) : question.detection_keywords && question.detection_keywords.length > 0 ? (
          <div style={styles.keywordsList}>
            {question.detection_keywords.map((keyword, i) => (
              <span key={i} style={styles.keyword}>{keyword}</span>
            ))}
          </div>
        ) : (
          <p style={styles.emptyText}>No keywords defined</p>
        )}
      </div>
    </div>
  );
}

function ScoringTab({ question, isEditing, editedQuestion, updateField }: TabProps) {
  return (
    <div style={styles.tabPanel}>
      {/* Scoring Instruction */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Scoring Instructions</h4>
        {isEditing ? (
          <textarea
            value={editedQuestion?.scoring_instruction || ''}
            onChange={(e) => updateField('scoring_instruction', e.target.value)}
            style={styles.editTextarea}
            rows={4}
            placeholder="Instructions for AI scoring..."
          />
        ) : question.scoring_instruction ? (
          <div style={styles.instructionBox}>
            <p style={styles.instructionText}>{question.scoring_instruction}</p>
          </div>
        ) : (
          <p style={styles.emptyText}>No scoring instructions defined</p>
        )}
      </div>

      {/* Score Anchors */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Score Anchors</h4>
        {isEditing ? (
          <ScoreAnchorsEditor
            anchors={editedQuestion?.score_anchors || question.score_anchors || []}
            onChange={(anchors) => updateField('score_anchors', anchors)}
          />
        ) : question.score_anchors && question.score_anchors.length > 0 ? (
          <div style={styles.anchorsGrid}>
            {question.score_anchors.map((anchor, i) => (
              <div key={i} style={styles.anchorCard}>
                <span style={styles.anchorRange}>{anchor.range}</span>
                <p style={styles.anchorDescription}>{anchor.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p style={styles.emptyText}>No score anchors defined</p>
        )}
      </div>

      {/* Scoring Note */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Scoring Note</h4>
        {isEditing ? (
          <textarea
            value={editedQuestion?.scoring_note || ''}
            onChange={(e) => updateField('scoring_note', e.target.value)}
            style={styles.editTextarea}
            rows={2}
            placeholder="Additional scoring guidance..."
          />
        ) : question.scoring_note ? (
          <div style={styles.noteBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <p style={styles.noteText}>{question.scoring_note}</p>
          </div>
        ) : (
          <p style={styles.emptyText}>No scoring note defined</p>
        )}
      </div>
    </div>
  );
}

function TrainingTab({ question, isEditing, editedQuestion, updateField }: TabProps) {
  return (
    <div style={styles.tabPanel}>
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Example Answers</h4>
        {isEditing ? (
          <ExampleAnswersEditor
            examples={editedQuestion?.example_answers || question.example_answers || []}
            onChange={(examples) => updateField('example_answers', examples)}
          />
        ) : question.example_answers && question.example_answers.length > 0 ? (
          <ExampleAnswersView examples={question.example_answers} />
        ) : (
          <p style={styles.emptyText}>No example answers defined</p>
        )}
      </div>
    </div>
  );
}

function ChecklistTab({ question, isEditing, editedQuestion, updateField }: TabProps) {
  return (
    <div style={styles.tabPanel}>
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Extraction Checklist</h4>
        <p style={styles.sectionSubtitle}>Key information to extract from responses</p>
        {isEditing ? (
          <ChecklistEditor
            checklist={editedQuestion?.checklist || question.checklist || []}
            onChange={(checklist) => updateField('checklist', checklist)}
          />
        ) : question.checklist && question.checklist.length > 0 ? (
          <div style={styles.checklistGrid}>
            {question.checklist.map((item, i) => (
              <div key={i} style={styles.checklistCard}>
                <div style={styles.checklistHeader}>
                  <span style={styles.checklistId}>{item.id}</span>
                  <span style={styles.checklistKey}>{item.key}</span>
                </div>
                <p style={styles.checklistDescription}>{item.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p style={styles.emptyText}>No checklist items defined</p>
        )}
      </div>
    </div>
  );
}

function DimensionsTab({ question, isEditing, editedQuestion, updateField }: TabProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [rubricDimensions, setRubricDimensions] = useState<Dimension[]>([]);
  const [rubricFlags, setRubricFlags] = useState<CriticalFlag[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load rubric data from API
  useEffect(() => {
    const loadRubric = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const rubric = await adminApi.getQuestionRubric(question.id);
        setRubricDimensions(rubric.dimensions || []);
        setRubricFlags(rubric.critical_flags || []);
      } catch (err) {
        console.error('Failed to load rubric:', err);
        setLoadError('Failed to load scoring rubric');
      } finally {
        setIsLoading(false);
      }
    };
    loadRubric();
  }, [question.id]);

  // Use edited values when editing, otherwise use loaded rubric data
  const dimensions = isEditing
    ? (editedQuestion?.dimensions || rubricDimensions)
    : rubricDimensions;

  const criticalFlags = isEditing
    ? (editedQuestion?.critical_flags || rubricFlags)
    : rubricFlags;

  const totalWeight = dimensions.reduce((sum, d) => sum + d.weight, 0);

  // Loading state
  if (isLoading) {
    return (
      <div style={styles.tabPanel}>
        <div style={styles.rubricLoaderContainer}>
          <div style={styles.rubricLoaderSpinner} />
          <p style={styles.rubricLoaderText}>Loading scoring rubric...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div style={styles.tabPanel}>
        <div style={styles.rubricErrorContainer}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <p style={styles.rubricErrorText}>{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.tabPanel}>
      {/* Dimensions Section */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h4 style={styles.sectionTitle}>Scoring Dimensions</h4>
            <p style={styles.sectionSubtitle}>Multi-dimensional BARS scoring rubric for AI evaluation</p>
          </div>
          {isEditing && (
            <span style={{
              ...styles.weightTotal,
              color: totalWeight === 100 ? '#16A34A' : totalWeight > 100 ? '#DC2626' : '#CA8A04',
            }}>
              Total Weight: {totalWeight}%
            </span>
          )}
        </div>

        {isEditing ? (
          <DimensionsEditor
            dimensions={dimensions}
            onChange={(dims) => updateField('dimensions', dims)}
          />
        ) : dimensions.length > 0 ? (
          <DimensionsView dimensions={dimensions} />
        ) : (
          <div style={styles.emptyDimensionsContainer}>
            <div style={styles.emptyDimensionsIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 20V10M12 20V4M6 20v-6" />
              </svg>
            </div>
            <p style={styles.emptyText}>No dimensions defined</p>
            <p style={styles.emptySubtext}>
              Dimensions enable multi-faceted AI scoring using BARS methodology.
              Each dimension has 5 behavioral anchor levels.
            </p>
          </div>
        )}
      </div>

      {/* Critical Flags Section */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Critical Flags</h4>
        <p style={styles.sectionSubtitle}>Auto-detect concerning patterns that may cap scores or trigger review</p>

        {isEditing ? (
          <CriticalFlagsEditor
            flags={criticalFlags}
            onChange={(flags) => updateField('critical_flags', flags)}
          />
        ) : criticalFlags.length > 0 ? (
          <div style={styles.flagsGrid}>
            {criticalFlags.map((flag, i) => (
              <div key={i} style={styles.flagCard}>
                <div style={styles.flagHeader}>
                  <span style={styles.flagId}>{flag.id}</span>
                  {flag.max_score !== undefined && (
                    <span style={styles.flagMaxScore}>Max: {flag.max_score}</span>
                  )}
                </div>
                <p style={styles.flagCondition}>{flag.condition}</p>
                <p style={styles.flagAction}>{flag.action}</p>
                {flag.signals.length > 0 && (
                  <div style={styles.flagSignals}>
                    {flag.signals.map((signal, j) => (
                      <span key={j} style={styles.flagSignal}>{signal}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={styles.emptyText}>No critical flags defined</p>
        )}
      </div>
    </div>
  );
}

// Dimensions View Component (Read-only) - Premium UI
function DimensionsView({ dimensions }: { dimensions: Dimension[] }) {
  const [expandedDimension, setExpandedDimension] = useState<string | null>(null);

  const getLevelInfo = (level: number) => {
    const info: Record<number, { label: string; color: string; bg: string; gradient: string }> = {
      5: { label: 'Excellent', color: '#16A34A', bg: 'rgba(34, 197, 94, 0.06)', gradient: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)' },
      4: { label: 'Good', color: '#2563EB', bg: 'rgba(59, 130, 246, 0.06)', gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' },
      3: { label: 'Moderate', color: '#D97706', bg: 'rgba(245, 158, 11, 0.06)', gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' },
      2: { label: 'Poor', color: '#EA580C', bg: 'rgba(249, 115, 22, 0.06)', gradient: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' },
      1: { label: 'Very Poor', color: '#DC2626', bg: 'rgba(239, 68, 68, 0.06)', gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' },
    };
    return info[level] || { label: `Level ${level}`, color: '#6B7280', bg: 'rgba(107, 114, 128, 0.06)', gradient: 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)' };
  };

  const totalWeight = dimensions.reduce((sum, d) => sum + d.weight, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Weight Summary Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'rgba(16, 185, 129, 0.04)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
        <span style={{ fontSize: '13px', color: 'rgba(60, 60, 67, 0.6)' }}>Total Weight:</span>
        <div style={{ flex: 1, height: '8px', background: 'rgba(0, 0, 0, 0.06)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(totalWeight, 100)}%`, height: '100%', background: totalWeight === 100 ? 'linear-gradient(90deg, #22C55E, #16A34A)' : 'linear-gradient(90deg, #F59E0B, #D97706)', borderRadius: '4px', transition: 'width 0.3s ease' }} />
        </div>
        <span style={{ fontSize: '14px', fontWeight: 600, color: totalWeight === 100 ? '#16A34A' : '#D97706' }}>{totalWeight}%</span>
      </div>

      {/* Dimension Cards */}
      {dimensions.map((dim) => {
        const isExpanded = expandedDimension === dim.id;
        return (
          <div key={dim.id} style={{ background: 'white', borderRadius: '16px', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)', overflow: 'hidden' }}>
            {/* Dimension Header */}
            <button
              onClick={() => setExpandedDimension(isExpanded ? null : dim.id)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: 700 }}>
                  {dim.weight}%
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#1D1D1F', marginBottom: '2px' }}>{dim.name}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(60, 60, 67, 0.5)', fontFamily: 'monospace' }}>{dim.id}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(60, 60, 67, 0.5)' }}>{dim.anchors?.length || 0} levels</span>
                <svg
                  width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', color: 'rgba(60, 60, 67, 0.4)' }}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </button>

            {/* Description */}
            {dim.description && (
              <div style={{ padding: '0 20px 16px', marginTop: '-8px' }}>
                <p style={{ fontSize: '13px', color: 'rgba(60, 60, 67, 0.7)', lineHeight: 1.5, margin: 0 }}>{dim.description}</p>
              </div>
            )}

            {/* Expanded Anchors */}
            {isExpanded && dim.anchors && (
              <div style={{ borderTop: '1px solid rgba(0, 0, 0, 0.06)', padding: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {dim.anchors.sort((a, b) => b.level - a.level).map((anchor) => {
                    const levelInfo = getLevelInfo(anchor.level);
                    return (
                      <div key={anchor.level} style={{ display: 'flex', gap: '16px', padding: '16px', background: levelInfo.bg, borderRadius: '12px', borderLeft: `4px solid ${levelInfo.color}` }}>
                        {/* Level Badge */}
                        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '70px' }}>
                          <div style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: levelInfo.gradient, borderRadius: '10px', color: 'white', fontSize: '16px', fontWeight: 700, boxShadow: `0 2px 8px ${levelInfo.color}30` }}>
                            {anchor.level}
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: levelInfo.color, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{levelInfo.label}</span>
                          <span style={{ fontSize: '10px', color: 'rgba(60, 60, 67, 0.5)', fontFamily: 'monospace' }}>{anchor.score_range}</span>
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
                          {/* Behavior - Full text, no truncation */}
                          <div>
                            <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(60, 60, 67, 0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Expected Behavior</div>
                            <p style={{ fontSize: '14px', color: '#1D1D1F', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{anchor.behavior}</p>
                          </div>

                          {/* Signals - Full list */}
                          {anchor.signals && anchor.signals.length > 0 && (
                            <div>
                              <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(60, 60, 67, 0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Detection Signals ({anchor.signals.length})</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {anchor.signals.map((signal, j) => (
                                  <span key={j} style={{ padding: '6px 12px', borderRadius: '8px', background: 'white', border: '1px solid rgba(0, 0, 0, 0.1)', fontSize: '13px', color: '#1D1D1F', whiteSpace: 'normal', wordBreak: 'break-word' }}>{signal}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Example Phrases - Full text for each */}
                          {anchor.example_phrases && anchor.example_phrases.length > 0 && (
                            <div>
                              <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(60, 60, 67, 0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Example Responses ({anchor.example_phrases.length})</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {anchor.example_phrases.map((phrase, j) => (
                                  <div key={j} style={{ padding: '14px 16px', borderRadius: '10px', background: 'white', border: '1px solid rgba(0, 0, 0, 0.08)', fontSize: '13px', color: 'rgba(60, 60, 67, 0.9)', fontStyle: 'italic', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>"{phrase}"</div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Dimensions Editor Component
function DimensionsEditor({ dimensions, onChange }: { dimensions: Dimension[]; onChange: (d: Dimension[]) => void }) {
  const [expandedDimension, setExpandedDimension] = useState<number | null>(null);

  const addDimension = () => {
    const newDimension: Dimension = {
      id: `dim_${Date.now()}`,
      name: '',
      description: '',
      weight: 20,
      anchors: [
        { level: 5, score_range: '80-100', behavior: '', signals: [], example_phrases: [] },
        { level: 4, score_range: '60-80', behavior: '', signals: [], example_phrases: [] },
        { level: 3, score_range: '40-60', behavior: '', signals: [], example_phrases: [] },
        { level: 2, score_range: '20-40', behavior: '', signals: [], example_phrases: [] },
        { level: 1, score_range: '0-20', behavior: '', signals: [], example_phrases: [] },
      ],
    };
    onChange([...dimensions, newDimension]);
    setExpandedDimension(dimensions.length);
  };

  const removeDimension = (index: number) => {
    onChange(dimensions.filter((_, i) => i !== index));
    if (expandedDimension === index) setExpandedDimension(null);
  };

  const updateDimension = (index: number, field: keyof Dimension, value: string | number | DimensionAnchor[]) => {
    const updated = [...dimensions];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div style={styles.dimensionsEditorContainer}>
      {dimensions.map((dim, i) => (
        <div key={i} style={styles.dimensionEditorCard}>
          <div style={styles.dimensionEditorHeader}>
            <button
              onClick={() => setExpandedDimension(expandedDimension === i ? null : i)}
              style={styles.dimensionExpandBtn}
            >
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ transform: expandedDimension === i ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            <input
              type="text"
              value={dim.id}
              onChange={(e) => updateDimension(i, 'id', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
              placeholder="dimension_id"
              style={{ ...styles.editInputSmall, width: '120px' }}
            />
            <input
              type="text"
              value={dim.name}
              onChange={(e) => updateDimension(i, 'name', e.target.value)}
              placeholder="Dimension Name"
              style={{ ...styles.editInput, flex: 1 }}
            />
            <div style={styles.dimensionWeightInput}>
              <input
                type="number"
                value={dim.weight}
                onChange={(e) => updateDimension(i, 'weight', parseInt(e.target.value) || 0)}
                style={{ ...styles.editInputSmall, width: '50px', textAlign: 'right' }}
                min="0"
                max="100"
              />
              <span style={styles.percentSign}>%</span>
            </div>
            <button onClick={() => removeDimension(i)} style={styles.removeButtonSmall}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {expandedDimension === i && (
            <div style={styles.dimensionEditorBody}>
              <div style={styles.dimensionEditorField}>
                <label style={styles.smallLabel}>Description</label>
                <textarea
                  value={dim.description}
                  onChange={(e) => updateDimension(i, 'description', e.target.value)}
                  placeholder="What does this dimension measure?"
                  style={styles.editTextarea}
                  rows={2}
                />
              </div>

              <div style={styles.anchorsEditorContainer}>
                <label style={styles.smallLabel}>Behavioral Anchors (5 Levels)</label>
                <AnchorsEditor
                  anchors={dim.anchors}
                  onChange={(anchors) => updateDimension(i, 'anchors', anchors)}
                />
              </div>
            </div>
          )}
        </div>
      ))}

      <button onClick={addDimension} style={styles.addDimensionBtn}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add Dimension
      </button>
    </div>
  );
}

// Anchors Editor Component
function AnchorsEditor({ anchors, onChange }: { anchors: DimensionAnchor[]; onChange: (a: DimensionAnchor[]) => void }) {
  const [expandedAnchor, setExpandedAnchor] = useState<number | null>(null);

  const updateAnchor = (level: number, field: keyof DimensionAnchor, value: string | number | string[]) => {
    const updated = anchors.map(a => a.level === level ? { ...a, [field]: value } : a);
    onChange(updated);
  };

  const getLevelLabel = (level: number) => {
    const labels: Record<number, string> = { 5: 'Excellent', 4: 'Good', 3: 'Moderate', 2: 'Poor', 1: 'Very Poor' };
    return labels[level] || `Level ${level}`;
  };

  const getLevelColor = (level: number) => {
    const colors: Record<number, string> = { 5: '#16A34A', 4: '#2563EB', 3: '#D97706', 2: '#EA580C', 1: '#DC2626' };
    return colors[level] || '#6B7280';
  };

  // Ensure we have all 5 levels
  const sortedAnchors = [5, 4, 3, 2, 1].map(level => {
    const existing = anchors.find(a => a.level === level);
    return existing || { level, score_range: '', behavior: '', signals: [], example_phrases: [] };
  });

  return (
    <div style={styles.anchorsEditorList}>
      {sortedAnchors.map((anchor) => (
        <div key={anchor.level} style={styles.anchorEditorCard}>
          <button
            onClick={() => setExpandedAnchor(expandedAnchor === anchor.level ? null : anchor.level)}
            style={styles.anchorEditorHeader}
          >
            <span style={{ ...styles.anchorLevelBadge, background: `${getLevelColor(anchor.level)}20`, color: getLevelColor(anchor.level) }}>
              {anchor.level}
            </span>
            <span style={styles.anchorLevelLabel}>{getLevelLabel(anchor.level)}</span>
            <input
              type="text"
              value={anchor.score_range}
              onChange={(e) => { e.stopPropagation(); updateAnchor(anchor.level, 'score_range', e.target.value); }}
              onClick={(e) => e.stopPropagation()}
              placeholder="80-100"
              style={{ ...styles.editInputSmall, width: '70px', marginLeft: 'auto' }}
            />
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ transform: expandedAnchor === anchor.level ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', marginLeft: '8px' }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {expandedAnchor === anchor.level && (
            <div style={styles.anchorEditorBody}>
              <div style={styles.anchorEditorField}>
                <label style={styles.tinyLabel}>Behavior Description</label>
                <textarea
                  value={anchor.behavior}
                  onChange={(e) => updateAnchor(anchor.level, 'behavior', e.target.value)}
                  placeholder="Describe the expected behavior at this level..."
                  style={styles.editTextareaSmall}
                  rows={2}
                />
              </div>

              <div style={styles.anchorEditorField}>
                <label style={styles.tinyLabel}>Signals (keywords that indicate this level)</label>
                <TagsEditor
                  tags={anchor.signals}
                  onChange={(signals) => updateAnchor(anchor.level, 'signals', signals)}
                  placeholder="Add signal keyword..."
                />
              </div>

              <div style={styles.anchorEditorField}>
                <label style={styles.tinyLabel}>Example Phrases</label>
                <TagsEditor
                  tags={anchor.example_phrases}
                  onChange={(phrases) => updateAnchor(anchor.level, 'example_phrases', phrases)}
                  placeholder="Add example phrase..."
                  multiline
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Tags Editor Component (for signals and example phrases)
function TagsEditor({ tags, onChange, placeholder, multiline }: { tags: string[]; onChange: (t: string[]) => void; placeholder?: string; multiline?: boolean }) {
  const [inputValue, setInputValue] = useState('');

  const addTag = () => {
    if (inputValue.trim()) {
      onChange([...tags, inputValue.trim()]);
      setInputValue('');
    }
  };

  const removeTag = (index: number) => onChange(tags.filter((_, i) => i !== index));

  return (
    <div style={styles.tagsEditorContainer}>
      <div style={styles.tagsInputRow}>
        {multiline ? (
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addTag(); } }}
            placeholder={placeholder}
            style={styles.editTextareaSmall}
            rows={1}
          />
        ) : (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTag()}
            placeholder={placeholder}
            style={styles.editInputSmall}
          />
        )}
        <button onClick={addTag} style={styles.addTagBtn}>+</button>
      </div>
      {tags.length > 0 && (
        <div style={styles.tagsList}>
          {tags.map((tag, i) => (
            <span key={i} style={styles.tag} onClick={() => removeTag(i)}>
              {tag} <span style={styles.tagRemove}>×</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Critical Flags Editor Component
function CriticalFlagsEditor({ flags, onChange }: { flags: CriticalFlag[]; onChange: (f: CriticalFlag[]) => void }) {
  const addFlag = () => {
    onChange([...flags, { id: '', condition: '', signals: [], action: '', max_score: undefined }]);
  };

  const removeFlag = (index: number) => onChange(flags.filter((_, i) => i !== index));

  const updateFlag = (index: number, field: keyof CriticalFlag, value: string | number | string[] | undefined) => {
    const updated = [...flags];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div style={styles.flagsEditorContainer}>
      {flags.map((flag, i) => (
        <div key={i} style={styles.flagEditorCard}>
          <div style={styles.flagEditorRow}>
            <input
              type="text"
              value={flag.id}
              onChange={(e) => updateFlag(i, 'id', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
              placeholder="flag_id"
              style={{ ...styles.editInputSmall, width: '100px' }}
            />
            <input
              type="text"
              value={flag.condition}
              onChange={(e) => updateFlag(i, 'condition', e.target.value)}
              placeholder="When does this flag trigger?"
              style={{ ...styles.editInput, flex: 1 }}
            />
            <div style={styles.flagMaxScoreInput}>
              <span style={styles.tinyLabel}>Max:</span>
              <input
                type="number"
                value={flag.max_score ?? ''}
                onChange={(e) => updateFlag(i, 'max_score', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="--"
                style={{ ...styles.editInputSmall, width: '50px' }}
                min="0"
                max="100"
              />
            </div>
            <button onClick={() => removeFlag(i)} style={styles.removeButtonSmall}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div style={styles.flagEditorField}>
            <input
              type="text"
              value={flag.action}
              onChange={(e) => updateFlag(i, 'action', e.target.value)}
              placeholder="Action: e.g., Flag as critical concern - learning-to-action loop may be broken"
              style={styles.editInput}
            />
          </div>
          <div style={styles.flagEditorField}>
            <label style={styles.tinyLabel}>Trigger Signals</label>
            <TagsEditor
              tags={flag.signals}
              onChange={(signals) => updateFlag(i, 'signals', signals)}
              placeholder="Add signal keyword..."
            />
          </div>
        </div>
      ))}

      <button onClick={addFlag} style={styles.addFlagBtn}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add Critical Flag
      </button>
    </div>
  );
}

// Inline Editors for Complex Types
function MetricsEditor({ metrics, onChange }: { metrics: MetricWeight[]; onChange: (m: MetricWeight[]) => void }) {
  const addMetric = () => onChange([...metrics, { metric_code: '', metric_name: '', weight: 0 }]);
  const removeMetric = (i: number) => onChange(metrics.filter((_, idx) => idx !== i));
  const updateMetric = (i: number, field: keyof MetricWeight, value: string | number) => {
    const updated = [...metrics];
    updated[i] = { ...updated[i], [field]: value };
    onChange(updated);
  };

  return (
    <div style={styles.editorList}>
      {metrics.map((m, i) => (
        <div key={i} style={styles.editorRow}>
          <input type="text" value={m.metric_code} onChange={(e) => updateMetric(i, 'metric_code', e.target.value)} placeholder="Code (M1)" style={{ ...styles.editInputSmall, width: '60px' }} />
          <input type="text" value={m.metric_name} onChange={(e) => updateMetric(i, 'metric_name', e.target.value)} placeholder="Metric name" style={{ ...styles.editInput, flex: 1 }} />
          <input type="number" value={m.weight} onChange={(e) => updateMetric(i, 'weight', parseInt(e.target.value) || 0)} placeholder="%" style={{ ...styles.editInputSmall, width: '60px' }} />
          <button onClick={() => removeMetric(i)} style={styles.removeButtonSmall}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
        </div>
      ))}
      <button onClick={addMetric} style={styles.addButtonSmall}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg> Add Metric</button>
    </div>
  );
}

function KeywordsEditor({ keywords, onChange }: { keywords: string[]; onChange: (k: string[]) => void }) {
  const [inputValue, setInputValue] = useState('');
  const addKeyword = () => { if (inputValue.trim()) { onChange([...keywords, inputValue.trim()]); setInputValue(''); } };
  const removeKeyword = (i: number) => onChange(keywords.filter((_, idx) => idx !== i));

  return (
    <div>
      <div style={styles.keywordsInputRow}>
        <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addKeyword()} placeholder="Type and press Enter" style={styles.editInput} />
        <button onClick={addKeyword} style={styles.addButtonSmall}>Add</button>
      </div>
      <div style={{ ...styles.keywordsList, marginTop: '8px' }}>
        {keywords.map((kw, i) => (
          <span key={i} style={{ ...styles.keyword, cursor: 'pointer' }} onClick={() => removeKeyword(i)}>{kw} ×</span>
        ))}
      </div>
    </div>
  );
}

function ScoreAnchorsEditor({ anchors, onChange }: { anchors: ScoreAnchor[]; onChange: (a: ScoreAnchor[]) => void }) {
  const addAnchor = () => onChange([...anchors, { range: '', description: '' }]);
  const removeAnchor = (i: number) => onChange(anchors.filter((_, idx) => idx !== i));
  const updateAnchor = (i: number, field: keyof ScoreAnchor, value: string) => {
    const updated = [...anchors];
    updated[i] = { ...updated[i], [field]: value };
    onChange(updated);
  };

  return (
    <div style={styles.editorList}>
      {anchors.map((a, i) => (
        <div key={i} style={styles.editorRow}>
          <input type="text" value={a.range} onChange={(e) => updateAnchor(i, 'range', e.target.value)} placeholder="90-100" style={{ ...styles.editInputSmall, width: '80px' }} />
          <input type="text" value={a.description} onChange={(e) => updateAnchor(i, 'description', e.target.value)} placeholder="Description for this range" style={{ ...styles.editInput, flex: 1 }} />
          <button onClick={() => removeAnchor(i)} style={styles.removeButtonSmall}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
        </div>
      ))}
      <button onClick={addAnchor} style={styles.addButtonSmall}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg> Add Anchor</button>
    </div>
  );
}

function ExampleAnswersEditor({ examples, onChange }: { examples: ExampleAnswer[]; onChange: (e: ExampleAnswer[]) => void }) {
  const addExample = () => onChange([...examples, { level: 'MODERATE', score_range: '', answer: '' }]);
  const removeExample = (i: number) => onChange(examples.filter((_, idx) => idx !== i));
  const updateExample = (i: number, field: keyof ExampleAnswer, value: string) => {
    const updated = [...examples];
    updated[i] = { ...updated[i], [field]: value };
    onChange(updated);
  };

  return (
    <div style={styles.editorList}>
      {examples.map((ex, i) => (
        <div key={i} style={styles.exampleEditorCard}>
          <div style={styles.exampleEditorHeader}>
            <select value={ex.level} onChange={(e) => updateExample(i, 'level', e.target.value)} style={styles.editSelect}>
              <option value="EXCELLENT">Excellent</option>
              <option value="GOOD">Good</option>
              <option value="MODERATE">Moderate</option>
              <option value="POOR">Poor</option>
            </select>
            <input type="text" value={ex.score_range} onChange={(e) => updateExample(i, 'score_range', e.target.value)} placeholder="85-100" style={{ ...styles.editInputSmall, width: '80px' }} />
            <button onClick={() => removeExample(i)} style={styles.removeButtonSmall}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
          </div>
          <textarea value={ex.answer} onChange={(e) => updateExample(i, 'answer', e.target.value)} placeholder="Example answer text..." style={styles.editTextarea} rows={3} />
        </div>
      ))}
      <button onClick={addExample} style={styles.addButtonSmall}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg> Add Example</button>
    </div>
  );
}

function ExampleAnswersView({ examples }: { examples: ExampleAnswer[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const getLevelColor = (level: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      EXCELLENT: { bg: 'rgba(34, 197, 94, 0.08)', text: '#16A34A', border: 'rgba(34, 197, 94, 0.2)' },
      GOOD: { bg: 'rgba(59, 130, 246, 0.08)', text: '#2563EB', border: 'rgba(59, 130, 246, 0.2)' },
      MODERATE: { bg: 'rgba(245, 158, 11, 0.08)', text: '#D97706', border: 'rgba(245, 158, 11, 0.2)' },
      POOR: { bg: 'rgba(239, 68, 68, 0.08)', text: '#DC2626', border: 'rgba(239, 68, 68, 0.2)' },
    };
    return colors[level.toUpperCase()] || { bg: 'rgba(107, 114, 128, 0.08)', text: '#6B7280', border: 'rgba(107, 114, 128, 0.2)' };
  };

  return (
    <div style={styles.examplesGrid}>
      {examples.map((ex, i) => {
        const color = getLevelColor(ex.level);
        return (
          <div key={i} style={{ ...styles.exampleCard, background: color.bg, borderColor: color.border }}>
            <button onClick={() => setExpanded(expanded === i ? null : i)} style={styles.exampleHeader}>
              <div style={styles.exampleHeaderLeft}>
                <span style={{ ...styles.exampleLevel, color: color.text }}>{ex.level}</span>
                <span style={styles.exampleScore}>{ex.score_range}</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: expanded === i ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', color: 'rgba(60, 60, 67, 0.5)' }}><path d="M6 9l6 6 6-6" /></svg>
            </button>
            {expanded === i && <div style={styles.exampleContent}><p style={styles.exampleText}>{ex.answer}</p></div>}
          </div>
        );
      })}
    </div>
  );
}

function ChecklistEditor({ checklist, onChange }: { checklist: ChecklistItem[]; onChange: (c: ChecklistItem[]) => void }) {
  const addItem = () => onChange([...checklist, { id: '', key: '', description: '' }]);
  const removeItem = (i: number) => onChange(checklist.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof ChecklistItem, value: string) => {
    const updated = [...checklist];
    updated[i] = { ...updated[i], [field]: value };
    onChange(updated);
  };

  return (
    <div style={styles.editorList}>
      {checklist.map((item, i) => (
        <div key={i} style={styles.checklistEditorCard}>
          <div style={styles.checklistEditorHeader}>
            <input type="text" value={item.id} onChange={(e) => updateItem(i, 'id', e.target.value)} placeholder="ID (b1_role)" style={{ ...styles.editInputSmall, width: '100px' }} />
            <input type="text" value={item.key} onChange={(e) => updateItem(i, 'key', e.target.value)} placeholder="Key name" style={{ ...styles.editInput, flex: 1 }} />
            <button onClick={() => removeItem(i)} style={styles.removeButtonSmall}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
          </div>
          <input type="text" value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} placeholder="Description of what to extract" style={styles.editInput} />
        </div>
      ))}
      <button onClick={addItem} style={styles.addButtonSmall}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg> Add Item</button>
    </div>
  );
}

function InterdependenciesEditor({
  interdependencies,
  onChange,
  currentQuestionId: _currentQuestionId
}: {
  interdependencies: Interdependency[];
  onChange: (deps: Interdependency[]) => void;
  currentQuestionId: string;
}) {
  // Note: _currentQuestionId can be used to prevent self-references in future validation
  const addInterdependency = () => onChange([...interdependencies, {
    linked_question_id: '',
    linked_question_code: '',
    description: '',
    scoring_impact: ''
  }]);

  const removeInterdependency = (i: number) => onChange(interdependencies.filter((_, idx) => idx !== i));

  const updateInterdependency = (i: number, field: keyof Interdependency, value: string) => {
    const updated = [...interdependencies];
    updated[i] = { ...updated[i], [field]: value };
    onChange(updated);
  };

  return (
    <div style={styles.editorList}>
      {interdependencies.map((dep, i) => (
        <div key={i} style={styles.interdependencyEditorCard}>
          <div style={styles.interdependencyEditorHeader}>
            <div style={styles.interdependencyEditorRow}>
              <div style={{ flex: '0 0 100px' }}>
                <label style={styles.smallLabel}>Question Code</label>
                <input
                  type="text"
                  value={dep.linked_question_code}
                  onChange={(e) => {
                    updateInterdependency(i, 'linked_question_code', e.target.value);
                    // Auto-generate question ID from code
                    const code = e.target.value.toLowerCase();
                    updateInterdependency(i, 'linked_question_id', `q_cabas_${code}`);
                  }}
                  placeholder="e.g., M4"
                  style={styles.editInputSmall}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.smallLabel}>Question ID</label>
                <input
                  type="text"
                  value={dep.linked_question_id}
                  onChange={(e) => updateInterdependency(i, 'linked_question_id', e.target.value)}
                  placeholder="q_cabas_m4"
                  style={styles.editInput}
                />
              </div>
              <button
                onClick={() => removeInterdependency(i)}
                style={{ ...styles.removeButtonSmall, alignSelf: 'flex-end', marginBottom: '4px' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div style={styles.interdependencyEditorFields}>
            <div style={styles.interdependencyEditorField}>
              <label style={styles.smallLabel}>Description (what is the relationship?)</label>
              <input
                type="text"
                value={dep.description}
                onChange={(e) => updateInterdependency(i, 'description', e.target.value)}
                placeholder="Compare sense-making with cross-team effectiveness"
                style={styles.editInput}
              />
            </div>
            <div style={styles.interdependencyEditorField}>
              <label style={styles.smallLabel}>Scoring Impact (how does it affect scoring?)</label>
              <input
                type="text"
                value={dep.scoring_impact}
                onChange={(e) => updateInterdependency(i, 'scoring_impact', e.target.value)}
                placeholder="If values contradict, flag and reduce scores"
                style={styles.editInput}
              />
            </div>
          </div>
        </div>
      ))}
      <button onClick={addInterdependency} style={styles.addButtonSmall}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add Interdependency
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '32px 40px', maxWidth: '1000px' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 0', gap: '16px' },
  spinner: { width: '32px', height: '32px', border: '2px solid rgba(0, 0, 0, 0.08)', borderTopColor: '#1D1D1F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loadingText: { fontSize: '14px', color: 'rgba(60, 60, 67, 0.6)', margin: 0 },
  errorContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '120px 0', gap: '12px' },
  errorIcon: { color: '#DC2626', marginBottom: '4px' },
  errorText: { fontSize: '14px', color: '#DC2626', margin: 0 },
  backButtonError: { marginTop: '8px', padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#1D1D1F', color: 'white', fontSize: '14px', fontWeight: 500, cursor: 'pointer' },
  header: { marginBottom: '24px' },
  backButton: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 12px', marginBottom: '16px', borderRadius: '8px', border: 'none', background: 'transparent', color: 'rgba(60, 60, 67, 0.8)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerInfo: {},
  title: { fontSize: '28px', fontWeight: 600, color: '#1D1D1F', margin: '0 0 8px 0', letterSpacing: '-0.02em' },
  addQuestionButton: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #1D1D1F 0%, #3A3A3C 100%)', color: 'white', fontSize: '14px', fontWeight: 500, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' },
  headerMeta: { display: 'flex', alignItems: 'center', gap: '12px' },
  versionBadge: { padding: '4px 10px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.1)', color: '#4F46E5', fontSize: '12px', fontWeight: 600 },
  metaText: { fontSize: '14px', color: 'rgba(60, 60, 67, 0.6)' },
  metaDot: { color: 'rgba(60, 60, 67, 0.3)' },
  navigatorCard: { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', marginBottom: '24px', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)', borderRadius: '16px', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)' },
  navArrow: { width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', border: '1px solid rgba(0, 0, 0, 0.08)', background: 'white', color: '#1D1D1F', cursor: 'pointer', flexShrink: 0 },
  numberStrip: { flex: 1, display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', padding: '4px 0' },
  numberButton: { minWidth: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', border: '1px solid rgba(0, 0, 0, 0.08)', background: 'white', color: 'rgba(60, 60, 67, 0.8)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', flexShrink: 0 },
  numberButtonActive: { background: 'linear-gradient(135deg, #1D1D1F 0%, #3A3A3C 100%)', color: 'white', border: 'none', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' },
  navInfo: { fontSize: '13px', color: 'rgba(60, 60, 67, 0.6)', whiteSpace: 'nowrap', flexShrink: 0, marginLeft: '8px' },
  questionCard: { background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)', borderRadius: '20px', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)', overflow: 'hidden' },
  questionHeader: { padding: '24px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' },
  questionBadges: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  aspectBadge: { padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600 },
  typeBadge: { padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 500 },
  statusBadge: { padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, textTransform: 'capitalize' },
  editActions: { display: 'flex', gap: '8px' },
  editButton: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.08)', background: 'white', color: '#1D1D1F', fontSize: '13px', fontWeight: 500, cursor: 'pointer' },
  deleteButton: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: 'none', background: 'rgba(220, 38, 38, 0.08)', color: '#DC2626', fontSize: '13px', fontWeight: 500, cursor: 'pointer' },
  cancelButton: { padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.08)', background: 'white', color: 'rgba(60, 60, 67, 0.8)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' },
  saveButton: { padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)', color: 'white', fontSize: '13px', fontWeight: 500, cursor: 'pointer', boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)' },
  saveErrorBanner: { display: 'flex', alignItems: 'center', gap: '10px', margin: '16px 28px 0', padding: '12px 14px', borderRadius: '10px', background: 'rgba(220, 38, 38, 0.06)', border: '1px solid rgba(220, 38, 38, 0.1)', color: '#DC2626', fontSize: '13px' },
  questionText: { padding: '24px 28px', fontSize: '20px', fontWeight: 500, color: '#1D1D1F', lineHeight: 1.5, letterSpacing: '-0.01em' },
  questionDescription: { padding: '0 28px 24px', fontSize: '14px', color: 'rgba(60, 60, 67, 0.6)', lineHeight: 1.6, margin: 0 },
  editFieldContainer: { padding: '16px 28px' },
  editLabel: { display: 'block', fontSize: '13px', fontWeight: 600, color: '#1D1D1F', marginBottom: '8px' },
  editTextarea: { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(0, 0, 0, 0.1)', background: 'white', fontSize: '14px', color: '#1D1D1F', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box' },
  editInput: { padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.1)', background: 'white', fontSize: '14px', color: '#1D1D1F', outline: 'none', boxSizing: 'border-box' },
  editInputSmall: { padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(0, 0, 0, 0.1)', background: 'white', fontSize: '13px', color: '#1D1D1F', outline: 'none', boxSizing: 'border-box' },
  editSelect: { padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(0, 0, 0, 0.1)', background: 'white', fontSize: '13px', color: '#1D1D1F', outline: 'none', cursor: 'pointer' },
  scalePreview: { padding: '0 28px 24px' },
  scaleLabels: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', color: 'rgba(60, 60, 67, 0.6)' },
  scaleBar: { display: 'flex', gap: '8px' },
  scalePoint: { flex: 1, height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.04)', borderRadius: '8px', fontSize: '13px', fontWeight: 500, color: 'rgba(60, 60, 67, 0.8)' },
  scaleEditorGrid: { display: 'grid', gridTemplateColumns: 'auto 1fr auto 1fr', gap: '12px', alignItems: 'end' },
  scaleEditorField: { display: 'flex', flexDirection: 'column', gap: '4px' },
  smallLabel: { fontSize: '11px', color: 'rgba(60, 60, 67, 0.6)' },
  optionsPreview: { padding: '0 28px 24px' },
  optionsLabel: { fontSize: '12px', fontWeight: 500, color: 'rgba(60, 60, 67, 0.6)', marginBottom: '8px', display: 'block' },
  optionsList: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  optionChip: { padding: '8px 14px', borderRadius: '8px', background: 'rgba(0, 0, 0, 0.04)', fontSize: '13px', color: '#1D1D1F' },
  optionsEditorList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  optionEditorRow: { display: 'flex', gap: '8px', alignItems: 'center' },
  removeButton: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', border: 'none', background: 'rgba(220, 38, 38, 0.08)', color: '#DC2626', cursor: 'pointer' },
  removeButtonSmall: { width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', border: 'none', background: 'rgba(220, 38, 38, 0.08)', color: '#DC2626', cursor: 'pointer', flexShrink: 0 },
  addButton: { display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', borderRadius: '8px', border: '1px dashed rgba(0, 0, 0, 0.15)', background: 'transparent', color: 'rgba(60, 60, 67, 0.6)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' },
  addButtonSmall: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '6px', border: '1px dashed rgba(0, 0, 0, 0.15)', background: 'transparent', color: 'rgba(60, 60, 67, 0.6)', fontSize: '12px', fontWeight: 500, cursor: 'pointer', marginTop: '8px' },
  tabsContainer: { borderTop: '1px solid rgba(0, 0, 0, 0.06)', padding: '0 28px' },
  tabs: { display: 'flex', gap: '4px', paddingTop: '16px' },
  tab: { padding: '10px 20px', borderRadius: '10px 10px 0 0', border: 'none', background: 'transparent', color: 'rgba(60, 60, 67, 0.6)', fontSize: '14px', fontWeight: 500, cursor: 'pointer' },
  tabActive: { background: 'rgba(0, 0, 0, 0.04)', color: '#1D1D1F' },
  tabContent: { padding: '24px 28px', borderTop: '1px solid rgba(0, 0, 0, 0.04)', minHeight: '200px' },
  tabPanel: {},
  section: { marginBottom: '28px' },
  sectionTitle: { fontSize: '14px', fontWeight: 600, color: '#1D1D1F', margin: '0 0 12px 0' },
  sectionSubtitle: { fontSize: '13px', color: 'rgba(60, 60, 67, 0.6)', margin: '-8px 0 12px 0' },
  sectionText: { fontSize: '14px', color: 'rgba(60, 60, 67, 0.8)', lineHeight: 1.6, margin: 0 },
  emptyText: { fontSize: '13px', color: 'rgba(60, 60, 67, 0.4)', fontStyle: 'italic', margin: 0 },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' },
  metricCard: { padding: '16px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.02)', border: '1px solid rgba(0, 0, 0, 0.04)' },
  metricHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' },
  metricCode: { fontSize: '11px', fontWeight: 600, color: '#4F46E5', background: 'rgba(99, 102, 241, 0.1)', padding: '2px 6px', borderRadius: '4px' },
  metricWeight: { fontSize: '16px', fontWeight: 600, color: '#1D1D1F' },
  metricName: { fontSize: '13px', color: 'rgba(60, 60, 67, 0.8)', display: 'block', marginBottom: '8px' },
  metricBar: { height: '6px', background: 'rgba(0, 0, 0, 0.06)', borderRadius: '3px', overflow: 'hidden' },
  metricBarFill: { height: '100%', background: 'linear-gradient(90deg, #4F46E5, #7C3AED)', borderRadius: '3px' },
  keywordsList: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  keyword: { padding: '6px 12px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.08)', color: '#4F46E5', fontSize: '12px', fontWeight: 500 },
  keywordsInputRow: { display: 'flex', gap: '8px' },
  instructionBox: { padding: '16px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.02)', border: '1px solid rgba(0, 0, 0, 0.04)' },
  instructionText: { fontSize: '14px', color: 'rgba(60, 60, 67, 0.8)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' },
  anchorsGrid: { display: 'grid', gap: '10px' },
  anchorCard: { display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '14px 16px', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.02)', border: '1px solid rgba(0, 0, 0, 0.04)' },
  anchorRange: { padding: '4px 10px', borderRadius: '6px', background: 'linear-gradient(135deg, #1D1D1F 0%, #3A3A3C 100%)', color: 'white', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' },
  anchorDescription: { fontSize: '13px', color: 'rgba(60, 60, 67, 0.8)', lineHeight: 1.5, margin: 0 },
  noteBox: { display: 'flex', gap: '12px', padding: '14px 16px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.15)', color: '#D97706' },
  noteText: { fontSize: '13px', lineHeight: 1.5, margin: 0 },
  examplesGrid: { display: 'flex', flexDirection: 'column', gap: '10px' },
  exampleCard: { borderRadius: '12px', border: '1px solid', overflow: 'hidden' },
  exampleHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' },
  exampleHeaderLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  exampleLevel: { fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em' },
  exampleScore: { fontSize: '12px', color: 'rgba(60, 60, 67, 0.6)', padding: '2px 8px', background: 'rgba(0, 0, 0, 0.04)', borderRadius: '4px' },
  exampleContent: { padding: '0 16px 16px' },
  exampleText: { fontSize: '13px', color: 'rgba(60, 60, 67, 0.8)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' },
  exampleEditorCard: { padding: '12px', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.02)', border: '1px solid rgba(0, 0, 0, 0.06)', marginBottom: '8px' },
  exampleEditorHeader: { display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' },
  checklistGrid: { display: 'flex', flexDirection: 'column', gap: '10px' },
  checklistCard: { padding: '16px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.02)', border: '1px solid rgba(0, 0, 0, 0.04)' },
  checklistHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' },
  checklistId: { fontSize: '10px', fontWeight: 600, color: '#4F46E5', background: 'rgba(99, 102, 241, 0.1)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' },
  checklistKey: { fontSize: '14px', fontWeight: 600, color: '#1D1D1F' },
  checklistDescription: { fontSize: '13px', color: 'rgba(60, 60, 67, 0.7)', lineHeight: 1.5, margin: 0 },
  checklistEditorCard: { padding: '12px', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.02)', border: '1px solid rgba(0, 0, 0, 0.06)', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '8px' },
  checklistEditorHeader: { display: 'flex', gap: '8px', alignItems: 'center' },
  editorList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  editorRow: { display: 'flex', gap: '8px', alignItems: 'center' },
  // Interdependency styles
  interdependenciesGrid: { display: 'flex', flexDirection: 'column', gap: '12px' },
  interdependencyCard: { padding: '16px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.04)', border: '1px solid rgba(139, 92, 246, 0.12)' },
  interdependencyHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' },
  interdependencyCode: { fontSize: '12px', fontWeight: 700, color: '#7C3AED', background: 'rgba(139, 92, 246, 0.15)', padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.02em' },
  interdependencyLink: { fontSize: '11px', color: 'rgba(60, 60, 67, 0.5)', fontWeight: 500 },
  interdependencyContent: { display: 'flex', flexDirection: 'column', gap: '10px' },
  interdependencyField: {},
  interdependencyLabel: { fontSize: '11px', fontWeight: 600, color: 'rgba(60, 60, 67, 0.5)', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'block', marginBottom: '4px' },
  interdependencyText: { fontSize: '13px', color: 'rgba(60, 60, 67, 0.8)', lineHeight: 1.5, margin: 0 },
  interdependencyImpact: { fontSize: '13px', color: '#7C3AED', lineHeight: 1.5, margin: 0, fontWeight: 500 },
  interdependencyEditorCard: { padding: '16px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.04)', border: '1px solid rgba(139, 92, 246, 0.12)', marginBottom: '12px' },
  interdependencyEditorHeader: { marginBottom: '12px' },
  interdependencyEditorRow: { display: 'flex', gap: '12px', alignItems: 'flex-end' },
  interdependencyEditorFields: { display: 'flex', flexDirection: 'column', gap: '12px' },
  interdependencyEditorField: { display: 'flex', flexDirection: 'column', gap: '4px' },
  // Dimensions tab styles
  dimensionsGrid: { display: 'flex', flexDirection: 'column', gap: '16px' },
  dimensionCard: { padding: '20px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.12)' },
  dimensionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' },
  dimensionHeaderLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  dimensionId: { fontSize: '10px', fontWeight: 700, color: '#059669', background: 'rgba(16, 185, 129, 0.15)', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.03em', fontFamily: 'monospace' },
  dimensionName: { fontSize: '15px', fontWeight: 600, color: '#1D1D1F' },
  dimensionWeight: { fontSize: '14px', fontWeight: 700, color: '#059669', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '6px' },
  dimensionDescription: { fontSize: '13px', color: 'rgba(60, 60, 67, 0.7)', lineHeight: 1.5, marginBottom: '16px' },
  anchorsContainer: { marginTop: '12px' },
  anchorsHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', cursor: 'pointer', userSelect: 'none' },
  anchorsTitle: { fontSize: '12px', fontWeight: 600, color: 'rgba(60, 60, 67, 0.6)', textTransform: 'uppercase', letterSpacing: '0.03em' },
  anchorsList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  anchorItem: { display: 'flex', gap: '12px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.6)', border: '1px solid rgba(0, 0, 0, 0.04)' },
  anchorLevel: { width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: 'white', fontSize: '12px', fontWeight: 700, flexShrink: 0 },
  anchorContent: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' },
  anchorScoreRange: { fontSize: '11px', fontWeight: 600, color: '#059669' },
  anchorBehavior: { fontSize: '13px', color: 'rgba(60, 60, 67, 0.8)', lineHeight: 1.5, margin: 0 },
  anchorSignals: { display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' },
  anchorSignal: { padding: '2px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.08)', color: '#059669', fontSize: '10px', fontWeight: 500 },
  // Dimensions editor styles
  dimensionsEditorContainer: { display: 'flex', flexDirection: 'column', gap: '16px' },
  weightTotalBanner: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)' },
  weightTotalLabel: { fontSize: '13px', fontWeight: 500, color: '#059669' },
  weightTotalValue: { fontSize: '15px', fontWeight: 700 },
  weightTotalGood: { color: '#059669' },
  weightTotalBad: { color: '#DC2626' },
  dimensionEditorCard: { padding: '16px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.12)', marginBottom: '12px' },
  dimensionEditorHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' },
  dimensionEditorTitle: { display: 'flex', alignItems: 'center', gap: '10px' },
  dimensionEditorIndex: { width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: 'white', fontSize: '11px', fontWeight: 700 },
  dimensionEditorBody: { display: 'flex', flexDirection: 'column', gap: '16px' },
  dimensionEditorRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: '12px', alignItems: 'end' },
  dimensionEditorField: { display: 'flex', flexDirection: 'column', gap: '4px' },
  dimensionEditorFieldFull: { display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1' },
  // Anchors editor styles
  anchorsEditorContainer: { marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(16, 185, 129, 0.1)' },
  anchorsEditorTitle: { fontSize: '13px', fontWeight: 600, color: '#1D1D1F', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' },
  anchorsEditorList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  anchorEditorCard: { padding: '14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.6)', border: '1px solid rgba(0, 0, 0, 0.06)' },
  anchorEditorHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' },
  anchorEditorLevel: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: 'white', fontSize: '13px', fontWeight: 700 },
  anchorEditorLevelLabel: { fontSize: '12px', fontWeight: 600, color: '#1D1D1F' },
  anchorEditorBody: { display: 'flex', flexDirection: 'column', gap: '12px' },
  anchorEditorRow: { display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', alignItems: 'start' },
  anchorEditorFieldSmall: { display: 'flex', flexDirection: 'column', gap: '4px' },
  anchorEditorFieldLarge: { display: 'flex', flexDirection: 'column', gap: '4px' },
  // Tags editor styles (for signals and example_phrases)
  tagsEditorContainer: { display: 'flex', flexDirection: 'column', gap: '8px' },
  tagsLabel: { fontSize: '11px', fontWeight: 600, color: 'rgba(60, 60, 67, 0.6)', textTransform: 'uppercase', letterSpacing: '0.03em' },
  tagsInputRow: { display: 'flex', gap: '8px' },
  tagInput: { flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(0, 0, 0, 0.1)', background: 'white', fontSize: '12px', color: '#1D1D1F', outline: 'none' },
  addTagBtn: { padding: '8px 12px', borderRadius: '6px', border: 'none', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', fontSize: '12px', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' },
  tagsList: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  tag: { display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px 4px 10px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', fontSize: '11px', fontWeight: 500 },
  tagRemove: { width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', border: 'none', background: 'rgba(0, 0, 0, 0.05)', color: 'rgba(60, 60, 67, 0.6)', cursor: 'pointer', padding: 0 },
  // Critical flags styles
  flagsSection: { marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(0, 0, 0, 0.06)' },
  flagsSectionTitle: { fontSize: '14px', fontWeight: 600, color: '#1D1D1F', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' },
  flagsGrid: { display: 'flex', flexDirection: 'column', gap: '12px' },
  flagCard: { padding: '16px', borderRadius: '12px', background: 'rgba(220, 38, 38, 0.04)', border: '1px solid rgba(220, 38, 38, 0.12)' },
  flagHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' },
  flagId: { fontSize: '11px', fontWeight: 700, color: '#DC2626', background: 'rgba(220, 38, 38, 0.12)', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.02em', fontFamily: 'monospace' },
  flagMaxScore: { fontSize: '12px', fontWeight: 600, color: '#DC2626' },
  flagCondition: { fontSize: '13px', color: 'rgba(60, 60, 67, 0.8)', lineHeight: 1.5, marginBottom: '8px' },
  flagAction: { fontSize: '12px', color: '#DC2626', fontWeight: 500, fontStyle: 'italic' },
  flagSignals: { display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' },
  flagSignal: { padding: '2px 6px', borderRadius: '4px', background: 'rgba(220, 38, 38, 0.08)', color: '#DC2626', fontSize: '10px', fontWeight: 500 },
  flagEditorCard: { padding: '16px', borderRadius: '12px', background: 'rgba(220, 38, 38, 0.04)', border: '1px solid rgba(220, 38, 38, 0.12)', marginBottom: '12px' },
  flagEditorHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' },
  flagEditorBody: { display: 'flex', flexDirection: 'column', gap: '12px' },
  flagEditorRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: '12px', alignItems: 'end' },
  flagEditorField: { display: 'flex', flexDirection: 'column', gap: '4px' },
  // Empty states
  emptyDimensionsContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', background: 'rgba(0, 0, 0, 0.02)', borderRadius: '14px', border: '1px dashed rgba(0, 0, 0, 0.1)' },
  emptyDimensionsIcon: { width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', marginBottom: '12px' },
  emptyDimensionsTitle: { fontSize: '15px', fontWeight: 600, color: '#1D1D1F', marginBottom: '4px' },
  emptyDimensionsText: { fontSize: '13px', color: 'rgba(60, 60, 67, 0.6)', textAlign: 'center', maxWidth: '300px', lineHeight: 1.5 },
  // Utility styles
  tinyLabel: { fontSize: '10px', fontWeight: 600, color: 'rgba(60, 60, 67, 0.5)', textTransform: 'uppercase', letterSpacing: '0.03em' },
  editTextareaSmall: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.1)', background: 'white', fontSize: '13px', color: '#1D1D1F', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box', minHeight: '60px' },
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' },
  // Additional Dimensions styles
  weightTotal: { fontSize: '13px', fontWeight: 600, padding: '6px 12px', borderRadius: '6px', background: 'rgba(22, 163, 74, 0.08)' },
  emptySubtext: { fontSize: '12px', color: 'rgba(60, 60, 67, 0.5)', textAlign: 'center', maxWidth: '280px', lineHeight: 1.4, marginTop: '4px' },
  dimensionHeaderRight: { display: 'flex', alignItems: 'center', gap: '10px' },
  dimensionExpandBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', border: '1px solid rgba(0, 0, 0, 0.08)', background: 'white', color: 'rgba(60, 60, 67, 0.6)', cursor: 'pointer', flexShrink: 0 },
  dimensionWeightInput: { display: 'flex', alignItems: 'center', gap: '4px' },
  percentSign: { fontSize: '12px', color: 'rgba(60, 60, 67, 0.5)', fontWeight: 500 },
  addDimensionBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 16px', borderRadius: '10px', border: '1px dashed rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.04)', color: '#059669', fontSize: '13px', fontWeight: 500, cursor: 'pointer', width: '100%', justifyContent: 'center' },
  anchorLevelBadge: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 },
  anchorHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' },
  anchorSignalsContainer: { marginTop: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' },
  anchorSignalsLabel: { fontSize: '10px', fontWeight: 600, color: 'rgba(60, 60, 67, 0.5)', textTransform: 'uppercase', whiteSpace: 'nowrap', paddingTop: '3px' },
  anchorExamplesContainer: { marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' },
  anchorExamplesLabel: { fontSize: '10px', fontWeight: 600, color: 'rgba(60, 60, 67, 0.5)', textTransform: 'uppercase' },
  anchorExamples: { display: 'flex', flexDirection: 'column', gap: '4px' },
  anchorExample: { fontSize: '12px', color: 'rgba(60, 60, 67, 0.7)', fontStyle: 'italic', lineHeight: 1.4, padding: '6px 10px', background: 'rgba(0, 0, 0, 0.02)', borderRadius: '6px', borderLeft: '2px solid rgba(16, 185, 129, 0.3)' },
  anchorEditorField: { display: 'flex', flexDirection: 'column', gap: '4px' },
  flagsEditorContainer: { display: 'flex', flexDirection: 'column', gap: '12px' },
  flagMaxScoreInput: { display: 'flex', alignItems: 'center', gap: '4px' },
  addFlagBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 16px', borderRadius: '10px', border: '1px dashed rgba(220, 38, 38, 0.3)', background: 'rgba(220, 38, 38, 0.04)', color: '#DC2626', fontSize: '13px', fontWeight: 500, cursor: 'pointer', width: '100%', justifyContent: 'center' },
  // Rubric loader styles
  rubricLoaderContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: '16px' },
  rubricLoaderSpinner: { width: '32px', height: '32px', border: '3px solid rgba(16, 185, 129, 0.15)', borderTopColor: '#059669', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  rubricLoaderText: { fontSize: '14px', color: 'rgba(60, 60, 67, 0.6)', margin: 0 },
  rubricErrorContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: '12px' },
  rubricErrorText: { fontSize: '14px', color: '#DC2626', margin: 0 },
};

export default QuestionSetDetailView;
