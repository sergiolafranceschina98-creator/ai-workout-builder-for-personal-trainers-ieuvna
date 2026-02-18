
import { IconSymbol } from '@/components/IconSymbol';
import React, { useState, useCallback } from 'react';
import { useRouter, useLocalSearchParams, Stack, useFocusEffect } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/styles/commonStyles';
import {
  getClientById,
  getProgramsByClientId,
  deleteClient,
  deleteProgram,
  createProgram,
  Client,
  Program,
} from '@/utils/localStorage';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoGrid: {
    gap: 12,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  programCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  programTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  programMeta: {
    fontSize: 14,
    opacity: 0.6,
  },
  deleteButton: {
    padding: 8,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
    textAlign: 'center',
    paddingVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 24,
    opacity: 0.7,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default function ClientDetailScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchClientDetails = useCallback(async () => {
    try {
      console.log('Fetching client details for:', id);
      const data = await getClientById(id);
      setClient(data);
    } catch (error) {
      console.error('Error fetching client:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchClientPrograms = useCallback(async () => {
    try {
      console.log('Fetching programs for client:', id);
      const data = await getProgramsByClientId(id);
      console.log('Programs loaded:', data.length);
      setPrograms(data);
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetchClientDetails();
      fetchClientPrograms();
    }, [fetchClientDetails, fetchClientPrograms])
  );

  const handleGenerateProgram = async () => {
    if (!client) {
      console.log('No client data available');
      return;
    }

    console.log('User tapped Generate Program button');
    setGenerating(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Generate a sample program structure
      const programData = {
        split: 'Push/Pull/Legs',
        weeksDuration: 8,
        weeks: [
          {
            weekNumber: 1,
            phase: 'Hypertrophy',
            workouts: [
              {
                day: 'Push Day',
                exercises: [
                  { name: 'Bench Press', sets: 4, reps: '8-10', rest: '90', tempo: '2-0-2-0' },
                  { name: 'Overhead Press', sets: 3, reps: '10-12', rest: '60', tempo: '2-0-2-0' },
                  { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', rest: '60' },
                  { name: 'Lateral Raises', sets: 3, reps: '12-15', rest: '45' },
                  { name: 'Tricep Pushdowns', sets: 3, reps: '12-15', rest: '45' },
                ],
              },
              {
                day: 'Pull Day',
                exercises: [
                  { name: 'Deadlift', sets: 4, reps: '6-8', rest: '120', tempo: '2-0-2-0' },
                  { name: 'Pull-ups', sets: 3, reps: '8-10', rest: '90' },
                  { name: 'Barbell Rows', sets: 3, reps: '10-12', rest: '60' },
                  { name: 'Face Pulls', sets: 3, reps: '15-20', rest: '45' },
                  { name: 'Bicep Curls', sets: 3, reps: '12-15', rest: '45' },
                ],
              },
              {
                day: 'Leg Day',
                exercises: [
                  { name: 'Squats', sets: 4, reps: '8-10', rest: '120', tempo: '2-0-2-0' },
                  { name: 'Romanian Deadlifts', sets: 3, reps: '10-12', rest: '90' },
                  { name: 'Leg Press', sets: 3, reps: '12-15', rest: '60' },
                  { name: 'Leg Curls', sets: 3, reps: '12-15', rest: '45' },
                  { name: 'Calf Raises', sets: 4, reps: '15-20', rest: '45' },
                ],
              },
            ],
          },
        ],
      };

      const newProgram = await createProgram({
        clientId: id,
        weeksDuration: programData.weeksDuration,
        split: programData.split,
        programData,
      });

      console.log('Program generated successfully:', newProgram.id);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await fetchClientPrograms();
    } catch (error) {
      console.error('Error generating program:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteClient = async () => {
    console.log('User confirmed delete client');
    setShowDeleteModal(false);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      await deleteClient(id);
      console.log('Client deleted successfully');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error('Error deleting client:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const formatGoal = (goal: string): string => {
    const goalMap: Record<string, string> = {
      fat_loss: 'Fat Loss',
      hypertrophy: 'Muscle Growth',
      strength: 'Strength',
      rehab: 'Rehabilitation',
      sport_specific: 'Sport Performance',
    };
    return goalMap[goal] || goal;
  };

  const formatEquipment = (equip: string): string => {
    const equipMap: Record<string, string> = {
      commercial_gym: 'Commercial Gym',
      home_gym: 'Home Gym',
      dumbbells_only: 'Dumbbells Only',
      bodyweight: 'Bodyweight',
    };
    return equipMap[equip] || equip;
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!client) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text }}>Client not found</Text>
      </View>
    );
  }

  const goalText = formatGoal(client.goals);
  const equipmentText = formatEquipment(client.equipment);
  const frequencyText = `${client.trainingFrequency}x per week`;
  const timeText = `${client.timePerSession} minutes`;
  const heightText = client.height ? `${client.height} cm` : 'Not specified';
  const weightText = client.weight ? `${client.weight} kg` : 'Not specified';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen
        options={{
          title: client.name,
          headerBackTitle: 'Back',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Client Information</Text>
          <View style={styles.infoGrid}>
            <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
              <View>
                <Text style={[styles.infoLabel, { color: theme.colors.text }]}>Age</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{client.age} years</Text>
              </View>
              <IconSymbol ios_icon_name="person.fill" android_material_icon_name="person" size={24} color={colors.primary} />
            </View>

            <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
              <View>
                <Text style={[styles.infoLabel, { color: theme.colors.text }]}>Gender</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{client.gender}</Text>
              </View>
            </View>

            <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
              <View>
                <Text style={[styles.infoLabel, { color: theme.colors.text }]}>Height</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{heightText}</Text>
              </View>
            </View>

            <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
              <View>
                <Text style={[styles.infoLabel, { color: theme.colors.text }]}>Weight</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{weightText}</Text>
              </View>
            </View>

            <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
              <View>
                <Text style={[styles.infoLabel, { color: theme.colors.text }]}>Experience</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{client.experience}</Text>
              </View>
            </View>

            <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
              <View>
                <Text style={[styles.infoLabel, { color: theme.colors.text }]}>Goal</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{goalText}</Text>
              </View>
            </View>

            <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
              <View>
                <Text style={[styles.infoLabel, { color: theme.colors.text }]}>Training Frequency</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{frequencyText}</Text>
              </View>
            </View>

            <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
              <View>
                <Text style={[styles.infoLabel, { color: theme.colors.text }]}>Equipment</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{equipmentText}</Text>
              </View>
            </View>

            <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
              <View>
                <Text style={[styles.infoLabel, { color: theme.colors.text }]}>Session Duration</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{timeText}</Text>
              </View>
            </View>

            {client.injuries && (
              <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.infoLabel, { color: theme.colors.text }]}>Injuries/Limitations</Text>
                  <Text style={[styles.infoValue, { color: theme.colors.text }]}>{client.injuries}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleGenerateProgram}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <IconSymbol ios_icon_name="sparkles" android_material_icon_name="auto-awesome" size={20} color="#fff" />
                <Text style={[styles.actionButtonText, { color: '#fff' }]}>Generate Program</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border }]}
            onPress={() => router.push(`/edit-client/${id}`)}
          >
            <IconSymbol ios_icon_name="pencil" android_material_icon_name="edit" size={20} color={theme.colors.text} />
            <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>Edit Client</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.error + '20', borderWidth: 1, borderColor: colors.error }]}
            onPress={() => setShowDeleteModal(true)}
          >
            <IconSymbol ios_icon_name="trash" android_material_icon_name="delete" size={20} color={colors.error} />
            <Text style={[styles.actionButtonText, { color: colors.error }]}>Delete Client</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Programs</Text>
          {programs.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>
              No programs yet. Generate one to get started!
            </Text>
          ) : (
            programs.map((program) => {
              const weeksText = `${program.weeksDuration} weeks`;
              const dateText = new Date(program.createdAt).toLocaleDateString();
              
              return (
                <TouchableOpacity
                  key={program.id}
                  style={[styles.programCard, { backgroundColor: theme.colors.card }]}
                  onPress={() => router.push(`/program/${program.id}`)}
                >
                  <View style={styles.programHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.programTitle, { color: theme.colors.text }]}>
                        {program.split}
                      </Text>
                      <Text style={[styles.programMeta, { color: theme.colors.text }]}>
                        {weeksText} • Created {dateText}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={async () => {
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        await deleteProgram(program.id);
                        await fetchClientPrograms();
                      }}
                    >
                      <IconSymbol ios_icon_name="trash" android_material_icon_name="delete" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Delete Client?</Text>
            <Text style={[styles.modalMessage, { color: theme.colors.text }]}>
              This will permanently delete this client and all their programs. This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.background }]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.error }]}
                onPress={handleDeleteClient}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
