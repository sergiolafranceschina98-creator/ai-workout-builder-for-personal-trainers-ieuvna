
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';

interface Client {
  id: string;
  name: string;
  age: number;
  gender: string;
  height?: number;
  weight?: number;
  experience: string;
  goals: string;
  trainingFrequency: number;
  equipment: string;
  injuries?: string;
  timePerSession: number;
  createdAt: string;
}

interface Program {
  id: string;
  weeksDuration: number;
  split: string;
  createdAt: string;
}

export default function ClientDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [client, setClient] = useState<Client | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  useEffect(() => {
    fetchClientDetails();
    fetchClientPrograms();
  }, [id]);

  const fetchClientDetails = async () => {
    console.log('Fetching client details for:', id);
    try {
      const { authenticatedGet } = await import('@/utils/api');
      const data = await authenticatedGet<Client>(`/api/clients/${id}`);
      console.log('[ClientDetail] Fetched client:', data);
      setClient(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching client details:', error);
      setClient(null);
      setLoading(false);
    }
  };

  const fetchClientPrograms = async () => {
    console.log('Fetching programs for client:', id);
    try {
      const { authenticatedGet } = await import('@/utils/api');
      const data = await authenticatedGet<Program[]>(`/api/programs/client/${id}`);
      console.log('[ClientDetail] Fetched programs:', data);
      setPrograms(data);
    } catch (error) {
      console.error('Error fetching programs:', error);
      setPrograms([]);
    }
  };

  const handleGenerateProgram = async () => {
    console.log('User tapped Generate Program button');
    setGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { authenticatedPost } = await import('@/utils/api');
      const result = await authenticatedPost('/api/programs/generate', { clientId: id });
      console.log('[ClientDetail] Program generated:', result);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await fetchClientPrograms();
      setGenerating(false);
    } catch (error) {
      console.error('Error generating program:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setGenerating(false);
    }
  };

  const handleDeleteClient = async () => {
    console.log('User confirmed delete client');
    setDeleteModalVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const { authenticatedDelete } = await import('@/utils/api');
      const result = await authenticatedDelete(`/api/clients/${id}`);
      console.log('[ClientDetail] Client deleted:', result);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error('Error deleting client:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const formatGoal = (goal: string) => {
    const goalMap: { [key: string]: string } = {
      fat_loss: 'Fat Loss',
      hypertrophy: 'Muscle Growth',
      strength: 'Strength',
      rehab: 'Rehabilitation',
      sport_specific: 'Sport Specific',
    };
    return goalMap[goal] || goal;
  };

  const formatEquipment = (equip: string) => {
    const equipMap: { [key: string]: string } = {
      commercial_gym: 'Commercial Gym',
      home_gym: 'Home Gym',
      dumbbells_only: 'Dumbbells Only',
      bodyweight: 'Bodyweight',
    };
    return equipMap[equip] || equip;
  };

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Client Details',
            presentation: 'modal',
          }}
        />
        <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading client...
          </Text>
        </View>
      </>
    );
  }

  if (!client) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Client Details',
            presentation: 'modal',
          }}
        />
        <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.background }]}>
          <IconSymbol
            ios_icon_name="exclamationmark.triangle"
            android_material_icon_name="error"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            Client not found
          </Text>
        </View>
      </>
    );
  }

  const goalText = formatGoal(client.goals);
  const equipmentText = formatEquipment(client.equipment);
  const heightText = client.height ? `${client.height} cm` : 'Not specified';
  const weightText = client.weight ? `${client.weight} kg` : 'Not specified';

  return (
    <>
      <Stack.Screen
        options={{
          title: client.name,
          presentation: 'modal',
        }}
      />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.header, { backgroundColor: theme.colors.card }]}>
            <View style={styles.avatarLarge}>
              <IconSymbol
                ios_icon_name="person.fill"
                android_material_icon_name="person"
                size={48}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.clientName, { color: theme.colors.text }]}>
              {client.name}
            </Text>
            <View style={styles.clientMetaRow}>
              <Text style={[styles.clientMetaItem, { color: colors.textSecondary }]}>
                {client.age}
              </Text>
              <Text style={[styles.clientMetaItem, { color: colors.textSecondary }]}>
                •
              </Text>
              <Text style={[styles.clientMetaItem, { color: colors.textSecondary }]}>
                {client.gender}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Physical Stats
            </Text>
            <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Height
                  </Text>
                  <Text style={[styles.statValue, { color: theme.colors.text }]}>
                    {heightText}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Weight
                  </Text>
                  <Text style={[styles.statValue, { color: theme.colors.text }]}>
                    {weightText}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Training Profile
            </Text>
            <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Experience
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {client.experience}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Goal
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {goalText}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Frequency
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {client.trainingFrequency}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Equipment
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {equipmentText}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Session Time
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {client.timePerSession}
                </Text>
              </View>
              {client.injuries && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    Injuries
                  </Text>
                  <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                    {client.injuries}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Workout Programs
            </Text>
            {programs.length === 0 ? (
              <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.emptyProgramText, { color: colors.textSecondary }]}>
                  No programs generated yet
                </Text>
              </View>
            ) : (
              programs.map((program) => (
                <TouchableOpacity
                  key={program.id}
                  style={[styles.programCard, { backgroundColor: theme.colors.card }]}
                  onPress={() => router.push(`/program/${program.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.programInfo}>
                    <Text style={[styles.programTitle, { color: theme.colors.text }]}>
                      {program.split}
                    </Text>
                    <Text style={[styles.programMeta, { color: colors.textSecondary }]}>
                      {program.weeksDuration}
                    </Text>
                  </View>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="arrow-forward"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              ))
            )}
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                console.log('User tapped Edit Profile button');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push(`/edit-client/${id}`);
              }}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="pencil"
                android_material_icon_name="edit"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.actionButtonText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                console.log('User tapped Track Progress button');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push(`/track-progress/${id}`);
              }}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="chart.bar.fill"
                android_material_icon_name="show-chart"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.actionButtonText}>Track Progress</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                console.log('User tapped Nutrition button');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push(`/nutrition/${id}`);
              }}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="leaf.fill"
                android_material_icon_name="restaurant"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.actionButtonText}>Nutrition</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                console.log('User tapped Readiness button');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push(`/readiness/${id}`);
              }}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="heart.fill"
                android_material_icon_name="favorite"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.actionButtonText}>Readiness</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.generateButton, generating && styles.generateButtonDisabled]}
            onPress={handleGenerateProgram}
            disabled={generating}
            activeOpacity={0.7}
          >
            {generating ? (
              <>
                <ActivityIndicator color="#FFFFFF" />
                <Text style={styles.generateButtonText}>Generating...</Text>
              </>
            ) : (
              <>
                <IconSymbol
                  ios_icon_name="sparkles"
                  android_material_icon_name="auto-awesome"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.generateButtonText}>Generate AI Program</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setDeleteModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="trash.fill"
              android_material_icon_name="delete"
              size={20}
              color={colors.error}
            />
            <Text style={[styles.deleteButtonText, { color: colors.error }]}>
              Delete Client
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <Modal
          visible={deleteModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDeleteModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Delete Client?
              </Text>
              <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
                This will permanently delete this client and all their workout programs. This action cannot be undone.
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel, { borderColor: theme.colors.border }]}
                  onPress={() => setDeleteModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonDelete]}
                  onPress={handleDeleteClient}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  clientName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  clientMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clientMetaItem: {
    fontSize: 16,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyProgramText: {
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 16,
  },
  programCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  programInfo: {
    flex: 1,
  },
  programTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  programMeta: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  generateButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 8,
    gap: 8,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  deleteButtonText: {
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    borderWidth: 1,
  },
  modalButtonDelete: {
    backgroundColor: colors.error,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
