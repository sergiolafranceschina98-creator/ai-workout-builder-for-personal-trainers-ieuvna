
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, shadows } from '@/styles/commonStyles';
import { useTheme } from '@react-navigation/native';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: string;
  gradient?: boolean;
  style?: ViewStyle;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = colors.primary,
  gradient = false,
  style,
}: StatCardProps) {
  const theme = useTheme();
  const valueText = typeof value === 'number' ? value.toString() : value;
  const iconColorWithOpacity = `${color}20`;
  
  const content = (
    <View style={styles.content}>
      {icon && (
        <View style={[styles.iconContainer, { backgroundColor: iconColorWithOpacity }]}>
          <IconSymbol
            ios_icon_name={icon}
            android_material_icon_name={icon}
            size={24}
            color={color}
          />
        </View>
      )}
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: theme.colors.text, opacity: 0.6 }]}>{title}</Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>{valueText}</Text>
        {subtitle && <Text style={[styles.subtitle, { color: theme.colors.text, opacity: 0.6 }]}>{subtitle}</Text>}
      </View>
    </View>
  );

  if (gradient) {
    return (
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, styles.gradientCard, style]}
      >
        {content}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }, style]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    ...shadows.small,
  },
  gradientCard: {
    borderWidth: 0,
    ...shadows.glow,
  },
  content: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    marginBottom: 4,
    fontWeight: '500',
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
});
