/**
 * Eunice Chat Panel - AI Evaluation Assistant
 *
 * Premium glass-morphism design that integrates as a side panel,
 * pushing content rather than overlaying it.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { adminApi } from '../../services/adminApi';
import { SiriOrb } from '../interview/SiriOrb';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface EuniceChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  runId: string;
  evaluationName?: string;
}

// Quick action suggestions
const QUICK_ACTIONS = [
  { icon: '!', label: 'Critical issues explained', query: 'Why were these critical issues identified? What evidence supports them?' },
  { icon: '>', label: 'Key action rationale', query: 'Can you explain why these key actions were recommended and what impact they would have?' },
  { icon: '^', label: 'Lowest metrics analysis', query: 'Which metrics scored the lowest and why? What are the root causes?' },
  { icon: '?', label: 'Score methodology', query: 'How are the metric scores calculated? What questions contribute to each?' },
];

export function EuniceChatPanel({ isOpen, onClose, runId, evaluationName: _evaluationName }: EuniceChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Hi, I'm Eunice. I can help you understand this evaluation—why certain scores were given, what the critical issues mean, and the reasoning behind recommendations.\n\nWhat would you like to know?`,
        timestamp: new Date(),
      }]);
    }
  }, [isOpen, messages.length]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    // Add placeholder for assistant response
    const assistantId = `assistant-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    }]);

    try {
      const data = await adminApi.chatWithEunice(runId, content.trim());

      // Update the assistant message with the response
      setMessages(prev => prev.map(msg =>
        msg.id === assistantId
          ? { ...msg, content: data.response, isLoading: false }
          : msg
      ));
    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      // Remove the placeholder message on error
      setMessages(prev => prev.filter(msg => msg.id !== assistantId));
    } finally {
      setIsLoading(false);
    }
  }, [runId, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleClearHistory = async () => {
    try {
      await adminApi.clearEuniceHistory(runId);
      setMessages([{
        id: 'welcome-new',
        role: 'assistant',
        content: `Conversation cleared. What would you like to know about this evaluation?`,
        timestamp: new Date(),
      }]);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  return (
    <div
      style={{
        width: isOpen ? '400px' : '0px',
        minWidth: isOpen ? '400px' : '0px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderLeft: isOpen ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
        boxShadow: isOpen ? '-4px 0 24px rgba(0, 0, 0, 0.04)' : 'none',
        overflow: 'hidden',
        transition: 'all 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
      }}
    >
      {isOpen && (
        <>
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.6)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Animated Eunice Orb */}
              <div style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <SiriOrb size={40} isSpeaking={isLoading} isListening={!isLoading} />
              </div>
              <div>
                <h2 style={{
                  margin: 0,
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#1D1D1F',
                  letterSpacing: '-0.01em',
                }}>
                  Eunice
                </h2>
                <p style={{
                  margin: 0,
                  fontSize: '11px',
                  color: 'rgba(60, 60, 67, 0.6)',
                  letterSpacing: '0.01em',
                }}>
                  Evaluation Assistant
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <button
                onClick={handleClearHistory}
                style={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'rgba(60, 60, 67, 0.6)',
                  transition: 'all 0.15s ease',
                }}
                title="Clear conversation"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M1 4v6h6M23 20v-6h-6" />
                  <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
                </svg>
              </button>
              <button
                onClick={onClose}
                style={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'rgba(60, 60, 67, 0.6)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                  animation: 'fadeIn 0.2s ease-out',
                }}
              >
                <div
                  style={{
                    maxWidth: '88%',
                    padding: '10px 14px',
                    borderRadius: message.role === 'user'
                      ? '14px 14px 4px 14px'
                      : '14px 14px 14px 4px',
                    background: message.role === 'user'
                      ? 'linear-gradient(135deg, #1D1D1F 0%, #3A3A3C 100%)'
                      : 'rgba(0, 0, 0, 0.04)',
                    color: message.role === 'user' ? 'white' : '#1D1D1F',
                    boxShadow: message.role === 'user'
                      ? '0 2px 8px rgba(0, 0, 0, 0.12)'
                      : 'none',
                  }}
                >
                  {message.isLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[0, 1, 2].map(i => (
                          <span
                            key={i}
                            style={{
                              display: 'inline-block',
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: 'rgba(60, 60, 67, 0.4)',
                              animation: `bounce 1.4s infinite ease-in-out both`,
                              animationDelay: `${i * 0.16}s`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p style={{
                      margin: 0,
                      fontSize: '13px',
                      lineHeight: '1.5',
                      whiteSpace: 'pre-wrap',
                      letterSpacing: '-0.01em',
                    }}>
                      {message.content}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Error message */}
            {error && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
              }}>
                <div style={{
                  backgroundColor: 'rgba(220, 38, 38, 0.08)',
                  color: '#DC2626',
                  fontSize: '12px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                }}>
                  {error}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions - show only when no user messages yet */}
          {messages.filter(m => m.role === 'user').length === 0 && (
            <div style={{ padding: '0 16px 12px' }}>
              <p style={{
                fontSize: '10px',
                fontWeight: 600,
                color: 'rgba(60, 60, 67, 0.4)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '8px',
              }}>
                Quick questions
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {QUICK_ACTIONS.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(action.query)}
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      border: '1px solid rgba(0, 0, 0, 0.06)',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      opacity: isLoading ? 0.5 : 1,
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
                        e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.02)';
                      e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)';
                    }}
                  >
                    <span style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(29, 29, 31, 0.06)',
                      color: '#1D1D1F',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}>
                      {action.icon}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      color: '#1D1D1F',
                      flex: 1,
                      letterSpacing: '-0.01em',
                    }}>
                      {action.label}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(60, 60, 67, 0.3)" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: '12px 16px 16px',
            borderTop: '1px solid rgba(0, 0, 0, 0.06)',
            background: 'rgba(255, 255, 255, 0.6)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '8px',
              background: 'rgba(0, 0, 0, 0.03)',
              borderRadius: '14px',
              padding: '4px',
            }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about scores, issues, recommendations..."
                disabled={isLoading}
                rows={1}
                style={{
                  flex: 1,
                  resize: 'none',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  fontSize: '13px',
                  color: '#1D1D1F',
                  outline: 'none',
                  minHeight: '40px',
                  maxHeight: '100px',
                  opacity: isLoading ? 0.5 : 1,
                  letterSpacing: '-0.01em',
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 100) + 'px';
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                style={{
                  flexShrink: 0,
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  border: 'none',
                  background: (!input.trim() || isLoading)
                    ? 'rgba(0, 0, 0, 0.06)'
                    : 'linear-gradient(135deg, #1D1D1F 0%, #3A3A3C 100%)',
                  cursor: (!input.trim() || isLoading) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: (!input.trim() || isLoading)
                    ? 'none'
                    : '0 2px 8px rgba(0, 0, 0, 0.15)',
                  transition: 'all 0.15s ease',
                }}
              >
                {isLoading ? (
                  <span style={{
                    display: 'inline-block',
                    width: '14px',
                    height: '14px',
                    border: '2px solid rgba(60, 60, 67, 0.3)',
                    borderTopColor: 'rgba(60, 60, 67, 0.8)',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={!input.trim() ? 'rgba(60, 60, 67, 0.3)' : 'white'}
                    strokeWidth="2"
                  >
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                )}
              </button>
            </div>
            <p style={{
              fontSize: '10px',
              color: 'rgba(60, 60, 67, 0.4)',
              marginTop: '8px',
              textAlign: 'center',
              letterSpacing: '0.01em',
            }}>
              Eunice uses AI to analyze evaluation data
            </p>
          </div>

          {/* CSS Animations */}
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(4px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes bounce {
              0%, 80%, 100% { transform: scale(0); }
              40% { transform: scale(1); }
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </>
      )}
    </div>
  );
}

export default EuniceChatPanel;
