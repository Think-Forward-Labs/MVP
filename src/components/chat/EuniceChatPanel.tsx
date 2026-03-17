/**
 * Eunice Chat Panel — AI Evaluation Assistant
 *
 * Apple HIG + Material 3 inspired. Content-first, generous whitespace,
 * refined typography, subtle depth. Supports light/dark theme.
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
  theme?: 'light' | 'dark';
}

/** Lightweight markdown → HTML for LLM responses */
function mdToHtml(md: string): string {
  let html = md
    // Escape HTML entities first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headings (### before ## before #)
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr/>');

  // Process lines for lists and paragraphs
  const lines = html.split('\n');
  const result: string[] = [];
  let inUl = false;
  let inOl = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Unordered list
    if (/^[-*] (.+)/.test(trimmed)) {
      if (!inUl) { result.push('<ul>'); inUl = true; }
      if (inOl) { result.push('</ol>'); inOl = false; }
      result.push(`<li>${trimmed.replace(/^[-*] /, '')}</li>`);
      continue;
    }

    // Ordered list
    if (/^\d+\. (.+)/.test(trimmed)) {
      if (!inOl) { result.push('<ol>'); inOl = true; }
      if (inUl) { result.push('</ul>'); inUl = false; }
      result.push(`<li>${trimmed.replace(/^\d+\. /, '')}</li>`);
      continue;
    }

    // Close open lists
    if (inUl) { result.push('</ul>'); inUl = false; }
    if (inOl) { result.push('</ol>'); inOl = false; }

    // Skip if it's already an HTML tag (headings, hr)
    if (/^<(h[1-4]|hr)/.test(trimmed)) {
      result.push(trimmed);
      continue;
    }

    // Empty line
    if (!trimmed) {
      continue;
    }

    // Regular paragraph
    result.push(`<p>${trimmed}</p>`);
  }

  if (inUl) result.push('</ul>');
  if (inOl) result.push('</ol>');

  return result.join('');
}

// ── Greeting detection ──
const GREETING_RE = /^\s*(hi|hey|hello|howdy|hiya|yo|sup|what'?s\s*up|how\s*are\s*you|how'?s\s*it\s*going|good\s*(morning|afternoon|evening|day)|greetings|hola|bonjour|salut|cheers|g'?day)\s*[!?.,]*\s*$/i;

function isGreeting(text: string): boolean {
  return GREETING_RE.test(text.trim());
}

// ── Thinking phrases — 30+ per stage, never repeats in a session ──
const STAGE_1 = [
  'On it...', 'Let me look...', 'Checking now...', 'One sec...', 'Let me see...',
  'Looking into it...', 'Let me check...', 'Sure, one moment...', 'Pulling that up...',
  'Let me find out...', 'Hang on...', 'Looking that up...', 'Searching for that...',
  'Let me dig in...', 'Checking the data...', 'Right, let me see...', 'On that now...',
  'Give me a moment...', 'Let me take a look...', 'Ok let me check...',
  'Looking now...', 'Checking...', 'Sure...', 'One moment...', 'Let me pull that up...',
  'Hmm, let me check...', 'Interesting, let me look...', 'Let me find that...',
  'Sure thing...', 'Working on it...',
];
const STAGE_2 = [
  'Reviewing the scores...', 'Digging into the data...', 'Looking at the metrics...',
  'Pulling up the details...', 'Cross-referencing the report...', 'Checking the evaluation...',
  'Reading through the findings...', 'Scanning the results...', 'Going through the data...',
  'Analysing the responses...', 'Looking at the evidence...', 'Reviewing the report...',
  'Checking metric scores...', 'Cross-checking the data...', 'Reviewing the breakdown...',
  'Looking at the sources...', 'Checking respondent data...', 'Going over the numbers...',
  'Parsing the evaluation...', 'Reading the analysis...', 'Reviewing critical issues...',
  'Examining the patterns...', 'Looking at the trends...', 'Checking the pathologies...',
  'Reviewing the recommendations...', 'Looking at score distributions...',
  'Examining the key actions...', 'Checking the correlations...', 'Reading the insights...',
  'Reviewing strength areas...', 'Looking at the contradictions...',
];
const STAGE_3 = [
  'Almost there...', 'Putting this together...', 'Found what I need...',
  'Just finalizing...', 'Wrapping up...', 'Nearly done...', 'Formatting the answer...',
  'Got it, writing up...', 'Ok, piecing it together...', 'Making sense of it...',
  'Synthesizing the findings...', 'Pulling it all together...', 'One more moment...',
  'Composing the response...', 'Connecting the dots...', 'Just about done...',
  'Finishing up...', 'Summarizing now...', 'Ok I see the picture...', 'Tying it together...',
  'Last check...', 'Refining the answer...', 'Getting there...', 'Final pass...',
  'Structuring the response...', 'Polishing the answer...', 'Bringing it together...',
  'Nearly ready...', 'Just a moment more...', 'Wrapping it up...',
];
const STAGE_4 = [
  'This one needs a deeper look...', 'Still working through it...',
  'Bear with me...', 'Taking a bit longer than usual...', 'Complex one, still on it...',
  'Lots of data to process...', 'Deep-diving on this one...', 'Still reviewing...',
  'Working through the details...', 'Thorough analysis takes a moment...',
];

// ── Greeting-specific phrases (casual, warm) ──
const GREETING_PHRASES = [
  'Hey there!', 'Hi!', 'Hello!', 'Hey!', 'Hi there!',
  'One sec...', 'Hey, one moment...', 'Hi, just a moment...',
];

function useTypingEffect(text: string, speed = 30) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    if (!text) { setDisplayed(''); indexRef.current = 0; return; }
    setDisplayed('');
    indexRef.current = 0;
    const iv = setInterval(() => {
      indexRef.current++;
      if (indexRef.current >= text.length) {
        setDisplayed(text);
        clearInterval(iv);
      } else {
        setDisplayed(text.slice(0, indexRef.current));
      }
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);

  return displayed;
}

function useThinkingPhrase(isLoading: boolean, lastUserMessage: string) {
  const [phrase, setPhrase] = useState('');
  const usedRef = useRef<Set<string>>(new Set());

  const pickRandom = useCallback((pool: string[]) => {
    const available = pool.filter(p => !usedRef.current.has(p));
    const source = available.length > 0 ? available : pool;
    const picked = source[Math.floor(Math.random() * source.length)];
    usedRef.current.add(picked);
    if (usedRef.current.size > 80) usedRef.current.clear();
    return picked;
  }, []);

  useEffect(() => {
    if (!isLoading) {
      setPhrase('');
      return;
    }

    const greet = isGreeting(lastUserMessage);

    // Stage 1 — immediate
    setPhrase(pickRandom(greet ? GREETING_PHRASES : STAGE_1));

    if (greet) return; // greetings are fast, no need for deeper stages

    // Stage 2 — after 2-3s
    const t2 = setTimeout(() => setPhrase(pickRandom(STAGE_2)), 2000 + Math.random() * 1000);
    // Stage 3 — after 5-6s
    const t3 = setTimeout(() => setPhrase(pickRandom(STAGE_3)), 5000 + Math.random() * 1000);
    // Stage 4 — after 9s (slow response)
    const t4 = setTimeout(() => setPhrase(pickRandom(STAGE_4)), 9000);

    return () => { clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [isLoading, lastUserMessage, pickRandom]);

  return phrase;
}

const QUICK_ACTIONS = [
  { label: 'Why these critical issues?', query: 'Why were these critical issues identified? What evidence supports them?' },
  { label: 'Explain key actions', query: 'Can you explain why these key actions were recommended and what impact they would have?' },
  { label: 'Lowest scoring metrics', query: 'Which metrics scored the lowest and why? What are the root causes?' },
  { label: 'How scores work', query: 'How are the metric scores calculated? What questions contribute to each?' },
];

const T = {
  light: {
    bg: '#FFFFFF',
    bgSecondary: '#F9FAFB',
    bgTertiary: '#F3F4F6',
    border: 'rgba(0, 0, 0, 0.06)',
    text: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    userBubble: '#111827',
    userText: '#FFFFFF',
    aiBubble: '#F3F4F6',
    aiText: '#1F2937',
    accent: '#111827',
    inputBg: '#F3F4F6',
    inputBorder: 'rgba(0, 0, 0, 0.08)',
    inputFocusBorder: 'rgba(0, 0, 0, 0.2)',
    pillBg: 'rgba(0, 0, 0, 0.04)',
    pillBorder: 'rgba(0, 0, 0, 0.06)',
    pillHoverBg: 'rgba(0, 0, 0, 0.07)',
    sendActive: '#111827',
    sendDisabled: '#D1D5DB',
    hoverBg: 'rgba(0, 0, 0, 0.04)',
  },
  dark: {
    bg: '#0C1220',
    bgSecondary: '#111827',
    bgTertiary: '#1A2332',
    border: 'rgba(255, 255, 255, 0.06)',
    text: 'rgba(255, 255, 255, 0.92)',
    textSecondary: 'rgba(255, 255, 255, 0.5)',
    textTertiary: 'rgba(255, 255, 255, 0.25)',
    userBubble: 'rgba(255, 255, 255, 0.88)',
    userText: '#0C1220',
    aiBubble: 'rgba(255, 255, 255, 0.04)',
    aiText: 'rgba(255, 255, 255, 0.85)',
    accent: 'rgba(255, 255, 255, 0.88)',
    inputBg: 'rgba(255, 255, 255, 0.04)',
    inputBorder: 'rgba(255, 255, 255, 0.06)',
    inputFocusBorder: 'rgba(255, 255, 255, 0.15)',
    pillBg: 'rgba(255, 255, 255, 0.03)',
    pillBorder: 'rgba(255, 255, 255, 0.06)',
    pillHoverBg: 'rgba(255, 255, 255, 0.06)',
    sendActive: 'rgba(255, 255, 255, 0.88)',
    sendDisabled: 'rgba(255, 255, 255, 0.1)',
    hoverBg: 'rgba(255, 255, 255, 0.04)',
  },
};

export function EuniceChatPanel({ isOpen, onClose, runId, evaluationName: _evaluationName, theme = 'light' }: EuniceChatPanelProps) {
  const c = T[theme];
  const isDark = theme === 'dark';
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const lastUserMsg = messages.filter(m => m.role === 'user').at(-1)?.content || '';
  const thinkingPhrase = useThinkingPhrase(isLoading, lastUserMsg);
  const typedPhrase = useTypingEffect(thinkingPhrase, 28);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `I can help you understand this evaluation — scores, critical issues, and the reasoning behind recommendations.`,
        timestamp: new Date(),
      }]);
    }
  }, [isOpen, messages.length]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', content: content.trim(), timestamp: new Date() }]);
    setInput('');
    setIsLoading(true);
    setError(null);
    const aId = `a-${Date.now()}`;
    setMessages(prev => [...prev, { id: aId, role: 'assistant', content: '', timestamp: new Date(), isLoading: true }]);
    try {
      const data = await adminApi.chatWithEunice(runId, content.trim());
      setMessages(prev => prev.map(m => m.id === aId ? { ...m, content: data.response, isLoading: false } : m));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setMessages(prev => prev.filter(m => m.id !== aId));
    } finally {
      setIsLoading(false);
    }
  }, [runId, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const handleClear = async () => {
    try {
      await adminApi.clearEuniceHistory(runId);
      setMessages([{ id: 'w2', role: 'assistant', content: 'Conversation cleared. What would you like to know?', timestamp: new Date() }]);
    } catch { /* ignore */ }
  };

  const hasUserMessages = messages.some(m => m.role === 'user');

  return (
    <div style={{
      width: isOpen ? 420 : 0,
      minWidth: isOpen ? 420 : 0,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: c.bg,
      borderLeft: isOpen ? `1px solid ${c.border}` : 'none',
      overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", system-ui, sans-serif',
    }}>
      {isOpen && (
        <>
          {/* ── Header ── */}
          <div style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${c.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <SiriOrb size={32} isSpeaking={isLoading} isListening={!isLoading} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: c.text, letterSpacing: '-0.02em' }}>
                  Eunice
                </div>
                <div style={{ fontSize: 11, color: c.textTertiary, letterSpacing: '0.01em', marginTop: 1 }}>
                  {isLoading && typedPhrase ? typedPhrase : 'Evaluation Assistant'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 2 }}>
              {hasUserMessages && (
                <button onClick={handleClear} title="New conversation" style={{
                  width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: c.textTertiary,
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = c.hoverBg; e.currentTarget.style.color = c.textSecondary; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = c.textTertiary; }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              )}
              <button onClick={onClose} style={{
                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: c.textTertiary,
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = c.hoverBg; e.currentTarget.style.color = c.textSecondary; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = c.textTertiary; }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* ── Messages ── */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '20px 20px 12px',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            {messages.map(msg => (
              <div key={msg.id} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                animation: 'eucFadeIn 0.25s ease-out',
              }}>
                {msg.isLoading ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '2px 0',
                    animation: 'eucBreathe 2.5s ease-in-out infinite',
                  }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                      background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    }}>
                      <img src="/eunice.gif" alt="" style={{ width: 16, height: 16, objectFit: 'cover', borderRadius: '50%' }} />
                    </div>
                    <span style={{
                      fontSize: 13, color: c.textSecondary,
                      fontStyle: 'italic', letterSpacing: '-0.01em',
                    }}>
                      {typedPhrase || 'Thinking...'}
                    </span>
                  </div>
                ) : (
                  <div style={{
                    maxWidth: '85%',
                    padding: msg.role === 'user' ? '10px 16px' : '12px 16px',
                    borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: msg.role === 'user' ? c.userBubble : c.aiBubble,
                    color: msg.role === 'user' ? c.userText : c.aiText,
                  }}>
                    {msg.role === 'assistant' ? (
                      <div
                        className="euc-ai-content"
                        style={{ fontSize: 13.5, lineHeight: 1.6, letterSpacing: '-0.01em', margin: 0 }}
                        dangerouslySetInnerHTML={{ __html: mdToHtml(msg.content) }}
                      />
                    ) : (
                      <div style={{
                        fontSize: 13.5, lineHeight: 1.6, letterSpacing: '-0.01em',
                        whiteSpace: 'pre-wrap', margin: 0,
                      }}>
                        {msg.content}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {error && (
              <div style={{ textAlign: 'center' }}>
                <span style={{
                  display: 'inline-block', fontSize: 12, padding: '6px 14px', borderRadius: 20,
                  background: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.06)',
                  color: isDark ? '#F87171' : '#DC2626',
                }}>
                  {error}
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Quick Actions (before first message) ── */}
          {!hasUserMessages && (
            <div style={{ padding: '0 20px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                Suggestions
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {QUICK_ACTIONS.map((a, i) => (
                  <button key={i} onClick={() => sendMessage(a.query)} disabled={isLoading} style={{
                    padding: '7px 14px',
                    borderRadius: 20,
                    border: `1px solid ${c.pillBorder}`,
                    background: c.pillBg,
                    color: c.textSecondary,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.5 : 1,
                    transition: 'all 0.15s ease',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.3,
                  }}
                    onMouseEnter={e => { if (!isLoading) { e.currentTarget.style.background = c.pillHoverBg; e.currentTarget.style.borderColor = c.inputFocusBorder; e.currentTarget.style.color = c.text; }}}
                    onMouseLeave={e => { e.currentTarget.style.background = c.pillBg; e.currentTarget.style.borderColor = c.pillBorder; e.currentTarget.style.color = c.textSecondary; }}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Input ── */}
          <div style={{ padding: '12px 16px 16px' }}>
            <div style={{
              display: 'flex', alignItems: 'flex-end', gap: 8,
              background: c.inputBg,
              border: `1px solid ${inputFocused ? c.inputFocusBorder : c.inputBorder}`,
              borderRadius: 22,
              padding: '4px 4px 4px 16px',
              transition: 'border-color 0.2s ease',
            }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Ask anything..."
                disabled={isLoading}
                rows={1}
                style={{
                  flex: 1, resize: 'none', background: 'transparent', border: 'none',
                  padding: '8px 0', fontSize: 14, color: c.text, outline: 'none',
                  minHeight: 36, maxHeight: 100, opacity: isLoading ? 0.5 : 1,
                  letterSpacing: '-0.01em', lineHeight: 1.5,
                  fontFamily: 'inherit',
                }}
                onInput={e => {
                  const t = e.target as HTMLTextAreaElement;
                  t.style.height = 'auto';
                  t.style.height = Math.min(t.scrollHeight, 100) + 'px';
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                style={{
                  width: 34, height: 34, borderRadius: 18,
                  border: 'none', flexShrink: 0,
                  background: (!input.trim() || isLoading) ? c.sendDisabled : c.sendActive,
                  cursor: (!input.trim() || isLoading) ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  opacity: (!input.trim() || isLoading) ? 0.5 : 1,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M7 11L12 6L17 11M12 6V18" stroke={isDark ? '#0C1220' : 'white'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          <style>{`
            @keyframes eucBreathe {
              0%, 100% { opacity: 0.7; }
              50% { opacity: 1; }
            }
            @keyframes eucFadeIn {
              from { opacity: 0; transform: translateY(6px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes eucBounce {
              0%, 80%, 100% { transform: scale(0); }
              40% { transform: scale(1); }
            }
            .euc-ai-content p { margin: 0 0 8px; }
            .euc-ai-content p:last-child { margin-bottom: 0; }
            .euc-ai-content h1, .euc-ai-content h2, .euc-ai-content h3, .euc-ai-content h4 {
              margin: 12px 0 6px; font-size: 13.5px; font-weight: 600;
            }
            .euc-ai-content h1:first-child, .euc-ai-content h2:first-child, .euc-ai-content h3:first-child { margin-top: 0; }
            .euc-ai-content ul, .euc-ai-content ol {
              margin: 6px 0; padding-left: 18px;
            }
            .euc-ai-content li { margin: 3px 0; }
            .euc-ai-content strong, .euc-ai-content b { font-weight: 600; }
            .euc-ai-content em, .euc-ai-content i { font-style: italic; }
            .euc-ai-content code {
              font-family: 'IBM Plex Mono', ui-monospace, monospace;
              font-size: 12px; padding: 1px 5px; border-radius: 4px;
              background: ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'};
            }
            .euc-ai-content blockquote {
              margin: 8px 0; padding: 6px 12px;
              border-left: 2px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'};
              opacity: 0.85;
            }
            .euc-ai-content a {
              color: ${isDark ? 'rgba(255,255,255,0.8)' : '#111827'};
              text-decoration: underline;
              text-underline-offset: 2px;
            }
            .euc-ai-content hr {
              border: none; height: 1px; margin: 10px 0;
              background: ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'};
            }
            .euc-ai-content table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 12px; }
            .euc-ai-content th, .euc-ai-content td {
              padding: 5px 8px; text-align: left;
              border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'};
            }
            .euc-ai-content th { font-weight: 600; }
          `}</style>
        </>
      )}
    </div>
  );
}

export default EuniceChatPanel;
