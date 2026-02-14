
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [errorModalVisible, setErrorModalVisible] = useState(false);

  const handleSignOut = async () => {
    console.log('User tapped Sign Out button');
    try {
      await signOut();
      console.log('User signed out successfully');
      router.replace('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      setErrorModalVisible(true);
    }
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContent}>
          <IconSymbol
            ios_icon_name="person.crop.circle.badge.exclamationmark"
            android_material_icon_name="error"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>
            Please sign in to view your profile
          </Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => router.push('/auth')}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const userName = user.name || user.email || 'Trainer';
  const userEmail = user.email || '';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <IconSymbol
              ios_icon_name="person.fill"
              android_material_icon_name="person"
              size={48}
              color="#FFFFFF"
            />
          </View>
          <Text style={[styles.userName, { color: theme.colors.text }]}>
            {userName}
          </Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
            {userEmail}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            About
          </Text>
          <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <View style={styles.infoRow}>
              <IconSymbol
                ios_icon_name="dumbbell.fill"
                android_material_icon_name="fitness-center"
                size={24}
                color={colors.primary}
              />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Role
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  Personal Trainer
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            App Info
          </Text>
          <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <View style={styles.infoRow}>
              <IconSymbol
                ios_icon_name="info.circle.fill"
                android_material_icon_name="info"
                size={24}
                color={colors.secondary}
              />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Version
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  1.0.0
                </Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <IconSymbol
            ios_icon_name="arrow.right.square.fill"
            android_material_icon_name="exit-to-app"
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={errorModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="error"
              size={48}
              color={colors.error}
            />
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Error
            </Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              Failed to sign out. Please try again.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setErrorModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoContent: {
    marginLeft: 16,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  signInButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  signOutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
