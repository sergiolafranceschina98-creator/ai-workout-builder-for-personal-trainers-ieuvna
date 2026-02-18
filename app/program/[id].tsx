
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useLocalSearchParams, Stack, useRouter, useFocusEffect } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';
import { getProgramById, deleteProgram, Program } from '@/utils/localStorage';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  programTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  programMeta: {
    fontSize: 16,
  },
  weekSection: {
    padding: 16,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  weekTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  phaseBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  phaseText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  workoutCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workoutDay: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  exerciseRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  exerciseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  exerciseMetaText: {
    fontSize: 14,
  },
  exerciseNote: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModalContent: {
    margin: 20,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: colors.textSecondary + '30',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default function ProgramDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchProgramDetails = useCallback(async () => {
    console.log('Fetching program details for:', id);
    try {
      const data = await getProgramById(id);
      console.log('Program loaded:', data);
      setProgram(data);
    } catch (error) {
      console.error('Error fetching program:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetchProgramDetails();
    }, [fetchProgramDetails])
  );

  const handleDeleteProgram = async () => {
    console.log('User confirmed delete program:', id);
    
    if (!program?.clientId) {
      console.error('Cannot delete: clientId not found');
      return;
    }
    
    try {
      setDeleting(true);
      await deleteProgram(id);
      console.log('Program deleted successfully');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDeleteModalVisible(false);
      
      console.log('Navigating back to client:', program.clientId);
      router.replace(`/client/${program.clientId}`);
    } catch (error) {
      console.error('Error deleting program:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Workout Program',
            presentation: 'modal',
          }}
        />
        <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading program...
          </Text>
        </View>
      </>
    );
  }

  if (!program) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Workout Program',
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
            Program not found
          </Text>
        </View>
      </>
    );
  }

  const durationText = `${program.weeksDuration} weeks`;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Workout Program',
          presentation: 'modal',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => {
                console.log('User tapped delete button');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setDeleteModalVisible(true);
              }}
              style={styles.headerButton}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="trash"
                android_material_icon_name="delete"
                size={22}
                color={colors.error}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.header, { backgroundColor: theme.colors.card }]}>
            <IconSymbol
              ios_icon_name="figure.strengthtraining.traditional"
              android_material_icon_name="fitness-center"
              size={48}
              color={colors.primary}
            />
            <Text style={[styles.programTitle, { color: theme.colors.text }]}>
              {program.split}
            </Text>
            <Text style={[styles.programMeta, { color: colors.textSecondary }]}>
              {durationText}
            </Text>
          </View>

          {program.programData.weeks.map((week) => {
            const weekTitle = `Week ${week.weekNumber}`;
            const phaseText = week.phase;
            
            return (
              <View key={week.weekNumber} style={styles.weekSection}>
                <View style={styles.weekHeader}>
                  <Text style={[styles.weekTitle, { color: theme.colors.text }]}>
                    {weekTitle}
                  </Text>
                  <View style={[styles.phaseBadge, { backgroundColor: colors.accent + '20' }]}>
                    <Text style={[styles.phaseText, { color: colors.accent }]}>
                      {phaseText}
                    </Text>
                  </View>
                </View>

                {week.workouts.map((workout, workoutIndex) => (
                  <View
                    key={workoutIndex}
                    style={[styles.workoutCard, { backgroundColor: theme.colors.card }]}
                  >
                    <Text style={[styles.workoutDay, { color: theme.colors.text }]}>
                      {workout.day}
                    </Text>
                    
                    {workout.exercises.map((exercise, exerciseIndex) => {
                      const setsRepsText = `${exercise.sets} × ${exercise.reps}`;
                      const restText = `Rest: ${exercise.rest}s`;
                      const exerciseNum = exerciseIndex + 1;
                      
                      return (
                        <View key={exerciseIndex} style={styles.exerciseRow}>
                          <View style={styles.exerciseNumber}>
                            <Text style={[styles.exerciseNumberText, { color: colors.primary }]}>
                              {exerciseNum}
                            </Text>
                          </View>
                          <View style={styles.exerciseDetails}>
                            <Text style={[styles.exerciseName, { color: theme.colors.text }]}>
                              {exercise.name}
                            </Text>
                            <View style={styles.exerciseMeta}>
                              <Text style={[styles.exerciseMetaText, { color: colors.textSecondary }]}>
                                {setsRepsText}
                              </Text>
                              <Text style={[styles.exerciseMetaText, { color: colors.textSecondary }]}>
                                •
                              </Text>
                              <Text style={[styles.exerciseMetaText, { color: colors.textSecondary }]}>
                                {restText}
                              </Text>
                            </View>
                            {exercise.tempo && (
                              <Text style={[styles.exerciseNote, { color: colors.textSecondary }]}>
                                Tempo: {exercise.tempo}
                              </Text>
                            )}
                            {exercise.notes && (
                              <Text style={[styles.exerciseNote, { color: colors.textSecondary }]}>
                                {exercise.notes}
                              </Text>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>

        <Modal
          visible={deleteModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDeleteModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.confirmModalContent, { backgroundColor: theme.colors.card }]}>
              <IconSymbol
                ios_icon_name="trash"
                android_material_icon_name="delete"
                size={48}
                color={colors.error}
              />
              <Text style={[styles.confirmTitle, { color: theme.colors.text }]}>
                Delete Program?
              </Text>
              <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>
                This action cannot be undone. The program will be permanently deleted.
              </Text>
              <View style={styles.confirmButtons}>
                <TouchableOpacity
                  style={[styles.confirmButton, styles.cancelButton, { backgroundColor: theme.colors.background }]}
                  onPress={() => {
                    console.log('User cancelled delete');
                    setDeleteModalVisible(false);
                  }}
                  activeOpacity={0.7}
                  disabled={deleting}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, styles.deleteButton, { backgroundColor: colors.error }]}
                  onPress={handleDeleteProgram}
                  activeOpacity={0.7}
                  disabled={deleting}
                >
                  {deleting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.deleteButtonText}>
                      Delete
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}
