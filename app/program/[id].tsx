
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';

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
}

export default function ProgramDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);

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
      };
      
      setProgram(transformedProgram);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching program details:', error);
      setProgram(null);
      setLoading(false);
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
});
