/**
 * Brand Colors Configuration
 *
 * Centralized color definitions for the application.
 * Update these values to change the brand appearance across all components.
 */

export const brandColors = {
  // Background
  background: {
    primary: '#F5F5F7',
    secondary: '#E8E8ED',
    gradient: 'linear-gradient(135deg, #F5F5F7 0%, #E8E8ED 50%, #F5F5F7 100%)',
  },

  // Text
  text: {
    primary: '#1D1D1F',
    secondary: 'rgba(60, 60, 67, 0.6)',
    muted: '#71717A',
    inverse: '#FFFFFF',
  },

  // Accent Colors - Voice Agent / AI theme
  accent: {
    primary: '#6366F1',      // Indigo
    secondary: '#8B5CF6',    // Purple
    gradient: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
    light: 'rgba(99, 102, 241, 0.1)',
  },

  // Orb/Ambient colors (for background effects)
  orb: {
    blue: 'rgba(0, 122, 255, 0.08)',
    purple: 'rgba(88, 86, 214, 0.06)',
  },

  // Glass/Card effects
  glass: {
    background: 'rgba(255, 255, 255, 0.72)',
    backgroundSolid: 'rgba(255, 255, 255, 0.95)',
    border: 'rgba(0, 0, 0, 0.06)',
    shadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
    blur: 'blur(20px) saturate(180%)',
  },

  // Primary button (dark)
  button: {
    primary: {
      background: 'linear-gradient(135deg, #1D1D1F 0%, #3A3A3C 100%)',
      text: '#FFFFFF',
      shadow: '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)',
    },
    secondary: {
      background: 'rgba(255, 255, 255, 0.72)',
      text: '#1D1D1F',
      border: '1px solid rgba(0, 0, 0, 0.06)',
    },
  },

  // Status colors
  status: {
    success: '#34C759',
    error: '#FF3B30',
    warning: '#FF9500',
    info: '#007AFF',
  },
};

// Siri-style orb wave colors (for canvas rendering)
export const siriOrbColors = {
  // Primary wave colors (indigo-purple theme)
  waves: [
    { color: '#6366F1', opacity: 0.8 },   // Indigo - main wave
    { color: '#8B5CF6', opacity: 0.6 },   // Purple - secondary
    { color: '#A78BFA', opacity: 0.4 },   // Light purple - tertiary
    { color: '#818CF8', opacity: 0.5 },   // Indigo light - accent
  ],

  // Glow effect
  glow: {
    color: '#6366F1',
    blur: 40,
    opacity: 0.3,
  },

  // Background gradient for orb container
  background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
};

// Animation timing (based on Apple HIG research)
export const animationTiming = {
  micro: 200,        // Quick micro-interactions
  standard: 300,     // Standard transitions
  smooth: 400,       // Smooth, polished transitions
  slow: 500,         // Deliberate, premium feel

  // Easing functions
  easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',      // Entry animations
  easeIn: 'cubic-bezier(0.4, 0.0, 1, 1)',         // Exit animations
  easeInOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',    // Standard
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Bouncy
};

export default brandColors;
