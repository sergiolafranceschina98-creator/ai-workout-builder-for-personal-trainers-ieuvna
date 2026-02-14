
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

  useEffect(() => {
    fetchProgramDetails();
  }, [id]);

  const fetchProgramDetails = async () => {
    console.log('Fetching program details for:', id);
    try {
      const { authenticatedGet } = await import('@/utils/api');
      const data = await authenticatedGet<any>(`/api/programs/${id}`);
      console.log('[ProgramDetail] Fetched program:', data);
      
      // Transform the API response to match the expected Program interface
      const transformedProgram: Program = {
        id: data.id,
        weeksDuration: data.weeksDuration,
        split: data.split,
        weeks: data.programData?.weeks || [],
        clientId: data.clientId,
      };
      
      setProgram(transformedProgram);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching program details:', error);
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
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
});
