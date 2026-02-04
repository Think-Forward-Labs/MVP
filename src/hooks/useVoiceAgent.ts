/**
 * Custom hook for Deepgram Voice Agent integration.
 *
 * Handles:
 * - WebSocket connection to Deepgram Voice Agent API
 * - Microphone audio capture and streaming (linear16 @ 16kHz)
 * - Agent audio playback (linear16 @ 24kHz, raw PCM)
 * - Conversation transcript accumulation
 * - Barge-in (interrupt agent when user starts speaking)
 * - KeepAlive heartbeat
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { ConversationTurn } from '../services/api';

// ─── Types ───────────────────────────────────────────────────────────

export interface VoiceAgentSettings {
  websocket_url: string;
  api_key: string;
  settings_message: Record<string, any>;
}

export type AgentStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'agent_speaking'
  | 'processing'
  | 'ready'   // agent confirmed all checklist items covered
  | 'error';

// Checklist tracking types
export interface ChecklistItemState {
  item_id: string;
  satisfied: boolean;
  value?: string;
  quote?: string;
}

export interface ChecklistState {
  items: Record<string, ChecklistItemState>;
  allItemIds: string[];
}

interface UseVoiceAgentOptions {
  onConversationUpdate?: (history: ConversationTurn[]) => void;
  onAgentReady?: (mergedTranscript: string) => void;
  onError?: (error: string) => void;
  onStatusChange?: (status: AgentStatus) => void;
  onChecklistUpdate?: (state: ChecklistState) => void;
  // Initial checklist items from the question
  checklistItems?: Array<{ id: string; key: string; description: string }>;
}

interface UseVoiceAgentReturn {
  // Connection
  status: AgentStatus;
  isConnected: boolean;
  connect: (settings: VoiceAgentSettings) => Promise<void>;
  disconnect: () => void;

  // Transcripts
  userTranscript: string;
  conversationHistory: ConversationTurn[];

  // Checklist
  checklistState: ChecklistState;

  // Controls
  isMuted: boolean;
  mute: () => void;
  unmute: () => void;

  error: string | null;
}

// ─── Audio Helpers ───────────────────────────────────────────────────

/**
 * Downsample audio from browser's native sample rate to 16kHz.
 * Converts Float32 [-1,1] to Int16 [-32768, 32767].
 */
function downsampleAndConvert(
  inputBuffer: Float32Array,
  inputSampleRate: number,
  outputSampleRate: number
): ArrayBuffer {
  const ratio = inputSampleRate / outputSampleRate;
  const outputLength = Math.floor(inputBuffer.length / ratio);
  const output = new Int16Array(outputLength);

  for (let i = 0; i < outputLength; i++) {
    const srcIndex = Math.floor(i * ratio);
    const sample = Math.max(-1, Math.min(1, inputBuffer[srcIndex]));
    output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }

  return output.buffer;
}

/**
 * Convert raw Int16 PCM to Float32 for AudioBuffer playback.
 */
function int16ToFloat32(int16Data: Int16Array): Float32Array {
  const float32 = new Float32Array(int16Data.length);
  for (let i = 0; i < int16Data.length; i++) {
    float32[i] = int16Data[i] / 32768;
  }
  return float32;
}

// ─── Constants ───────────────────────────────────────────────────────

const AGENT_SAMPLE_RATE = 24000;
const INPUT_SAMPLE_RATE = 16000;
const BUFFER_SIZE = 4096;
const KEEPALIVE_INTERVAL = 6000;

// Pattern the agent says when all items are covered
const READY_PATTERNS = [
  'covers everything',
  'that covers everything',
  'click next',
  'click next when',
  'when you\'re ready',
  'feel free to review',
];

// ─── Hook ────────────────────────────────────────────────────────────

export function useVoiceAgent(options: UseVoiceAgentOptions = {}): UseVoiceAgentReturn {
  const { onConversationUpdate, onAgentReady, onError, onStatusChange, onChecklistUpdate, checklistItems } = options;

  // State
  const [status, setStatus] = useState<AgentStatus>('disconnected');
  const [userTranscript, setUserTranscript] = useState('');
  const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Checklist state
  const [checklistState, setChecklistState] = useState<ChecklistState>(() => {
    const items: Record<string, ChecklistItemState> = {};
    const allItemIds: string[] = [];
    if (checklistItems) {
      for (const item of checklistItems) {
        items[item.id] = { item_id: item.id, satisfied: false };
        allItemIds.push(item.id);
      }
    }
    return { items, allItemIds };
  });
  const checklistStateRef = useRef<ChecklistState>(checklistState);

  // Refs for WebSocket and audio
  const socketRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMutedRef = useRef(false);

  // Audio playback refs
  const playbackContextRef = useRef<AudioContext | null>(null);
  const scheduledSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextPlayTimeRef = useRef(0);

  // Transcript accumulation refs
  const userTranscriptRef = useRef('');
  const conversationRef = useRef<ConversationTurn[]>([]);

  // Track status changes
  const updateStatus = useCallback((newStatus: AgentStatus) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  }, [onStatusChange]);

  // ─── Audio Playback ──────────────────────────────────────────────

  const getPlaybackContext = useCallback((): AudioContext => {
    if (!playbackContextRef.current || playbackContextRef.current.state === 'closed') {
      playbackContextRef.current = new AudioContext({ sampleRate: AGENT_SAMPLE_RATE });
    }
    return playbackContextRef.current;
  }, []);

  const playAudioChunk = useCallback((pcmData: ArrayBuffer) => {
    const ctx = getPlaybackContext();
    const int16Data = new Int16Array(pcmData);
    const float32Data = int16ToFloat32(int16Data);

    const audioBuffer = ctx.createBuffer(1, float32Data.length, AGENT_SAMPLE_RATE);
    audioBuffer.getChannelData(0).set(float32Data);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    // Schedule gapless playback
    const now = ctx.currentTime;
    const startTime = Math.max(now, nextPlayTimeRef.current);
    source.start(startTime);
    nextPlayTimeRef.current = startTime + audioBuffer.duration;

    // Track for barge-in interruption
    scheduledSourcesRef.current.push(source);
    source.onended = () => {
      scheduledSourcesRef.current = scheduledSourcesRef.current.filter(s => s !== source);
    };
  }, [getPlaybackContext]);

  const stopAllPlayback = useCallback(() => {
    scheduledSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (_) { /* already stopped */ }
    });
    scheduledSourcesRef.current = [];
    nextPlayTimeRef.current = 0;
  }, []);

  // ─── Cleanup ─────────────────────────────────────────────────────

  const cleanup = useCallback(() => {
    // Stop keepalive
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }

    // Close WebSocket
    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.OPEN ||
          socketRef.current.readyState === WebSocket.CONNECTING) {
        socketRef.current.close();
      }
      socketRef.current = null;
    }

    // Disconnect audio processor
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    // Close audio contexts
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // Stop playback
    stopAllPlayback();
    if (playbackContextRef.current && playbackContextRef.current.state !== 'closed') {
      playbackContextRef.current.close();
      playbackContextRef.current = null;
    }
  }, [stopAllPlayback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // ─── Merge user turns into a single transcript ───────────────────

  const getMergedUserTranscript = useCallback((): string => {
    return conversationRef.current
      .filter(turn => turn.role === 'user')
      .map(turn => turn.text)
      .join(' ')
      .trim();
  }, []);

  // ─── Check if agent signalled readiness ──────────────────────────

  const checkAgentReady = useCallback((text: string) => {
    const lower = text.toLowerCase();
    const isReady = READY_PATTERNS.some(pattern => lower.includes(pattern));
    if (isReady) {
      updateStatus('ready');
      const merged = getMergedUserTranscript();
      onAgentReady?.(merged);
    }
  }, [updateStatus, getMergedUserTranscript, onAgentReady]);

  // ─── Handle Function Call Request ─────────────────────────────────

  const handleFunctionCallRequest = useCallback((
    socket: WebSocket,
    functionCall: { id: string; name: string; arguments: string }
  ) => {
    if (functionCall.name !== 'update_checklist') {
      console.warn('[VoiceAgent] Unknown function:', functionCall.name);
      return;
    }

    try {
      const args = JSON.parse(functionCall.arguments);
      const itemsToMark: Array<{ item_id: string; value: string; quote?: string }> = args.items || [];

      // Update checklist state
      const newItems = { ...checklistStateRef.current.items };
      for (const item of itemsToMark) {
        if (newItems[item.item_id]) {
          newItems[item.item_id] = {
            item_id: item.item_id,
            satisfied: true,
            value: item.value,
            quote: item.quote,
          };
        }
      }

      // Calculate remaining items
      const remaining = checklistStateRef.current.allItemIds.filter(
        id => !newItems[id]?.satisfied
      );
      const allComplete = remaining.length === 0;

      // Update state
      const newState: ChecklistState = {
        items: newItems,
        allItemIds: checklistStateRef.current.allItemIds,
      };
      checklistStateRef.current = newState;
      setChecklistState(newState);
      onChecklistUpdate?.(newState);

      // Send response back to agent
      const response = {
        type: 'FunctionCallResponse',
        function_call_id: functionCall.id,
        output: JSON.stringify({
          success: true,
          marked: itemsToMark.map(i => i.item_id),
          remaining: remaining,
          all_complete: allComplete,
        }),
      };
      socket.send(JSON.stringify(response));

      console.log('[VoiceAgent] Checklist updated:', {
        marked: itemsToMark.map(i => i.item_id),
        remaining,
        allComplete,
      });

      // NOTE: Do NOT trigger onAgentReady here!
      // Let the agent speak "That covers everything..." first,
      // then the READY_PATTERNS detection in checkAgentReady will trigger ready state.
      // This keeps the conversation natural.
    } catch (err) {
      console.error('[VoiceAgent] Failed to handle function call:', err);
      // Send error response
      const response = {
        type: 'FunctionCallResponse',
        function_call_id: functionCall.id,
        output: JSON.stringify({ success: false, error: 'Failed to process' }),
      };
      socket.send(JSON.stringify(response));
    }
  }, [onChecklistUpdate]);

  // ─── Connect ─────────────────────────────────────────────────────

  const connect = useCallback(async (settings: VoiceAgentSettings) => {
    // Prevent double connections
    if (socketRef.current) {
      cleanup();
    }

    setError(null);
    setUserTranscript('');
    setConversationHistory([]);
    userTranscriptRef.current = '';
    conversationRef.current = [];

    // Reset checklist state for new question
    const resetItems: Record<string, ChecklistItemState> = {};
    const resetItemIds: string[] = [];
    if (checklistItems) {
      for (const item of checklistItems) {
        resetItems[item.id] = { item_id: item.id, satisfied: false };
        resetItemIds.push(item.id);
      }
    }
    const resetState: ChecklistState = { items: resetItems, allItemIds: resetItemIds };
    checklistStateRef.current = resetState;
    setChecklistState(resetState);

    updateStatus('connecting');

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;

      // Create audio context for capturing mic input
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const browserSampleRate = audioContext.sampleRate;

      // Connect to Deepgram Voice Agent WebSocket
      const socket = new WebSocket(
        settings.websocket_url,
        ['token', settings.api_key]
      );
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('[VoiceAgent] WebSocket connected');
        updateStatus('connected');

        // Send Settings message
        socket.send(JSON.stringify(settings.settings_message));

        // Start KeepAlive heartbeat
        keepAliveRef.current = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'KeepAlive' }));
          }
        }, KEEPALIVE_INTERVAL);

        // Set up microphone audio processing
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (socket.readyState === WebSocket.OPEN && !isMutedRef.current) {
            const inputData = e.inputBuffer.getChannelData(0);
            const audioData = downsampleAndConvert(
              inputData,
              browserSampleRate,
              INPUT_SAMPLE_RATE
            );
            socket.send(audioData);
          }
        };

        source.connect(processor);
        processor.connect(audioContext.destination);
      };

      socket.onmessage = (event) => {
        // Binary data = agent audio output
        if (event.data instanceof Blob) {
          event.data.arrayBuffer().then(buffer => {
            playAudioChunk(buffer);
          });
          return;
        }

        if (event.data instanceof ArrayBuffer) {
          playAudioChunk(event.data);
          return;
        }

        // Text data = JSON messages
        try {
          const msg = JSON.parse(event.data);

          switch (msg.type) {
            case 'SettingsApplied':
              console.log('[VoiceAgent] Settings applied');
              updateStatus('listening');
              break;

            case 'ConversationText': {
              const turn: ConversationTurn = {
                role: msg.role === 'assistant' ? 'agent' : 'user',
                text: msg.content || '',
                timestamp: Date.now(),
              };

              conversationRef.current = [...conversationRef.current, turn];
              setConversationHistory([...conversationRef.current]);
              onConversationUpdate?.([...conversationRef.current]);

              if (turn.role === 'user') {
                userTranscriptRef.current = getMergedUserTranscript();
                setUserTranscript(userTranscriptRef.current);
              }

              // Check if the agent is signalling readiness
              if (turn.role === 'agent') {
                checkAgentReady(turn.text);
              }
              break;
            }

            case 'UserStartedSpeaking':
              // Barge-in: stop agent audio immediately
              stopAllPlayback();
              updateStatus('listening');
              break;

            case 'AgentStartedSpeaking':
              updateStatus('agent_speaking');
              break;

            case 'AgentAudioDone':
              // Agent finished speaking, back to listening
              if (status !== 'ready') {
                updateStatus('listening');
              }
              break;

            case 'EndOfThought':
              // Agent finished a logical response segment
              break;

            case 'FunctionCallRequest': {
              // Agent is calling a function (e.g., update_checklist)
              const func = msg.functions?.[0];
              if (func && socket.readyState === WebSocket.OPEN) {
                handleFunctionCallRequest(socket, func);
              }
              break;
            }

            default:
              // Ignore unknown message types
              break;
          }
        } catch (parseErr) {
          console.error('[VoiceAgent] Failed to parse message:', parseErr);
        }
      };

      socket.onerror = () => {
        const errorMsg = 'Voice agent connection error. Please try again.';
        setError(errorMsg);
        onError?.(errorMsg);
        updateStatus('error');
        cleanup();
      };

      socket.onclose = (e) => {
        console.log('[VoiceAgent] WebSocket closed:', e.code, e.reason);
        if (status !== 'disconnected' && status !== 'error') {
          updateStatus('disconnected');
        }
      };

    } catch (err) {
      console.error('[VoiceAgent] Connection error:', err);
      const errorMsg = err instanceof Error
        ? (err.name === 'NotAllowedError'
          ? 'Microphone access denied. Please allow microphone access and try again.'
          : err.message)
        : 'Failed to connect to voice agent';
      setError(errorMsg);
      onError?.(errorMsg);
      updateStatus('error');
      cleanup();
    }
  }, [cleanup, updateStatus, playAudioChunk, stopAllPlayback,
      onConversationUpdate, onAgentReady, onError, checkAgentReady,
      getMergedUserTranscript, handleFunctionCallRequest, checklistItems, status]);

  // ─── Disconnect ──────────────────────────────────────────────────

  const disconnect = useCallback(() => {
    cleanup();
    updateStatus('disconnected');
  }, [cleanup, updateStatus]);

  // ─── Mute/Unmute ─────────────────────────────────────────────────

  const mute = useCallback(() => {
    isMutedRef.current = true;
    setIsMuted(true);
  }, []);

  const unmute = useCallback(() => {
    isMutedRef.current = false;
    setIsMuted(false);
  }, []);

  // ─── Return ──────────────────────────────────────────────────────

  return {
    status,
    isConnected: status !== 'disconnected' && status !== 'connecting' && status !== 'error',
    connect,
    disconnect,
    userTranscript,
    conversationHistory,
    checklistState,
    isMuted,
    mute,
    unmute,
    error,
  };
}
