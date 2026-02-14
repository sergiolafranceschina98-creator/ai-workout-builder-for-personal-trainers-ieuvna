
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';

interface ExerciseLog {
  id: string;
  exerciseName: string;
  setsCompleted: number;
  repsCompleted: string;
  weightUsed: string;
  rpe?: number;
  notes?: string;
}

interface Session {
  id: string;
  sessionDate: string;
  weekNumber: number;
  dayName: string;
  completed: boolean;
  notes?: string;
  exercises?: ExerciseLog[];
}

export default function SessionDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [rpe, setRpe] = useState('');
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    fetchSessionDetails();
  }, [id]);

  const fetchSessionDetails = async () => {
    console.log('Fetching session details:', id);
    try {
      const { authenticatedGet } = await import('@/utils/api');
      
      // TODO: Backend Integration - GET /api/sessions/:sessionId → { id, sessionDate, weekNumber, dayName, completed, notes, exercises: [{ id, exerciseName, setsCompleted, repsCompleted, weightUsed, rpe, notes }] }
      const data = await authenticatedGet<Session>(`/api/sessions/${id}`);
      console.log('[SessionDetail] Fetched session:', data);
      setSession(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching session details:', error);
      setSession(null);
      setLoading(false);
    }
  };

  const handleAddExercise = async () => {
    console.log('User tapped Add Exercise button');

    if (!exerciseName.trim() || !reps.trim() || !weight.trim()) {
      return;
    }

    setCreating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { authenticatedPost } = await import('@/utils/api');

      const exerciseData = {
        exerciseName: exerciseName.trim(),
        setsCompleted: parseInt(sets),
        repsCompleted: reps.trim(),
        weightUsed: weight.trim(),
        rpe: rpe ? parseInt(rpe) : undefined,
        notes: notes.trim() || undefined,
      };

      console.log('[SessionDetail] Adding exercise:', exerciseData);

      // TODO: Backend Integration - POST /api/sessions/:sessionId/exercises with { exerciseName, setsCompleted, repsCompleted, weightUsed, rpe?, notes? } → created exercise log
      const result = await authenticatedPost(`/api/sessions/${id}/exercises`, exerciseData);
      console.log('[SessionDetail] Exercise added:', result);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAddModalVisible(false);
      setExerciseName('');
      setSets('3');
      setReps('');
      setWeight('');
      setRpe('');
      setNotes('');
      await fetchSessionDetails();
    } catch (error) {
      console.error('Error adding exercise:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setCreating(false);
    }
  };

  const handleCompleteSession = async () => {
    console.log('User tapped Complete Session button');
    setCompleting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { authenticatedPut } = await import('@/utils/api');

      // TODO: Backend Integration - PUT /api/sessions/:sessionId with { completed: true } → updated session
      const result = await authenticatedPut(`/api/sessions/${id}`, { completed: true });
      console.log('[SessionDetail] Session completed:', result);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await fetchSessionDetails();
    } catch (error) {
      console.error('Error completing session:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setCompleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthText = monthNames[date.getMonth()];
    const dayText = date.getDate();
    const yearText = date.getFullYear();
    return `${monthText} ${dayText}, ${yearText}`;
  };

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Session Details',
            presentation: 'modal',
          }}
        />
        <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading...
          </Text>
        </View>
      </>
    );
  }

  if (!session) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Session Details',
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
            Session not found
          </Text>
        </View>
      </>
    );
  }

  const dateText = formatDate(session.sessionDate);

  return (
    <>
      <Stack.Screen
        options={{
          title: session.dayName,
          presentation: 'modal',
        }}
      />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.header, { backgroundColor: theme.colors.card }]}>
            <View style={styles.headerInfo}>
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                {session.dayName}
              </Text>
              <View style={styles.headerMeta}>
                <Text style={[styles.headerMetaText, { color: colors.textSecondary }]}>
                  Week {session.weekNumber}
                </Text>
                <Text style={[styles.headerMetaText, { color: colors.textSecondary }]}>
                  •
                </Text>
                <Text style={[styles.headerMetaText, { color: colors.textSecondary }]}>
                  {dateText}
                </Text>
              </View>
            </View>
            {session.completed && (
              <View style={styles.completedBadge}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={32}
                  color={colors.success}
                />
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Exercises
              </Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  console.log('User tapped Add Exercise button');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setAddModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="plus"
                  android_material_icon_name="add"
                  size={20}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>

            {!session.exercises || session.exercises.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No exercises logged yet
                </Text>
              </View>
            ) : (
              session.exercises.map((exercise, index) => {
                const exerciseNumber = index + 1;
                const rpeText = exercise.rpe ? `RPE ${exercise.rpe}` : '';
                
                return (
                  <View key={exercise.id} style={[styles.exerciseCard, { backgroundColor: theme.colors.card }]}>
                    <View style={styles.exerciseHeader}>
                      <Text style={[styles.exerciseNumber, { color: colors.primary }]}>
                        {exerciseNumber}
                      </Text>
                      <Text style={[styles.exerciseName, { color: theme.colors.text }]}>
                        {exercise.exerciseName}
                      </Text>
                    </View>
                    <View style={styles.exerciseStats}>
                      <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                          Sets
                        </Text>
                        <Text style={[styles.statValue, { color: theme.colors.text }]}>
                          {exercise.setsCompleted}
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                          Reps
                        </Text>
                        <Text style={[styles.statValue, { color: theme.colors.text }]}>
                          {exercise.repsCompleted}
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                          Weight
                        </Text>
                        <Text style={[styles.statValue, { color: theme.colors.text }]}>
                          {exercise.weightUsed}
                        </Text>
                      </View>
                      {exercise.rpe && (
                        <View style={styles.statItem}>
                          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                            RPE
                          </Text>
                          <Text style={[styles.statValue, { color: theme.colors.text }]}>
                            {rpeText}
                          </Text>
                        </View>
                      )}
                    </View>
                    {exercise.notes && (
                      <Text style={[styles.exerciseNotes, { color: colors.textSecondary }]}>
                        {exercise.notes}
                      </Text>
                    )}
                  </View>
                );
              })
            )}
          </View>

          {!session.completed && session.exercises && session.exercises.length > 0 && (
            <TouchableOpacity
              style={[styles.completeButton, completing && styles.completeButtonDisabled]}
              onPress={handleCompleteSession}
              disabled={completing}
              activeOpacity={0.7}
            >
              {completing ? (
                <>
                  <ActivityIndicator color="#FFFFFF" />
                  <Text style={styles.completeButtonText}>Completing...</Text>
                </>
              ) : (
                <>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.completeButtonText}>Complete Session</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>

        <Modal
          visible={addModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setAddModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                  Log Exercise
                </Text>
                <TouchableOpacity
                  onPress={() => setAddModalVisible(false)}
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

              <ScrollView style={styles.modalScroll}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                    Exercise Name
                  </Text>
                  <TextInput
                    style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                    placeholder="e.g., Bench Press"
                    placeholderTextColor={colors.textSecondary}
                    value={exerciseName}
                    onChangeText={setExerciseName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                    Sets Completed
                  </Text>
                  <TextInput
                    style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                    placeholder="3"
                    placeholderTextColor={colors.textSecondary}
                    value={sets}
                    onChangeText={setSets}
                    keyboardType="number-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                    Reps (comma-separated)
                  </Text>
                  <TextInput
                    style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                    placeholder="e.g., 10,12,10"
                    placeholderTextColor={colors.textSecondary}
                    value={reps}
                    onChangeText={setReps}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                    Weight (comma-separated)
                  </Text>
                  <TextInput
                    style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                    placeholder="e.g., 135,135,140 lbs"
                    placeholderTextColor={colors.textSecondary}
                    value={weight}
                    onChangeText={setWeight}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                    RPE (1-10, optional)
                  </Text>
                  <TextInput
                    style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                    placeholder="Rate of Perceived Exertion"
                    placeholderTextColor={colors.textSecondary}
                    value={rpe}
                    onChangeText={setRpe}
                    keyboardType="number-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                    Notes (optional)
                  </Text>
                  <TextInput
                    style={[styles.textArea, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                    placeholder="Exercise notes..."
                    placeholderTextColor={colors.textSecondary}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </ScrollView>

              <TouchableOpacity
                style={[styles.createButton, creating && styles.createButtonDisabled]}
                onPress={handleAddExercise}
                disabled={creating}
                activeOpacity={0.7}
              >
                {creating ? (
                  <>
                    <ActivityIndicator color="#FFFFFF" />
                    <Text style={styles.createButtonText}>Adding...</Text>
                  </>
                ) : (
                  <Text style={styles.createButtonText}>Add Exercise</Text>
                )}
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerMetaText: {
    fontSize: 14,
  },
  completedBadge: {
    marginLeft: 12,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  exerciseCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  exerciseNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  exerciseStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  exerciseNotes: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
  },
  completeButton: {
    backgroundColor: colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 8,
    gap: 8,
  },
  completeButtonDisabled: {
    opacity: 0.6,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalScroll: {
    maxHeight: 500,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  createButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
