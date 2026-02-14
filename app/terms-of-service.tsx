
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';

export default function TermsOfServiceScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Terms of Service', headerShown: true }} />
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Terms of Service</Text>
          <Text style={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</Text>

          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By accessing and using AI Workout Builder, you accept and agree to be bound by these Terms of Service.
          </Text>

          <Text style={styles.sectionTitle}>2. Description of Service</Text>
          <Text style={styles.paragraph}>
            AI Workout Builder is a platform for personal trainers to create personalized workout programs for their clients using AI technology.
          </Text>

          <Text style={styles.sectionTitle}>3. User Accounts</Text>
          <Text style={styles.paragraph}>
            You are responsible for:
          </Text>
          <Text style={styles.bulletPoint}>• Maintaining the confidentiality of your account</Text>
          <Text style={styles.bulletPoint}>• All activities that occur under your account</Text>
          <Text style={styles.bulletPoint}>• Notifying us of any unauthorized use</Text>

          <Text style={styles.sectionTitle}>4. Acceptable Use</Text>
          <Text style={styles.paragraph}>
            You agree not to:
          </Text>
          <Text style={styles.bulletPoint}>• Use the service for any illegal purpose</Text>
          <Text style={styles.bulletPoint}>• Violate any laws or regulations</Text>
          <Text style={styles.bulletPoint}>• Infringe on intellectual property rights</Text>
          <Text style={styles.bulletPoint}>• Transmit harmful code or malware</Text>
          <Text style={styles.bulletPoint}>• Attempt to gain unauthorized access</Text>

          <Text style={styles.sectionTitle}>5. Professional Disclaimer</Text>
          <Text style={styles.paragraph}>
            AI Workout Builder is a tool for fitness professionals. Users are responsible for:
          </Text>
          <Text style={styles.bulletPoint}>• Ensuring programs are appropriate for their clients</Text>
          <Text style={styles.bulletPoint}>• Obtaining proper medical clearance when necessary</Text>
          <Text style={styles.bulletPoint}>• Supervising client training sessions</Text>
          <Text style={styles.bulletPoint}>• Modifying programs based on client feedback</Text>

          <Text style={styles.sectionTitle}>6. Subscription and Payment</Text>
          <Text style={styles.paragraph}>
            Subscription fees are billed in advance on a recurring basis. You may cancel at any time, but no refunds will be provided for partial periods.
          </Text>

          <Text style={styles.sectionTitle}>7. Intellectual Property</Text>
          <Text style={styles.paragraph}>
            The service and its original content remain the property of AI Workout Builder. Workout programs generated are licensed to you for use with your clients.
          </Text>

          <Text style={styles.sectionTitle}>8. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            AI Workout Builder shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.
          </Text>

          <Text style={styles.sectionTitle}>9. Changes to Terms</Text>
          <Text style={styles.paragraph}>
            We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of modified terms.
          </Text>

          <Text style={styles.sectionTitle}>10. Contact Information</Text>
          <Text style={styles.paragraph}>
            For questions about these Terms, contact us at: support@aiworkoutbuilder.com
          </Text>

          <View style={styles.spacer} />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginLeft: 16,
    marginBottom: 8,
  },
  spacer: {
    height: 40,
  },
});
