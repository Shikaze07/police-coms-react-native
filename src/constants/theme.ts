import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0f172a',
    background: '#f8fafc',
    backgroundElement: '#f1f5f9',
    backgroundSelected: '#e2e8f0',
    textSecondary: '#64748b',
    primary: '#0284c7',
    primaryGlow: 'rgba(2, 132, 199, 0.1)',
    warning: '#ea580c',
    danger: '#dc2626',
    success: '#16a34a',
    border: '#cbd5e1',
    accent: '#0369a1',
  },
  dark: {
    text: '#f8fafc',
    background: '#090a0f',
    backgroundElement: '#12141c',
    backgroundSelected: '#1c1f2e',
    textSecondary: '#94a3b8',
    primary: '#00e5ff',
    primaryGlow: 'rgba(0, 229, 255, 0.15)',
    warning: '#ff9f43',
    danger: '#ff4d4d',
    success: '#2ed573',
    border: '#1f2430',
    accent: '#0097a7',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'Georgia',
    rounded: 'System',
    mono: 'Courier New',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    serif: 'Georgia, serif',
    rounded: 'system-ui, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
