// Design Tokens for Be Living
// Centralized color, spacing, and typography scales

export const colors = {
  // Light Mode
  light: {
    background: '#FFFFFF',
    foreground: '#000000',
    textPrimary: '#000000',
    textSecondary: '#666666',
    textTertiary: '#999999',
    borderLight: '#E5E5E5',
    borderMedium: '#D0D0D0',
    accentGold: '#D4AF37',
    accentBlack: '#000000',
    accentRed: '#EF4444',
    accentGreen: '#22C55E',
    accentBlue: '#3B82F6',
    hoverLight: '#F5F5F5',
    hoverMedium: '#EFEFEF',
  },
  // Dark Mode
  dark: {
    background: '#0A0A0A',
    foreground: '#FFFFFF',
    textPrimary: '#FFFFFF',
    textSecondary: '#999999',
    textTertiary: '#666666',
    borderLight: '#2A2A2A',
    borderMedium: '#3A3A3A',
    accentGold: '#FFD700',
    accentBlack: '#FFFFFF',
    accentRed: '#F87171',
    accentGreen: '#4ADE80',
    accentBlue: '#60A5FA',
    hoverLight: '#1A1A1A',
    hoverMedium: '#252525',
  },
}

export const spacing = {
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
}

export const borderRadius = {
  sm: '8px',   // buttons, inputs, small cards
  md: '12px',  // regular cards
  lg: '16px',  // large cards
  xl: '24px',  // property images
}

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
}

export const typography = {
  headingXL: {
    fontSize: '36px',
    fontWeight: '700',
    lineHeight: '1.2',
  },
  headingLG: {
    fontSize: '28px',
    fontWeight: '600',
    lineHeight: '1.3',
  },
  headingMD: {
    fontSize: '24px',
    fontWeight: '600',
    lineHeight: '1.3',
  },
  headingSM: {
    fontSize: '20px',
    fontWeight: '600',
    lineHeight: '1.4',
  },
  bodyLG: {
    fontSize: '18px',
    fontWeight: '400',
    lineHeight: '1.625',
  },
  bodyMD: {
    fontSize: '16px',
    fontWeight: '400',
    lineHeight: '1.625',
  },
  bodySM: {
    fontSize: '14px',
    fontWeight: '400',
    lineHeight: '1.6',
  },
  bodyXS: {
    fontSize: '12px',
    fontWeight: '400',
    lineHeight: '1.5',
  },
}

// Button Variants
export const buttonVariants = {
  premium: {
    light: 'bg-yellow-500 hover:bg-yellow-600 text-black',
    dark: 'dark:bg-yellow-400 dark:hover:bg-yellow-500 dark:text-black',
    focus: 'focus:ring-yellow-500 dark:focus:ring-yellow-400',
  },
  regular: {
    light: 'bg-black hover:bg-gray-800 text-white',
    dark: 'dark:bg-white dark:hover:bg-gray-200 dark:text-black',
    focus: 'focus:ring-gray-800 dark:focus:ring-gray-200',
  },
  ghost: {
    light: 'border-2 border-gray-300 hover:bg-gray-50 text-black',
    dark: 'dark:border-gray-700 dark:hover:bg-gray-900 dark:text-white',
    focus: 'focus:ring-gray-300 dark:focus:ring-gray-700',
  },
  text: {
    light: 'text-gray-700 hover:text-black',
    dark: 'dark:text-gray-300 dark:hover:text-white',
    focus: 'focus:ring-gray-500',
  },
}

// Helper function to get color based on theme
export function getColor(key: keyof typeof colors.light, isDark: boolean) {
  return isDark ? colors.dark[key] : colors.light[key]
}
