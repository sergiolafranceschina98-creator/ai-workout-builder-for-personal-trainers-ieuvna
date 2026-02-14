
import { StyleSheet } from 'react-native';

export const colors = {
  // Fitness-themed color palette
  primary: '#FF6B35',        // Energetic orange
  secondary: '#004E89',      // Deep blue
  accent: '#F7931E',         // Bright orange accent
  background: '#F8F9FA',     // Light gray background
  card: '#FFFFFF',           // White cards
  text: '#1A1A1A',          // Dark text
  textSecondary: '#6C757D',  // Gray secondary text
  border: '#E9ECEF',         // Light border
  success: '#28A745',        // Green for success
  error: '#DC3545',          // Red for errors
  warning: '#FFC107',        // Yellow for warnings
  
  // Dark mode
  darkBackground: '#121212',
  darkCard: '#1E1E1E',
  darkText: '#FFFFFF',
  darkTextSecondary: '#B0B0B0',
  darkBorder: '#2C2C2C',
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  body: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
});
