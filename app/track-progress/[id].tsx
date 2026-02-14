
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

interface WorkoutSession {
  id: string;
  sessionDate: string;
  weekNumber: number;
  dayName: string;
  completed: boolean;
  notes?: string;
  exerciseCount?: number;
}

interface Client {
  id: string;
  name: string;
}

export default function TrackProgressScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [programId, setProgramId] = useState('');
  const [weekNumber, setWeekNumber] = useState('1');
  const [dayName, setDayName] = useState('');
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    console.log('Fetching workout sessions for client:', id);
    try {
      const { authenticatedGet } = await import('@/utils/api');
      
      const clientData = await authenticatedGet<Client>(`/api/clients/${id}`);
      setClient(clientData);

      const sessionsData = await authenticatedGet<WorkoutSession[]>(`/api/clients/${id}/sessions`);
      console.log('[TrackProgress] Fetched sessions:', sessionsData);
      setSessions(sessionsData);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching workout sessions:', error);
      setSessions([]);
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    console.log('User tapped Create Session button');

    if (!dayName.trim()) {
      return;
    }

    setCreating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { authenticatedPost } = await import('@/utils/api');

      const sessionData = {
        programId: programId || 'default',
        sessionDate: new Date().toISOString(),
        weekNumber: parseInt(weekNumber),
        dayName: dayName.trim(),
        notes: notes.trim() || undefined,
      };

      console.log('[TrackProgress] Creating session:', sessionData);

      const result = await authenticatedPost(`/api/clients/${id}/sessions`, sessionData);
      console.log('[TrackProgress] Session created:', result);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAddModalVisible(false);
      setProgramId('');
      setWeekNumber('1');
      setDayName('');
      setNotes('');
      await fetchData();
    } catch (error) {
      console.error('Error creating session:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setCreating(false);
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
            title: 'Track Progress',
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

  const clientName = client?.name || 'Client';

  return (
    <>
      <Stack.Screen
        options={{
          title: `${clientName} - Progress`,
          presentation: 'modal',
        }}
      />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Workout Sessions
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                console.log('User tapped Add Session button');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setAddModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="plus"
                android_material_icon_name="add"
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>

          {sessions.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: theme.colors.card }]}>
              <IconSymbol
                ios_icon_name="chart.bar"
                android_material_icon_name="show-chart"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No workout sessions yet
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Tap the + button to log a workout
              </Text>
            </View>
          ) : (
            sessions.map((session) => {
              const dateText = formatDate(session.sessionDate);
              const exerciseCountText = session.exerciseCount && session.exerciseCount > 0 
                ? `${session.exerciseCount} exercise${session.exerciseCount > 1 ? 's' : ''}` 
                : 'No exercises logged';
              
              return (
                <TouchableOpacity
                  key={session.id}
                  style={[styles.sessionCard, { backgroundColor: theme.colors.card }]}
                  onPress={() => {
                    console.log('User tapped session:', session.id);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/session/${session.id}`);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.sessionHeader}>
                    <View style={styles.sessionInfo}>
                      <Text style={[styles.sessionDay, { color: theme.colors.text }]}>
                        {session.dayName}
                      </Text>
                      <Text style={[styles.sessionMeta, { color: colors.textSecondary }]}>
                        Week {session.weekNumber}
                      </Text>
                      <Text style={[styles.sessionMeta, { color: colors.textSecondary }]}>
                        •
                      </Text>
                      <Text style={[styles.sessionMeta, { color: colors.textSecondary }]}>
                        {dateText}
                      </Text>
                    </View>
                    {session.completed && (
                      <View style={styles.completedBadge}>
                        <IconSymbol
                          ios_icon_name="checkmark.circle.fill"
                          android_material_icon_name="check-circle"
                          size={20}
                          color={colors.success}
                        />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.sessionExercises, { color: colors.textSecondary }]}>
                    {exerciseCountText}
                  </Text>
                  {session.notes && (
                    <Text style={[styles.sessionNotes, { color: colors.textSecondary }]}>
                      {session.notes}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })
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
                  New Workout Session
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
                    Week Number
                  </Text>
                  <TextInput
                    style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                    placeholder="1"
                    placeholderTextColor={colors.textSecondary}
                    value={weekNumber}
                    onChangeText={setWeekNumber}
                    keyboardType="number-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                    Day Name
                  </Text>
                  <TextInput
                    style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                    placeholder="e.g., Push Day, Monday"
                    placeholderTextColor={colors.textSecondary}
                    value={dayName}
                    onChangeText={setDayName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                    Notes (optional)
                  </Text>
                  <TextInput
                    style={[styles.textArea, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                    placeholder="Session notes..."
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
                onPress={handleCreateSession}
                disabled={creating}
                activeOpacity={0.7}
              >
                {creating ? (
                  <>
                    <ActivityIndicator color="#FFFFFF" />
                    <Text style={styles.createButtonText}>Creating...</Text>
                  </>
                ) : (
                  <Text style={styles.createButtonText}>Create Session</Text>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  sessionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sessionInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  sessionDay: {
    fontSize: 18,
    fontWeight: '600',
  },
  sessionMeta: {
    fontSize: 14,
  },
  completedBadge: {
    marginLeft: 8,
  },
  sessionExercises: {
    fontSize: 14,
    marginBottom: 4,
  },
  sessionNotes: {
    fontSize: 14,
    fontStyle: 'italic',
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
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalScroll: {
    maxHeight: 400,
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
