
import React, { useState, useEffect } from 'react';
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
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  tempo?: string;
  notes?: string;
}

interface Workout {
  day: string;
  exercises: Exercise[];
}

interface Week {
  weekNumber: number;
  phase: string;
  workouts: Workout[];
}

interface Program {
  id: string;
  weeksDuration: number;
  split: string;
  weeks: Week[];
  clientId?: string;
}

interface ExerciseAlternative {
  name: string;
  muscleGroup: string;
  equipment: string;
  difficulty: string;
  reason: string;
}

export default function ProgramDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [swapModalVisible, setSwapModalVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [alternatives, setAlternatives] = useState<ExerciseAlternative[]>([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchProgramDetails();
  }, [id]);

  const fetchProgramDetails = async () => {
    console.log('[ProgramDetail] Fetching program details for:', id);
    try {
      const { authenticatedGet } = await import('@/utils/api');
      const data = await authenticatedGet<any>(`/api/programs/${id}`);
      console.log('[ProgramDetail] Fetched program:', data);
      console.log('[ProgramDetail] programData:', data.programData);
      console.log('[ProgramDetail] programData type:', typeof data.programData);
      
      // Backend now returns programData as a parsed object, but handle string fallback for compatibility
      let programData = data.programData;
      if (typeof programData === 'string') {
        try {
          programData = JSON.parse(programData);
          console.log('[ProgramDetail] Parsed programData from string (legacy):', programData);
        } catch (parseError) {
          console.error('[ProgramDetail] Failed to parse programData:', parseError);
          programData = { weeks: [] };
        }
      }
      
      // Validate programData structure
      if (!programData || typeof programData !== 'object') {
        console.error('[ProgramDetail] Invalid programData structure:', programData);
        programData = { weeks: [] };
      }
      
      // Transform the API response to match the expected Program interface
      const transformedProgram: Program = {
        id: data.id,
        weeksDuration: data.weeksDuration,
        split: data.split,
        weeks: Array.isArray(programData.weeks) ? programData.weeks : [],
        clientId: data.clientId,
      };
      
      console.log('[ProgramDetail] Transformed program:', {
        id: transformedProgram.id,
        weeksDuration: transformedProgram.weeksDuration,
        split: transformedProgram.split,
        weeksCount: transformedProgram.weeks.length,
        hasWorkouts: transformedProgram.weeks.length > 0 && transformedProgram.weeks[0].workouts?.length > 0,
      });
      
      setProgram(transformedProgram);
      setLoading(false);
    } catch (error) {
      console.error('[ProgramDetail] Error fetching program details:', error);
      setProgram(null);
      setLoading(false);
    }
  };

  const handleSwapExercise = async (exercise: Exercise) => {
    console.log('User tapped Swap Exercise button for:', exercise.name);
    setSelectedExercise(exercise);
    setSwapModalVisible(true);
    setLoadingAlternatives(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { authenticatedPost } = await import('@/utils/api');

      const swapRequest = {
        originalExerciseName: exercise.name,
        clientId: program?.clientId || '',
        muscleGroup: '',
        equipment: '',
        injuries: '',
      };

      console.log('[ProgramDetail] Requesting exercise alternatives:', swapRequest);

      const result = await authenticatedPost<{ alternatives: ExerciseAlternative[] }>('/api/exercises/swap', swapRequest);
      console.log('[ProgramDetail] Received alternatives:', result);

      setAlternatives(result.alternatives || []);
      setLoadingAlternatives(false);
    } catch (error) {
      console.error('Error fetching exercise alternatives:', error);
      setAlternatives([]);
      setLoadingAlternatives(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleDeleteProgram = async () => {
    console.log('User confirmed delete program:', id);
    try {
      setDeleting(true);
      const { authenticatedDelete } = await import('@/utils/api');
      await authenticatedDelete(`/api/programs/${id}`);
      console.log('[ProgramDetail] Program deleted successfully');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDeleteModalVisible(false);
      router.back();
    } catch (error: any) {
      console.error('[ProgramDetail] Error deleting program:', error);
      setErrorMessage(error.message || 'Failed to delete program.');
      setErrorModalVisible(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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

  // Check if program has no weeks (empty program data)
  if (program.weeks.length === 0) {
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
        <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.background }]}>
          <IconSymbol
            ios_icon_name="exclamationmark.triangle"
            android_material_icon_name="warning"
            size={64}
            color={colors.accent}
          />
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            Program Data Not Available
          </Text>
          <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>
            This program was generated but the workout data could not be loaded.
          </Text>
          <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>
            This may have been caused by a temporary issue during generation.
          </Text>
          <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>
            Please try generating a new program for this client.
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>

          {/* Delete Confirmation Modal */}
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
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Error Modal */}
          <Modal
            visible={errorModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setErrorModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.confirmModalContent, { backgroundColor: theme.colors.card }]}>
                <IconSymbol
                  ios_icon_name="exclamationmark.triangle"
                  android_material_icon_name="error"
                  size={48}
                  color={colors.error}
                />
                <Text style={[styles.confirmTitle, { color: theme.colors.text }]}>
                  Error
                </Text>
                <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>
                  {errorMessage}
                </Text>
                <TouchableOpacity
                  style={[styles.confirmButton, styles.cancelButton, { backgroundColor: theme.colors.background }]}
                  onPress={() => setErrorModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>
                    OK
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
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

          {program.weeks.map((week) => {
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
                      const restText = `Rest: ${exercise.rest}`;
                      
                      return (
                        <View key={exerciseIndex} style={styles.exerciseRow}>
                          <View style={styles.exerciseNumber}>
                            <Text style={[styles.exerciseNumberText, { color: colors.primary }]}>
                              {exerciseIndex + 1}
                            </Text>
                          </View>
                          <View style={styles.exerciseDetails}>
                            <View style={styles.exerciseHeader}>
                              <Text style={[styles.exerciseName, { color: theme.colors.text }]}>
                                {exercise.name}
                              </Text>
                              <TouchableOpacity
                                style={styles.swapButton}
                                onPress={() => handleSwapExercise(exercise)}
                                activeOpacity={0.7}
                              >
                                <IconSymbol
                                  ios_icon_name="arrow.2.squarepath"
                                  android_material_icon_name="swap-horiz"
                                  size={18}
                                  color={colors.primary}
                                />
                              </TouchableOpacity>
                            </View>
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

        {/* Exercise Swap Modal */}
        <Modal
          visible={swapModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setSwapModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <IconSymbol
                    ios_icon_name="arrow.2.squarepath"
                    android_material_icon_name="swap-horiz"
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                    Exercise Alternatives
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSwapModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    ios_icon_name="xmark"
                    android_material_icon_name="close"
                    size={24}
                    color={theme.colors.text}
                  />
                </TouchableOpacity>
              </View>

              {selectedExercise && (
                <View style={styles.originalExercise}>
                  <Text style={[styles.originalLabel, { color: colors.textSecondary }]}>
                    Original Exercise
                  </Text>
                  <Text style={[styles.originalName, { color: theme.colors.text }]}>
                    {selectedExercise.name}
                  </Text>
                </View>
              )}

              <ScrollView style={styles.alternativesScroll}>
                {loadingAlternatives ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: theme.colors.text }]}>
                      Finding alternatives...
                    </Text>
                  </View>
                ) : alternatives.length === 0 ? (
                  <View style={styles.emptyAlternatives}>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      No alternatives found
                    </Text>
                  </View>
                ) : (
                  alternatives.map((alt, index) => {
                    const altNumber = index + 1;
                    
                    return (
                      <View key={index} style={[styles.alternativeCard, { backgroundColor: theme.colors.background }]}>
                        <View style={styles.alternativeHeader}>
                          <View style={styles.alternativeNumber}>
                            <Text style={[styles.alternativeNumberText, { color: colors.primary }]}>
                              {altNumber}
                            </Text>
                          </View>
                          <Text style={[styles.alternativeName, { color: theme.colors.text }]}>
                            {alt.name}
                          </Text>
                        </View>
                        <View style={styles.alternativeDetails}>
                          <View style={styles.alternativeTag}>
                            <IconSymbol
                              ios_icon_name="figure.strengthtraining.traditional"
                              android_material_icon_name="fitness-center"
                              size={14}
                              color={colors.primary}
                            />
                            <Text style={[styles.alternativeTagText, { color: colors.textSecondary }]}>
                              {alt.muscleGroup}
                            </Text>
                          </View>
                          <View style={styles.alternativeTag}>
                            <IconSymbol
                              ios_icon_name="dumbbell.fill"
                              android_material_icon_name="sports-gymnastics"
                              size={14}
                              color={colors.primary}
                            />
                            <Text style={[styles.alternativeTagText, { color: colors.textSecondary }]}>
                              {alt.equipment}
                            </Text>
                          </View>
                          <View style={styles.alternativeTag}>
                            <IconSymbol
                              ios_icon_name="chart.bar.fill"
                              android_material_icon_name="show-chart"
                              size={14}
                              color={colors.primary}
                            />
                            <Text style={[styles.alternativeTagText, { color: colors.textSecondary }]}>
                              {alt.difficulty}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.alternativeReason, { color: colors.textSecondary }]}>
                          {alt.reason}
                        </Text>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Delete Confirmation Modal */}
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
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Error Modal */}
        <Modal
          visible={errorModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setErrorModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.confirmModalContent, { backgroundColor: theme.colors.card }]}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle"
                android_material_icon_name="error"
                size={48}
                color={colors.error}
              />
              <Text style={[styles.confirmTitle, { color: theme.colors.text }]}>
                Error
              </Text>
              <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>
                {errorMessage}
              </Text>
              <TouchableOpacity
                style={[styles.confirmButton, styles.cancelButton, { backgroundColor: theme.colors.background }]}
                onPress={() => setErrorModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>
                  OK
                </Text>
              </TouchableOpacity>
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
    fontWeight: '600',
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  backButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
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
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  swapButton: {
    padding: 4,
    marginLeft: 8,
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
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  originalExercise: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.textSecondary + '30',
  },
  originalLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  originalName: {
    fontSize: 18,
    fontWeight: '600',
  },
  alternativesScroll: {
    maxHeight: 500,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyAlternatives: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
  },
  alternativeCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  alternativeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  alternativeNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alternativeNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  alternativeName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  alternativeDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  alternativeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
  },
  alternativeTagText: {
    fontSize: 12,
  },
  alternativeReason: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
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
});
