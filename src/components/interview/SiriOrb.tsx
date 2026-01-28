/**
 * SiriOrb - Apple Siri-style animated waveform orb
 *
 * A canvas-based animation inspired by Apple's Siri voice assistant.
 * Features layered sine waves with phase shifting and amplitude response.
 */

import { useEffect, useRef, useCallback } from 'react';
import { siriOrbColors, brandColors, animationTiming } from '../../styles/brandColors';

interface SiriOrbProps {
  /** Whether the orb is actively "speaking" (higher amplitude) */
  isSpeaking?: boolean;
  /** Whether the orb is in idle/listening state */
  isListening?: boolean;
  /** Size of the orb in pixels */
  size?: number;
  /** Custom class name */
  className?: string;
}

// Wave configuration
interface WaveConfig {
  color: string;
  opacity: number;
  amplitude: number;
  frequency: number;
  speed: number;
  phase: number;
}

export function SiriOrb({
  isSpeaking = false,
  isListening = true,
  size = 200,
  className,
}: SiriOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const phaseRef = useRef<number>(0);
  const amplitudeRef = useRef<number>(0.3);
  const targetAmplitudeRef = useRef<number>(0.3);

  // Wave configurations
  const wavesRef = useRef<WaveConfig[]>([
    { color: siriOrbColors.waves[0].color, opacity: siriOrbColors.waves[0].opacity, amplitude: 1.0, frequency: 2, speed: 0.02, phase: 0 },
    { color: siriOrbColors.waves[1].color, opacity: siriOrbColors.waves[1].opacity, amplitude: 0.8, frequency: 3, speed: 0.025, phase: Math.PI / 4 },
    { color: siriOrbColors.waves[2].color, opacity: siriOrbColors.waves[2].opacity, amplitude: 0.6, frequency: 2.5, speed: 0.018, phase: Math.PI / 2 },
    { color: siriOrbColors.waves[3].color, opacity: siriOrbColors.waves[3].opacity, amplitude: 0.5, frequency: 3.5, speed: 0.022, phase: Math.PI },
  ]);

  // Attenuation function - makes waves fade at edges
  const attenuate = useCallback((x: number, width: number): number => {
    const normalized = (x / width) * 2 - 1; // -1 to 1
    const k = 4;
    return Math.pow(k / (k + Math.pow(Math.abs(normalized) * k, k)), k);
  }, []);

  // Draw a single wave
  const drawWave = useCallback((
    ctx: CanvasRenderingContext2D,
    wave: WaveConfig,
    width: number,
    height: number,
    globalAmplitude: number,
    globalPhase: number
  ) => {
    const centerY = height / 2;
    const maxAmplitude = height * 0.25 * globalAmplitude * wave.amplitude;

    ctx.beginPath();
    ctx.strokeStyle = wave.color;
    ctx.globalAlpha = wave.opacity;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    for (let x = 0; x <= width; x += 1) {
      const att = attenuate(x, width);
      const normalizedX = x / width;
      const y = centerY + Math.sin(
        normalizedX * Math.PI * 2 * wave.frequency + globalPhase + wave.phase
      ) * maxAmplitude * att;

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
    ctx.globalAlpha = 1;
  }, [attenuate]);

  // Main animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);

    // Smoothly interpolate amplitude
    const amplitudeDiff = targetAmplitudeRef.current - amplitudeRef.current;
    amplitudeRef.current += amplitudeDiff * 0.08;

    // Update phase
    phaseRef.current += 0.03;

    // Draw glow effect
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, width / 2
    );
    gradient.addColorStop(0, `${siriOrbColors.glow.color}${Math.round(siriOrbColors.glow.opacity * 255 * amplitudeRef.current).toString(16).padStart(2, '0')}`);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw waves (back to front)
    wavesRef.current.forEach((wave, index) => {
      const wavePhase = phaseRef.current * (1 + index * 0.1);
      drawWave(ctx, wave, width, height, amplitudeRef.current, wavePhase);
    });

    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    animationRef.current = requestAnimationFrame(animate);
  }, [drawWave]);

  // Update target amplitude based on state
  useEffect(() => {
    if (isSpeaking) {
      targetAmplitudeRef.current = 0.9 + Math.random() * 0.1; // High amplitude with slight variation
    } else if (isListening) {
      targetAmplitudeRef.current = 0.4; // Medium idle amplitude
    } else {
      targetAmplitudeRef.current = 0.2; // Low/dormant amplitude
    }
  }, [isSpeaking, isListening]);

  // Add random amplitude variation when speaking
  useEffect(() => {
    if (!isSpeaking) return;

    const interval = setInterval(() => {
      targetAmplitudeRef.current = 0.7 + Math.random() * 0.3;
    }, 150);

    return () => clearInterval(interval);
  }, [isSpeaking]);

  // Initialize canvas and start animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [size, animate]);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Outer glow ring */}
      <div
        style={{
          position: 'absolute',
          inset: -20,
          borderRadius: '50%',
          background: siriOrbColors.background,
          opacity: isSpeaking ? 0.8 : 0.4,
          transition: `opacity ${animationTiming.smooth}ms ${animationTiming.easeOut}`,
        }}
      />

      {/* Canvas for wave animation */}
      <canvas
        ref={canvasRef}
        style={{
          borderRadius: '50%',
          position: 'relative',
          zIndex: 1,
        }}
      />

      {/* Inner highlight */}
      <div
        style={{
          position: 'absolute',
          width: size * 0.3,
          height: size * 0.3,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${brandColors.accent.primary}20 0%, transparent 70%)`,
          opacity: isSpeaking ? 1 : 0.5,
          transition: `opacity ${animationTiming.smooth}ms ${animationTiming.easeOut}`,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
    </div>
  );
}

export default SiriOrb;
