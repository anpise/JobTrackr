// Calypso Color Palette
export const colors = {
  calypso: {
    50: '#f1f8fa',
    100: '#dceef1',
    200: '#bcdde5',
    300: '#8ec6d2',
    400: '#59a5b7',
    500: '#3e899c',
    600: '#336a7d',
    700: '#315c6d',
    800: '#2f4e5b',
    900: '#2b434e',
    950: '#182a34',
  },

  // Legacy support (keeping old references)
  curiousBlue: {
    50: '#f1f8fa',
    100: '#dceef1',
    200: '#bcdde5',
    300: '#8ec6d2',
    400: '#59a5b7',
    500: '#3e899c',
    600: '#336a7d',
    700: '#315c6d',
    800: '#2f4e5b',
    900: '#2b434e',
    950: '#182a34',
  },

  // Semantic color mappings
  primary: '#3e899c',        // 500
  primaryHover: '#336a7d',   // 600
  primaryLight: '#59a5b7',   // 400
  primaryDark: '#315c6d',    // 700

  // Background colors - using 200-300 range
  bgPrimary: '#bcdde5',      // 200
  bgLight: '#dceef1',        // 100
  bgCard: '#8ec6d2',         // 300

  // Text colors - using 900-950 range
  textPrimary: '#182a34',    // 950
  textSecondary: '#2b434e',  // 900
  textLight: '#2f4e5b',      // 800

  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#59a5b7',           // 400

  // Neutral colors
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  }
};

// Gradient helpers
export const gradients = {
  primary: `linear-gradient(135deg, ${colors.calypso[500]} 0%, ${colors.calypso[700]} 100%)`,
  hero: `linear-gradient(135deg, ${colors.calypso[300]} 0%, ${colors.calypso[600]} 100%)`,
  card: `linear-gradient(135deg, ${colors.calypso[200]} 0%, ${colors.calypso[300]} 100%)`,
  background: `linear-gradient(135deg, ${colors.calypso[200]} 0%, ${colors.calypso[100]} 100%)`,
};
