/**
 * SiriOrb - Thinking-style Animated Orb
 *
 * Based on Siri thinking animation:
 * - 6 blur layers with multi-octave noise deformation
 * - Fast, dynamic movement
 * - Moving gradient centers
 * - Floating particles
 * - Bright core with specular highlight
 */

import { useEffect, useRef, useCallback } from 'react';

interface SiriOrbProps {
  isSpeaking?: boolean;
  isListening?: boolean;
  size?: number;
  className?: string;
}

// Purple-pink color palette (6 colors for layer cycling)
const COLORS = [
  { r: 139, g: 92, b: 246 },   // #8B5CF6 - Purple
  { r: 168, g: 85, b: 247 },   // #A855F7 - Violet
  { r: 217, g: 70, b: 239 },   // #D946EF - Fuchsia
  { r: 236, g: 72, b: 153 },   // #EC4899 - Pink
  { r: 167, g: 139, b: 250 },  // #A78BFA - Light purple
  { r: 244, g: 114, b: 182 },  // #F472B6 - Light pink
];

export function SiriOrb({
  isSpeaking = false,
  isListening = true,
  size = 200,
  className,
}: SiriOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const intensityRef = useRef<number>(0.9);
  const targetIntensityRef = useRef<number>(0.9);
  const scaleRef = useRef<number>(0.95);
  const targetScaleRef = useRef<number>(0.95);

  // Multi-octave smooth noise (from reference)
  const smoothNoise = useCallback((angle: number, t: number, freq: number, speed: number): number => {
    const x = Math.cos(angle) * freq;
    const y = Math.sin(angle) * freq;
    const z = t * speed;

    let val = 0;
    val += Math.sin(x * 1.2 + z) * 0.5;
    val += Math.sin(y * 0.8 - z * 1.3) * 0.3;
    val += Math.sin((x + y) * 0.6 + z * 0.7) * 0.2;
    val += Math.sin(x * 2.1 - y * 1.7 + z * 1.1) * 0.15;
    val += Math.cos(y * 2.5 + z * 0.9) * 0.1;
    return val;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    // Update time (thinking speed = 2.5x)
    timeRef.current += 0.016;
    const t = timeRef.current;

    // Smooth transitions
    intensityRef.current += (targetIntensityRef.current - intensityRef.current) * 0.03;
    scaleRef.current += (targetScaleRef.current - scaleRef.current) * 0.04;
    const intensity = intensityRef.current;
    const scale = scaleRef.current;

    // Breathing effect
    const breathe = 1 + Math.sin(t * 0.8) * 0.02 * (1 + intensity);
    const baseRadius = Math.min(w, h) * 0.26 * scale * breathe;

    // Background glow
    const bgGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 2);
    bgGlow.addColorStop(0, `rgba(${COLORS[0].r}, ${COLORS[0].g}, ${COLORS[0].b}, ${0.08 * intensity})`);
    bgGlow.addColorStop(0.5, `rgba(${COLORS[0].r}, ${COLORS[0].g}, ${COLORS[0].b}, ${0.03 * intensity})`);
    bgGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = bgGlow;
    ctx.fillRect(0, 0, w, h);

    // Draw 6 blob layers with blur
    const layers = 6;
    const speedMult = 2.5; // Thinking speed
    const deformAmount = 0.12; // Thinking deformation

    for (let l = 0; l < layers; l++) {
      const layerT = l / layers;
      const layerRadius = baseRadius * (0.6 + layerT * 0.45);
      const alpha = (0.15 + layerT * 0.12) * (0.6 + intensity * 0.4);
      const color = COLORS[l % 6];
      const nextColor = COLORS[(l + 1) % 6];

      ctx.beginPath();

      const segments = 120;
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;

        // Multiple noise frequencies for organic shape
        const n1 = smoothNoise(angle, t, 1.0 + l * 0.3, 0.4 * speedMult);
        const n2 = smoothNoise(angle + 100, t, 2.0 + l * 0.2, 0.6 * speedMult) * 0.5;
        const n3 = smoothNoise(angle + 200, t, 3.5, 0.9 * speedMult) * 0.25;

        const noiseVal = (n1 + n2 + n3) * deformAmount * intensity;
        const r = layerRadius * (1 + noiseVal);

        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r;

        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();

      // Moving gradient center
      const grad = ctx.createRadialGradient(
        cx + Math.sin(t * 0.3 + l) * baseRadius * 0.2,
        cy + Math.cos(t * 0.4 + l) * baseRadius * 0.2,
        0,
        cx, cy,
        layerRadius * 1.4
      );

      grad.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`);
      grad.addColorStop(0.5, `rgba(${((color.r + nextColor.r) / 2) | 0}, ${((color.g + nextColor.g) / 2) | 0}, ${((color.b + nextColor.b) / 2) | 0}, ${alpha * 0.7})`);
      grad.addColorStop(1, `rgba(${nextColor.r}, ${nextColor.g}, ${nextColor.b}, ${alpha * 0.3})`);

      ctx.fillStyle = grad;
      ctx.filter = `blur(${2 + l * 2}px)`;
      ctx.fill();
      ctx.filter = 'none';
    }

    // Core bright center
    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 0.5);
    coreGrad.addColorStop(0, `rgba(255, 255, 255, ${0.3 * intensity})`);
    coreGrad.addColorStop(0.3, `rgba(220, 210, 255, ${0.15 * intensity})`);
    coreGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, baseRadius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Specular highlight
    const specX = cx - baseRadius * 0.2;
    const specY = cy - baseRadius * 0.25;
    const specGrad = ctx.createRadialGradient(specX, specY, 0, specX, specY, baseRadius * 0.35);
    specGrad.addColorStop(0, `rgba(255, 255, 255, ${0.15 * intensity})`);
    specGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = specGrad;
    ctx.beginPath();
    ctx.arc(specX, specY, baseRadius * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Floating particles (20 for thinking mode)
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
      const pAngle = (i / particleCount) * Math.PI * 2 + t * 0.2;
      const pDist = baseRadius * (1.1 + Math.sin(t * 0.5 + i * 1.7) * 0.3 * intensity);
      const px = cx + Math.cos(pAngle) * pDist;
      const py = cy + Math.sin(pAngle) * pDist;
      const pSize = 1.5 + Math.sin(t + i) * 1 * intensity;
      const pAlpha = (0.3 + Math.sin(t * 0.8 + i * 2.3) * 0.3) * intensity;

      const pColor = COLORS[i % 6];
      ctx.beginPath();
      ctx.arc(px, py, pSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${pColor.r}, ${pColor.g}, ${pColor.b}, ${pAlpha})`;
      ctx.fill();
    }

    ctx.restore();
    animationRef.current = requestAnimationFrame(draw);
  }, [smoothNoise]);

  // Update target intensity based on state
  useEffect(() => {
    if (isSpeaking) {
      targetIntensityRef.current = 1.0;
      targetScaleRef.current = 1.1;
    } else if (isListening) {
      targetIntensityRef.current = 0.9;
      targetScaleRef.current = 0.95;
    } else {
      targetIntensityRef.current = 0.7;
      targetScaleRef.current = 0.9;
    }
  }, [isSpeaking, isListening]);

  // Random intensity variation when speaking
  useEffect(() => {
    if (!isSpeaking) return;
    const interval = setInterval(() => {
      targetIntensityRef.current = 0.9 + Math.random() * 0.1;
    }, 100);
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

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [size, draw]);

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
      {/* Ambient glow behind */}
      <div
        style={{
          position: 'absolute',
          inset: -size * 0.15,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(${COLORS[0].r}, ${COLORS[0].g}, ${COLORS[0].b}, 0.15) 0%, transparent 70%)`,
          filter: `blur(${size * 0.1}px)`,
          opacity: isSpeaking ? 1 : 0.7,
          transition: 'opacity 0.4s ease',
        }}
      />

      {/* Main canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'relative',
          zIndex: 1,
        }}
      />
    </div>
  );
}

export default SiriOrb;
