/**
 * Custom hook for voice recording with Deepgram real-time STT
 *
 * Handles:
 * - Microphone access via Web Audio API
 * - WebSocket connection to Deepgram for real-time transcription
 * - Recording state management
 * - Transcript accumulation
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { voiceApi } from '../services/api';

interface UseVoiceRecordingOptions {
  onTranscriptUpdate?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: (finalTranscript: string) => void;
}

interface UseVoiceRecordingReturn {
  isRecording: boolean;
  isConnecting: boolean;
  transcript: string;
  interimTranscript: string;
  recordingTime: number;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  clearTranscript: () => void;
  isSupported: boolean;
}

export function useVoiceRecording(options: UseVoiceRecordingOptions = {}): UseVoiceRecordingReturn {
  const { onTranscriptUpdate, onError, onRecordingStart, onRecordingStop } = options;

  // State
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const socketRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptRef = useRef<string>('');

  // Check browser support
  const isSupported = typeof navigator !== 'undefined' &&
    'mediaDevices' in navigator &&
    'getUserMedia' in navigator.mediaDevices;

  // Cleanup function
  const cleanup = useCallback(() => {
    // Stop recording timer
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    // Close WebSocket
    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
      socketRef.current = null;
    }

    // Disconnect audio processor
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Convert Float32 audio to Int16 for Deepgram
  const float32ToInt16 = (float32Array: Float32Array): ArrayBuffer => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array.buffer;
  };

  // Start recording
  const startRecording = useCallback(async () => {
    if (isRecording || isConnecting) return;

    setError(null);
    setIsConnecting(true);
    setTranscript('');
    setInterimTranscript('');
    transcriptRef.current = '';
    setRecordingTime(0);

    try {
      // Get Deepgram config
      const config = await voiceApi.getConfig();

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      mediaStreamRef.current = stream;

      // Create audio context
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      // Create WebSocket connection to Deepgram
      const wsUrl = `${config.websocket_url}&encoding=linear16&sample_rate=16000&channels=1`;
      const socket = new WebSocket(wsUrl, ['token', config.api_key]);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('Deepgram WebSocket connected');
        setIsConnecting(false);
        setIsRecording(true);
        onRecordingStart?.();

        // Start recording timer
        recordingTimerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);

        // Set up audio processing
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (socket.readyState === WebSocket.OPEN) {
            const inputData = e.inputBuffer.getChannelData(0);
            const audioData = float32ToInt16(inputData);
            socket.send(audioData);
          }
        };

        source.connect(processor);
        processor.connect(audioContext.destination);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'Results' && data.channel?.alternatives?.[0]) {
            const alternative = data.channel.alternatives[0];
            const text = alternative.transcript || '';
            const isFinal = data.is_final;

            if (text) {
              if (isFinal) {
                // Append final transcript
                transcriptRef.current = transcriptRef.current
                  ? `${transcriptRef.current} ${text}`.trim()
                  : text;
                setTranscript(transcriptRef.current);
                setInterimTranscript('');
                onTranscriptUpdate?.(transcriptRef.current, true);
              } else {
                // Update interim transcript
                setInterimTranscript(text);
                const fullText = transcriptRef.current
                  ? `${transcriptRef.current} ${text}`.trim()
                  : text;
                onTranscriptUpdate?.(fullText, false);
              }
            }
          }
        } catch (e) {
          console.error('Error parsing Deepgram message:', e);
        }
      };

      socket.onerror = (e) => {
        console.error('Deepgram WebSocket error:', e);
        const errorMsg = 'Connection error. Please try again.';
        setError(errorMsg);
        onError?.(errorMsg);
        cleanup();
        setIsRecording(false);
        setIsConnecting(false);
      };

      socket.onclose = (e) => {
        console.log('Deepgram WebSocket closed:', e.code, e.reason);
        if (isRecording) {
          setIsRecording(false);
        }
      };

    } catch (err) {
      console.error('Error starting recording:', err);
      const errorMsg = err instanceof Error
        ? (err.name === 'NotAllowedError'
          ? 'Microphone access denied. Please allow microphone access and try again.'
          : err.message)
        : 'Failed to start recording';
      setError(errorMsg);
      onError?.(errorMsg);
      cleanup();
      setIsConnecting(false);
    }
  }, [isRecording, isConnecting, cleanup, onTranscriptUpdate, onError, onRecordingStart]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (!isRecording) return;

    const finalTranscript = transcriptRef.current;
    cleanup();
    setIsRecording(false);
    setInterimTranscript('');
    onRecordingStop?.(finalTranscript);
  }, [isRecording, cleanup, onRecordingStop]);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    transcriptRef.current = '';
  }, []);

  return {
    isRecording,
    isConnecting,
    transcript,
    interimTranscript,
    recordingTime,
    error,
    startRecording,
    stopRecording,
    clearTranscript,
    isSupported,
  };
}
