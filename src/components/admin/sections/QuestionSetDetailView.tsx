/**
 * Question Set Detail View
 * Premium UI for viewing and editing question set with all questions
 * Apple HIG inspired design with horizontal question navigator
 */

import { useState, useEffect, useRef } from 'react';
import { adminApi } from '../../../services/adminApi';
import type { QuestionSetDetail, Question, MetricWeight, ScoreAnchor, ChecklistItem, ExampleAnswer } from '../../../types/admin';

interface QuestionSetDetailViewProps {
  questionSetId: string;
  onBack: () => void;
}

type TabType = 'overview' | 'scoring' | 'training' | 'checklist';

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
        <div style={styles.headerInfo}>
          <h1 style={styles.title}>{questionSet.name}</h1>
          <div style={styles.headerMeta}>
            <span style={styles.versionBadge}>v{questionSet.version}</span>
            <span style={styles.metaText}>{questionSet.total_questions} questions</span>
            <span style={styles.metaDot}>·</span>
            <span style={styles.metaText}>{questionSet.estimated_duration_minutes} min</span>
          </div>
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
                <button onClick={startEditing} style={styles.editButton}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit
                </button>
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
              {(['overview', 'scoring', 'training', 'checklist'] as TabType[]).map((tab) => (
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

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
        {isEditing ? (
          <textarea
            value={editedQuestion?.interdependencies || ''}
            onChange={(e) => updateField('interdependencies', e.target.value)}
            style={styles.editTextarea}
            rows={2}
            placeholder="Related questions or pathology triggers..."
          />
        ) : question.interdependencies ? (
          <p style={styles.sectionText}>{question.interdependencies}</p>
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
  headerInfo: {},
  title: { fontSize: '28px', fontWeight: 600, color: '#1D1D1F', margin: '0 0 8px 0', letterSpacing: '-0.02em' },
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
};

export default QuestionSetDetailView;
