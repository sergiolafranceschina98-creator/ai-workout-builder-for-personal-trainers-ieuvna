
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
}

export default function EditClientScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [experience, setExperience] = useState('Beginner');
  const [goal, setGoal] = useState('hypertrophy');
  const [trainingFrequency, setTrainingFrequency] = useState('3');
  const [equipment, setEquipment] = useState('commercial_gym');
  const [injuries, setInjuries] = useState('');
  const [timePerSession, setTimePerSession] = useState('60');

  useEffect(() => {
    fetchClientDetails();
  }, [id]);

  const fetchClientDetails = async () => {
    console.log('Fetching client details for editing:', id);
    try {
      const { authenticatedGet } = await import('@/utils/api');
      const data = await authenticatedGet<Client>(`/api/clients/${id}`);
      console.log('[EditClient] Fetched client:', data);

      setName(data.name);
      setAge(data.age.toString());
      setGender(data.gender);
      setHeight(data.height?.toString() || '');
      setWeight(data.weight?.toString() || '');
      setExperience(data.experience);
      setGoal(data.goals);
      setTrainingFrequency(data.trainingFrequency.toString());
      setEquipment(data.equipment);
      setInjuries(data.injuries || '');
      setTimePerSession(data.timePerSession.toString());

      setLoading(false);
    } catch (error) {
      console.error('Error fetching client details:', error);
      setErrorMessage('Failed to load client details');
      setErrorModalVisible(true);
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    console.log('User tapped Save Changes button');

    if (!name.trim()) {
      setErrorMessage('Please enter client name');
      setErrorModalVisible(true);
      return;
    }

    if (!age || parseInt(age) < 1 || parseInt(age) > 120) {
      setErrorMessage('Please enter a valid age (1-120)');
      setErrorModalVisible(true);
      return;
    }

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { authenticatedPut } = await import('@/utils/api');

      const clientData = {
        name: name.trim(),
        age: parseInt(age),
        gender,
        height: height ? parseInt(height) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        experience,
        goals: goal,
        trainingFrequency: parseInt(trainingFrequency),
        equipment,
        injuries: injuries.trim() || undefined,
        timePerSession: parseInt(timePerSession),
      };

      console.log('[EditClient] Updating client with data:', clientData);

      const result = await authenticatedPut(`/api/clients/${id}`, clientData);
      console.log('[EditClient] Client updated:', result);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error('Error updating client:', error);
      setErrorMessage('Failed to update client. Please try again.');
      setErrorModalVisible(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSaving(false);
    }
  };

  const renderGenderOption = (value: string, label: string) => {
    const isSelected = gender === value;
    const selectedColor = isSelected ? colors.primary : theme.colors.border;
    const selectedBg = isSelected ? colors.primary + '20' : 'transparent';

    return (
      <TouchableOpacity
        key={value}
        style={[styles.optionButton, { borderColor: selectedColor, backgroundColor: selectedBg }]}
        onPress={() => {
          setGender(value);
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

  const renderExperienceOption = (value: string, label: string) => {
    const isSelected = experience === value;
    const selectedColor = isSelected ? colors.primary : theme.colors.border;
    const selectedBg = isSelected ? colors.primary + '20' : 'transparent';

    return (
      <TouchableOpacity
        key={value}
        style={[styles.optionButton, { borderColor: selectedColor, backgroundColor: selectedBg }]}
        onPress={() => {
          setExperience(value);
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

  const renderGoalOption = (value: string, label: string) => {
    const isSelected = goal === value;
    const selectedColor = isSelected ? colors.primary : theme.colors.border;
    const selectedBg = isSelected ? colors.primary + '20' : 'transparent';

    return (
      <TouchableOpacity
        key={value}
        style={[styles.optionButton, { borderColor: selectedColor, backgroundColor: selectedBg }]}
        onPress={() => {
          setGoal(value);
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

  const renderEquipmentOption = (value: string, label: string) => {
    const isSelected = equipment === value;
    const selectedColor = isSelected ? colors.primary : theme.colors.border;
    const selectedBg = isSelected ? colors.primary + '20' : 'transparent';

    return (
      <TouchableOpacity
        key={value}
        style={[styles.optionButton, { borderColor: selectedColor, backgroundColor: selectedBg }]}
        onPress={() => {
          setEquipment(value);
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

  const renderTimeOption = (value: string, label: string) => {
    const isSelected = timePerSession === value;
    const selectedColor = isSelected ? colors.primary : theme.colors.border;
    const selectedBg = isSelected ? colors.primary + '20' : 'transparent';

    return (
      <TouchableOpacity
        key={value}
        style={[styles.optionButton, { borderColor: selectedColor, backgroundColor: selectedBg }]}
        onPress={() => {
          setTimePerSession(value);
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
            title: 'Edit Client',
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

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Edit Client',
          presentation: 'modal',
        }}
      />
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Name
            </Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
              placeholder="Client name"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Age
            </Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
              placeholder="Age"
              placeholderTextColor={colors.textSecondary}
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Gender
            </Text>
            <View style={styles.optionsRow}>
              {renderGenderOption('Male', 'Male')}
              {renderGenderOption('Female', 'Female')}
              {renderGenderOption('Other', 'Other')}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Height (cm)
            </Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
              placeholder="Height in cm (optional)"
              placeholderTextColor={colors.textSecondary}
              value={height}
              onChangeText={setHeight}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Weight (kg)
            </Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
              placeholder="Weight in kg (optional)"
              placeholderTextColor={colors.textSecondary}
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Experience Level
            </Text>
            <View style={styles.optionsRow}>
              {renderExperienceOption('Beginner', 'Beginner')}
              {renderExperienceOption('Intermediate', 'Intermediate')}
              {renderExperienceOption('Advanced', 'Advanced')}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Primary Goal
            </Text>
            <View style={styles.optionsColumn}>
              {renderGoalOption('fat_loss', 'Fat Loss')}
              {renderGoalOption('hypertrophy', 'Muscle Growth')}
              {renderGoalOption('strength', 'Strength')}
              {renderGoalOption('rehab', 'Rehabilitation')}
              {renderGoalOption('sport_specific', 'Sport Specific')}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Training Frequency (days/week)
            </Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
              placeholder="Days per week"
              placeholderTextColor={colors.textSecondary}
              value={trainingFrequency}
              onChangeText={setTrainingFrequency}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Available Equipment
            </Text>
            <View style={styles.optionsColumn}>
              {renderEquipmentOption('commercial_gym', 'Commercial Gym')}
              {renderEquipmentOption('home_gym', 'Home Gym')}
              {renderEquipmentOption('dumbbells_only', 'Dumbbells Only')}
              {renderEquipmentOption('bodyweight', 'Bodyweight')}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Time Per Session (minutes)
            </Text>
            <View style={styles.optionsRow}>
              {renderTimeOption('45', '45 min')}
              {renderTimeOption('60', '60 min')}
              {renderTimeOption('90', '90 min')}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Injuries or Limitations (optional)
            </Text>
            <TextInput
              style={[styles.textArea, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
              placeholder="Any injuries or limitations to consider..."
              placeholderTextColor={colors.textSecondary}
              value={injuries}
              onChangeText={setInjuries}
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, saving && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={saving}
            activeOpacity={0.7}
          >
            {saving ? (
              <>
                <ActivityIndicator color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Saving...</Text>
              </>
            ) : (
              <Text style={styles.submitButtonText}>Save Changes</Text>
            )}
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
                {errorMessage}
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
      </KeyboardAvoidingView>
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
  section: {
    marginBottom: 24,
  },
  label: {
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
    minHeight: 100,
    textAlignVertical: 'top',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionsColumn: {
    gap: 8,
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
    marginTop: 8,
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
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
