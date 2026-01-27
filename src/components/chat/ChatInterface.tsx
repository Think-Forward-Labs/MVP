import { useState, useRef, useEffect } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { Icons } from '../common/Icons';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'insight' | 'chart';
  data?: {
    title?: string;
    value?: string | number;
    change?: string;
    items?: { label: string; value: number }[];
  };
}

interface ChatInterfaceProps {
  onNavigate?: (section: string) => void;
}

export function ChatInterface({ onNavigate: _onNavigate }: ChatInterfaceProps) {
  void _onNavigate; // Will be used for navigation commands
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickPrompts = [
    { icon: '📊', title: 'Show readiness score', description: 'View your current business readiness assessment' },
    { icon: '📈', title: 'Analyze trends', description: 'Understand performance patterns over time' },
    { icon: '💡', title: 'Get recommendations', description: 'AI-powered suggestions for improvement' },
    { icon: '📋', title: 'Review assessments', description: 'Summary of completed evaluations' },
  ];

  const simulateResponse = (userMessage: string) => {
    setIsTyping(true);

    setTimeout(() => {
      let response: Message;

      if (userMessage.toLowerCase().includes('readiness') || userMessage.toLowerCase().includes('score')) {
        response = {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Based on your completed assessments and connected data sources, here\'s your current readiness overview:',
          timestamp: new Date(),
          type: 'insight',
          data: {
            title: 'Overall Readiness Score',
            value: 78,
            change: '+5 from last month',
            items: [
              { label: 'Strategy', value: 85 },
              { label: 'Operations', value: 72 },
              { label: 'Technology', value: 68 },
              { label: 'Culture', value: 81 },
            ]
          }
        };
      } else if (userMessage.toLowerCase().includes('trend') || userMessage.toLowerCase().includes('performance')) {
        response = {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'I\'ve analyzed your performance data over the past quarter. Your strongest improvement has been in strategic planning (+12%), while technology infrastructure shows the most room for growth. Would you like me to dive deeper into any specific area?',
          timestamp: new Date(),
          type: 'text',
        };
      } else if (userMessage.toLowerCase().includes('recommend') || userMessage.toLowerCase().includes('focus') || userMessage.toLowerCase().includes('improv')) {
        response = {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Based on your assessment data, I recommend focusing on these three areas:\n\n1. **Technology Infrastructure** (Score: 68) — Consider modernizing legacy systems. Your documents indicate this is limiting operational efficiency.\n\n2. **Market Position** (Score: 64) — Strengthen competitive analysis capabilities. This came up in your leadership interviews.\n\n3. **Cross-functional Collaboration** — Several team members mentioned communication gaps between departments.\n\nWould you like to start an interview focused on any of these areas?',
          timestamp: new Date(),
          type: 'text',
        };
      } else if (userMessage.toLowerCase().includes('assessment') || userMessage.toLowerCase().includes('interview') || userMessage.toLowerCase().includes('review')) {
        response = {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'You\'ve completed 3 of 5 recommended assessments:\n\n✅ Executive Leadership Assessment\n✅ Strategy & Planning Review\n✅ Operations Readiness (60% complete)\n⏳ Technology Infrastructure\n⏳ Team & Culture Assessment\n\nWould you like to continue the Operations assessment or start a new one?',
          timestamp: new Date(),
          type: 'text',
        };
      } else {
        response = {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'I can help you understand your business readiness and capabilities. Try asking about your readiness score, performance trends, or areas for improvement. I can also help you navigate to assessments, documents, or integrations.',
          timestamp: new Date(),
          type: 'text',
        };
      }

      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 1000 + Math.random() * 500);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
      type: 'text',
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    simulateResponse(inputValue);
  };

  const handleQuickPrompt = (title: string) => {
    const promptMap: Record<string, string> = {
      'Show readiness score': 'What is my current business readiness score?',
      'Analyze trends': 'Analyze my business performance trends',
      'Get recommendations': 'What should I focus on improving?',
      'Review assessments': 'Summarize my completed assessments',
    };

    const prompt = promptMap[title] || title;
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
      timestamp: new Date(),
      type: 'text',
    };

    setMessages(prev => [...prev, userMessage]);
    simulateResponse(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Empty state - show welcome
  if (messages.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.welcomeContainer}>
          <h1 style={styles.welcomeTitle}>What would you like to know?</h1>
          <p style={styles.welcomeSubtitle}>
            Ask about your business readiness, explore insights, or start a new assessment.
          </p>

          <div style={styles.quickPromptsGrid}>
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                style={styles.quickPromptCard}
                onClick={() => handleQuickPrompt(prompt.title)}
              >
                <span style={styles.quickPromptIcon}>{prompt.icon}</span>
                <div style={styles.quickPromptContent}>
                  <span style={styles.quickPromptTitle}>{prompt.title}</span>
                  <span style={styles.quickPromptDescription}>{prompt.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <form style={styles.inputForm} onSubmit={handleSubmit}>
          <div style={styles.inputWrapper}>
            <button type="button" style={styles.attachButton}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            <textarea
              ref={inputRef}
              style={styles.textInput}
              placeholder="Ask anything about your business..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <div style={styles.inputActions}>
              <span style={styles.modelBadge}>Opus 4.5</span>
              <button
                type="submit"
                style={{
                  ...styles.sendButton,
                  opacity: inputValue.trim() ? 1 : 0.4,
                }}
                disabled={!inputValue.trim()}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          <p style={styles.disclaimer}>Think Forward can make mistakes. Please double-check responses.</p>
        </form>
      </div>
    );
  }

  // Chat view with messages
  return (
    <div style={styles.chatContainer}>
      <div style={styles.messagesContainer}>
        <div style={styles.messagesInner}>
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                ...styles.messageWrapper,
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              {message.role === 'assistant' && (
                <div style={styles.assistantAvatar}>
                  <Icons.Logo />
                </div>
              )}
              <div
                style={{
                  ...styles.messageBubble,
                  ...(message.role === 'user' ? styles.userBubble : styles.assistantBubble),
                }}
              >
                <p style={{
                  ...styles.messageText,
                  color: message.role === 'user' ? '#FFFFFF' : '#1F2937',
                }}>{message.content}</p>

                {/* Insight Card */}
                {message.type === 'insight' && message.data && (
                  <div style={styles.insightCard}>
                    <div style={styles.insightHeader}>
                      <span style={styles.insightTitle}>{message.data.title}</span>
                      {message.data.change && (
                        <span style={styles.insightChange}>
                          <Icons.TrendingUp />
                          {message.data.change}
                        </span>
                      )}
                    </div>
                    <div style={styles.insightScore}>
                      <span style={styles.insightValue}>{message.data.value}</span>
                      <span style={styles.insightMax}>/100</span>
                    </div>
                    {message.data.items && (
                      <div style={styles.insightItems}>
                        {message.data.items.map((item, i) => (
                          <div key={i} style={styles.insightItem}>
                            <span style={styles.insightItemLabel}>{item.label}</span>
                            <div style={styles.insightItemBar}>
                              <div
                                style={{
                                  ...styles.insightItemFill,
                                  width: `${item.value}%`,
                                  backgroundColor: item.value >= 80 ? '#059669' : item.value >= 65 ? '#D97706' : '#DC2626'
                                }}
                              />
                            </div>
                            <span style={styles.insightItemValue}>{item.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div style={styles.messageWrapper}>
              <div style={styles.assistantAvatar}>
                <Icons.Logo />
              </div>
              <div style={{ ...styles.messageBubble, ...styles.assistantBubble }}>
                <div style={styles.typingIndicator}>
                  <span style={styles.typingDot} />
                  <span style={{ ...styles.typingDot, animationDelay: '0.2s' }} />
                  <span style={{ ...styles.typingDot, animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <form style={styles.inputForm} onSubmit={handleSubmit}>
        <div style={styles.inputWrapper}>
          <button type="button" style={styles.attachButton}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          <textarea
            ref={inputRef}
            style={styles.textInput}
            placeholder="Ask anything about your business..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <div style={styles.inputActions}>
            <span style={styles.modelBadge}>Opus 4.5</span>
            <button
              type="submit"
              style={{
                ...styles.sendButton,
                opacity: inputValue.trim() ? 1 : 0.4,
              }}
              disabled={!inputValue.trim()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        <p style={styles.disclaimer}>Think Forward can make mistakes. Please double-check responses.</p>
      </form>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  // Empty State
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '60px 24px 24px',
    maxWidth: '680px',
    margin: '0 auto',
    width: '100%',
    minHeight: '100%',
  },
  welcomeContainer: {
    textAlign: 'center',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  welcomeTitle: {
    fontSize: '28px',
    fontWeight: '500',
    letterSpacing: '-0.02em',
    marginBottom: '8px',
    color: '#1F2937',
  },
  welcomeSubtitle: {
    fontSize: '15px',
    color: '#6B7280',
    maxWidth: '400px',
    margin: '0 auto 48px',
    lineHeight: '1.5',
  },
  quickPromptsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    maxWidth: '560px',
    margin: '0 auto',
  },
  quickPromptCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease',
  },
  quickPromptIcon: {
    fontSize: '20px',
    marginTop: '2px',
  },
  quickPromptContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  quickPromptTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1F2937',
  },
  quickPromptDescription: {
    fontSize: '12px',
    color: '#9CA3AF',
    lineHeight: '1.4',
  },

  // Chat Container
  chatContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
  },
  messagesInner: {
    maxWidth: '680px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  messageWrapper: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  assistantAvatar: {
    width: '28px',
    height: '28px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBubble: {
    maxWidth: '85%',
    padding: '14px 18px',
    borderRadius: '18px',
  },
  userBubble: {
    backgroundColor: '#1F2937',
    color: '#FFFFFF',
    borderBottomRightRadius: '4px',
  },
  assistantBubble: {
    backgroundColor: '#F9FAFB',
    border: '1px solid #E5E7EB',
    borderBottomLeftRadius: '4px',
  },
  messageText: {
    fontSize: '14px',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap',
    margin: 0,
  },

  // Insight Card (inline)
  insightCard: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
  },
  insightHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  insightTitle: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
  },
  insightChange: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    color: '#059669',
  },
  insightScore: {
    display: 'flex',
    alignItems: 'baseline',
    marginBottom: '16px',
  },
  insightValue: {
    fontSize: '42px',
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 1,
    letterSpacing: '-0.02em',
  },
  insightMax: {
    fontSize: '16px',
    color: '#9CA3AF',
    marginLeft: '4px',
  },
  insightItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  insightItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  insightItemLabel: {
    width: '80px',
    fontSize: '13px',
    color: '#6B7280',
  },
  insightItemBar: {
    flex: 1,
    height: '6px',
    backgroundColor: '#E5E7EB',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  insightItemFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  },
  insightItemValue: {
    width: '28px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
    textAlign: 'right',
  },

  // Typing Indicator
  typingIndicator: {
    display: 'flex',
    gap: '4px',
    padding: '4px 0',
  },
  typingDot: {
    width: '6px',
    height: '6px',
    backgroundColor: '#9CA3AF',
    borderRadius: '50%',
    animation: 'bounce 1.4s infinite ease-in-out',
  },

  // Input Form
  inputForm: {
    padding: '16px 24px 20px',
    backgroundColor: '#FFFFFF',
  },
  inputWrapper: {
    maxWidth: '680px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '#F9FAFB',
    border: '1px solid #E5E7EB',
    borderRadius: '16px',
  },
  attachButton: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    color: '#9CA3AF',
    cursor: 'pointer',
    borderRadius: '8px',
    flexShrink: 0,
  },
  textInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    resize: 'none',
    fontSize: '14px',
    lineHeight: '1.5',
    fontFamily: 'inherit',
    backgroundColor: 'transparent',
    minHeight: '24px',
    maxHeight: '120px',
    padding: '4px 0',
  },
  inputActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  modelBadge: {
    fontSize: '11px',
    fontWeight: '500',
    color: '#9CA3AF',
    padding: '4px 8px',
    backgroundColor: '#F3F4F6',
    borderRadius: '6px',
  },
  sendButton: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F2937',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'opacity 0.15s ease',
  },
  disclaimer: {
    maxWidth: '680px',
    margin: '8px auto 0',
    fontSize: '11px',
    color: '#9CA3AF',
    textAlign: 'center',
  },
};

export default ChatInterface;
