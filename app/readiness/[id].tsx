
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';

interface Client {
  id: string;
  name: string;
}

interface ReadinessScore {
  id: string;
  date: string;
  sleepHours: number;
  stressLevel: string;
  muscleSoreness: string;
  energyLevel: string;
  score: number;
  recommendation: string;
}

export default function ReadinessScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [latestScore, setLatestScore] = useState<ReadinessScore | null>(null);
  const [history, setHistory] = useState<ReadinessScore[]>([]);
  const [addModalVisible, setAddModalVisible] = useState(false);

  const [sleepHours, setSleepHours] = useState('7');
  const [stressLevel, setStressLevel] = useState<'low' | 'medium' | 'high'>('low');
  const [muscleSoreness, setMuscleSoreness] = useState<'none' | 'mild' | 'moderate' | 'severe'>('none');
  const [energyLevel, setEnergyLevel] = useState<'low' | 'medium' | 'high'>('high');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    console.log('Fetching readiness data for client:', id);
    try {
      const { authenticatedGet } = await import('@/utils/api');
      
      const clientData = await authenticatedGet<Client>(`/api/clients/${id}`);
      setClient(clientData);

      const latestData = await authenticatedGet<ReadinessScore | null>(`/api/clients/${id}/readiness/latest`);
      console.log('[Readiness] Fetched latest score:', latestData);
      setLatestScore(latestData);

      const historyData = await authenticatedGet<ReadinessScore[]>(`/api/clients/${id}/readiness`);
      console.log('[Readiness] Fetched history:', historyData);
      setHistory(historyData);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching readiness data:', error);
      setLatestScore(null);
      setHistory([]);
      setLoading(false);
    }
  };

  const handleSubmitReadiness = async () => {
    console.log('User tapped Submit Readiness button');

    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { authenticatedPost } = await import('@/utils/api');

      const readinessData = {
        date: new Date().toISOString(),
        sleepHours: parseFloat(sleepHours),
        stressLevel,
        muscleSoreness,
        energyLevel,
      };

      console.log('[Readiness] Submitting readiness check:', readinessData);

      const result = await authenticatedPost(`/api/clients/${id}/readiness`, readinessData);
      console.log('[Readiness] Readiness score calculated:', result);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAddModalVisible(false);
      setSleepHours('7');
      setStressLevel('low');
      setMuscleSoreness('none');
      setEnergyLevel('high');
      await fetchData();
    } catch (error) {
      console.error('Error submitting readiness check:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSubmitting(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    if (score >= 40) return colors.error;
    return colors.error;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthText = monthNames[date.getMonth()];
    const dayText = date.getDate();
    return `${monthText} ${dayText}`;
  };

  const renderLevelOption = (
    value: string,
    label: string,
    currentValue: string,
    onSelect: (value: any) => void
  ) => {
    const isSelected = currentValue === value;
    const selectedColor = isSelected ? colors.primary : theme.colors.border;
    const selectedBg = isSelected ? colors.primary + '20' : 'transparent';

    return (
      <TouchableOpacity
        key={value}
        style={[styles.optionButton, { borderColor: selectedColor, backgroundColor: selectedBg }]}
        onPress={() => {
          onSelect(value);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        activeOpacity={0.7}
      >
        <Text style={[styles.optionText, { color: isSelected ? colors.primary : theme.colors.text }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Readiness Score',
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
          title: `${clientName} - Readiness`,
          presentation: 'modal',
        }}
      />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Readiness Score
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                console.log('User tapped Check Readiness button');
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

          {latestScore ? (
            <View style={[styles.scoreCard, { backgroundColor: theme.colors.card }]}>
              <View style={styles.scoreHeader}>
                <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>
                  Current Score
                </Text>
                <Text style={[styles.scoreDate, { color: colors.textSecondary }]}>
                  {formatDate(latestScore.date)}
                </Text>
              </View>
              <View style={styles.scoreCircle}>
                <Text style={[styles.scoreValue, { color: getScoreColor(latestScore.score) }]}>
                  {latestScore.score}
                </Text>
                <Text style={[styles.scoreMax, { color: colors.textSecondary }]}>
                  / 100
                </Text>
              </View>
              <View style={[styles.recommendationBox, { backgroundColor: getScoreColor(latestScore.score) + '20' }]}>
                <IconSymbol
                  ios_icon_name="lightbulb.fill"
                  android_material_icon_name="lightbulb"
                  size={20}
                  color={getScoreColor(latestScore.score)}
                />
                <Text style={[styles.recommendationText, { color: getScoreColor(latestScore.score) }]}>
                  {latestScore.recommendation}
                </Text>
              </View>
            </View>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: theme.colors.card }]}>
              <IconSymbol
                ios_icon_name="heart.fill"
                android_material_icon_name="favorite"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No readiness checks yet
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Tap the + button to check readiness
              </Text>
            </View>
          )}

          {history.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                History
              </Text>
              {history.map((item) => {
                const dateText = formatDate(item.date);
                const scoreColor = getScoreColor(item.score);
                
                return (
                  <View key={item.id} style={[styles.historyCard, { backgroundColor: theme.colors.card }]}>
                    <View style={styles.historyHeader}>
                      <Text style={[styles.historyDate, { color: theme.colors.text }]}>
                        {dateText}
                      </Text>
                      <View style={[styles.historyScore, { backgroundColor: scoreColor + '20' }]}>
                        <Text style={[styles.historyScoreText, { color: scoreColor }]}>
                          {item.score}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.historyRecommendation, { color: colors.textSecondary }]}>
                      {item.recommendation}
                    </Text>
                  </View>
                );
              })}
            </View>
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
                  Check Readiness
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
                    Sleep Hours
                  </Text>
                  <TextInput
                    style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                    placeholder="7"
                    placeholderTextColor={colors.textSecondary}
                    value={sleepHours}
                    onChangeText={setSleepHours}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                    Stress Level
                  </Text>
                  <View style={styles.optionsRow}>
                    {renderLevelOption('low', 'Low', stressLevel, setStressLevel)}
                    {renderLevelOption('medium', 'Medium', stressLevel, setStressLevel)}
                    {renderLevelOption('high', 'High', stressLevel, setStressLevel)}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                    Muscle Soreness
                  </Text>
                  <View style={styles.optionsRow}>
                    {renderLevelOption('none', 'None', muscleSoreness, setMuscleSoreness)}
                    {renderLevelOption('mild', 'Mild', muscleSoreness, setMuscleSoreness)}
                  </View>
                  <View style={styles.optionsRow}>
                    {renderLevelOption('moderate', 'Moderate', muscleSoreness, setMuscleSoreness)}
                    {renderLevelOption('severe', 'Severe', muscleSoreness, setMuscleSoreness)}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                    Energy Level
                  </Text>
                  <View style={styles.optionsRow}>
                    {renderLevelOption('low', 'Low', energyLevel, setEnergyLevel)}
                    {renderLevelOption('medium', 'Medium', energyLevel, setEnergyLevel)}
                    {renderLevelOption('high', 'High', energyLevel, setEnergyLevel)}
                  </View>
                </View>
              </ScrollView>

              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmitReadiness}
                disabled={submitting}
                activeOpacity={0.7}
              >
                {submitting ? (
                  <>
                    <ActivityIndicator color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Calculating...</Text>
                  </>
                ) : (
                  <Text style={styles.submitButtonText}>Calculate Score</Text>
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
  scoreCard: {
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  scoreDate: {
    fontSize: 14,
  },
  scoreCircle: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: 'bold',
  },
  scoreMax: {
    fontSize: 20,
  },
  recommendationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 12,
  },
  recommendationText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  emptyState: {
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginBottom: 24,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  historyCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  historyScore: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  historyScoreText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyRecommendation: {
    fontSize: 14,
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
    marginBottom: 20,
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
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  optionButton: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
