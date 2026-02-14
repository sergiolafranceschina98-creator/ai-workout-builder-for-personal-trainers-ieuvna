
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CircularProgress from 'react-native-circular-progress-indicator';
import { colors } from '@/styles/commonStyles';

interface ProgressRingProps {
  value: number;
  maxValue: number;
  size?: number;
  strokeWidth?: number;
  title?: string;
  subtitle?: string;
  color?: string;
  showValue?: boolean;
}

export default function ProgressRing({
  value,
  maxValue,
  size = 120,
  strokeWidth = 12,
  title,
  subtitle,
  color = colors.primary,
  showValue = true,
}: ProgressRingProps) {
  const percentage = Math.min((value / maxValue) * 100, 100);
  const displayValue = Math.round(percentage);

  return (
    <View style={styles.container}>
      <CircularProgress
        value={percentage}
        radius={size / 2}
        duration={1500}
        progressValueColor={colors.text}
        maxValue={100}
        title={showValue ? '%' : ''}
        titleColor={colors.textSecondary}
        titleStyle={styles.percentSymbol}
        activeStrokeColor={color}
        inActiveStrokeColor={colors.border}
        inActiveStrokeOpacity={0.5}
        activeStrokeWidth={strokeWidth}
        inActiveStrokeWidth={strokeWidth}
        progressValueStyle={styles.progressValue}
        dashedStrokeConfig={{
          count: 0,
          width: 0,
        }}
      />
      {title && (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      )}
      {subtitle && (
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  percentSymbol: {
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});
