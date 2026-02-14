
import { StyleSheet } from 'react-native';

export const colors = {
  // Premium Dark Theme with Orange Accents
  primary: '#FF6B35',           // Vibrant Orange
  primaryDark: '#E85A2A',       // Darker Orange
  primaryLight: '#FF8C5F',      // Lighter Orange
  
  accent: '#FF9F66',            // Soft Orange Accent
  accentGlow: 'rgba(255, 107, 53, 0.3)', // Orange Glow
  
  // Dark Theme Base
  background: '#0A0A0B',        // Deep Black
  backgroundElevated: '#141416', // Slightly Elevated Black
  card: '#1C1C1E',              // Dark Card
  cardElevated: '#252528',      // Elevated Card
  
  // Text Colors
  text: '#FFFFFF',              // Pure White
  textSecondary: '#A8A8AA',     // Muted Gray
  textTertiary: '#6C6C70',      // Darker Gray
  
  // Borders & Dividers
  border: '#2C2C2E',            // Subtle Border
  borderLight: '#3A3A3C',       // Lighter Border
  
  // Status Colors
  success: '#34C759',           // Green
  successGlow: 'rgba(52, 199, 89, 0.2)',
  error: '#FF3B30',             // Red
  errorGlow: 'rgba(255, 59, 48, 0.2)',
  warning: '#FF9500',           // Amber
  warningGlow: 'rgba(255, 149, 0, 0.2)',
  info: '#5AC8FA',              // Blue
  infoGlow: 'rgba(90, 200, 250, 0.2)',
  
  // Gradients
  gradientStart: '#FF6B35',
  gradientEnd: '#FF9F66',
  
  // Chart Colors
  chartPrimary: '#FF6B35',
  chartSecondary: '#FF9F66',
  chartTertiary: '#FFB88C',
  chartBackground: 'rgba(255, 107, 53, 0.1)',
  
  // Legacy (for compatibility)
  secondary: '#FF9F66',
  darkBackground: '#0A0A0B',
  darkCard: '#1C1C1E',
  darkText: '#FFFFFF',
  darkTextSecondary: '#A8A8AA',
  darkBorder: '#2C2C2E',
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  glow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  cardElevated: {
    backgroundColor: colors.cardElevated,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.medium,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.medium,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  gradient: {
    borderRadius: 16,
    padding: 20,
  },
});
