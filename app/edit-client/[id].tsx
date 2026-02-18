
import React, { useState, useCallback } from 'react';
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
import { useRouter, useLocalSearchParams, Stack, useFocusEffect } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';
import { getClientById, updateClient } from '@/utils/localStorage';

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
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    minWidth: '30%',
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

export default function EditClientScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [experience, setExperience] = useState('beginner');
  const [goals, setGoals] = useState('hypertrophy');
  const [trainingFrequency, setTrainingFrequency] = useState('3');
  const [equipment, setEquipment] = useState('commercial_gym');
  const [injuries, setInjuries] = useState('');
  const [timePerSession, setTimePerSession] = useState('60');

  const fetchClientDetails = useCallback(async () => {
    console.log('Fetching client details for editing:', id);
    try {
      const data = await getClientById(id);
      if (data) {
        setName(data.name);
        setAge(data.age.toString());
        setGender(data.gender);
        setHeight(data.height?.toString() || '');
        setWeight(data.weight?.toString() || '');
        setExperience(data.experience);
        setGoals(data.goals);
        setTrainingFrequency(data.trainingFrequency.toString());
        setEquipment(data.equipment);
        setInjuries(data.injuries || '');
        setTimePerSession(data.timePerSession.toString());
      }
    } catch (error) {
      console.error('Error fetching client details:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetchClientDetails();
    }, [fetchClientDetails])
  );

  const handleSubmit = async () => {
    console.log('User tapped Save Changes button');

    if (!name.trim()) {
      console.log('Validation failed: Name is required');
      return;
    }

    if (!age || parseInt(age) <= 0) {
      console.log('Validation failed: Valid age is required');
      return;
    }

    try {
      setSaving(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const updates = {
        name: name.trim(),
        age: parseInt(age),
        gender,
        height: height ? parseFloat(height) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        experience,
        goals,
        trainingFrequency: parseInt(trainingFrequency),
        equipment,
        injuries: injuries.trim() || undefined,
        timePerSession: parseInt(timePerSession),
      };

      console.log('Updating client with data:', updates);
      await updateClient(id, updates);
      console.log('Client updated successfully');

      setShowSuccessModal(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setTimeout(() => {
        setShowSuccessModal(false);
        router.back();
      }, 1500);
    } catch (error) {
      console.error('Error updating client:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSaving(false);
    }
  };

  const renderOption = (value: string, label: string, currentValue: string, setter: (value: string) => void) => {
    const isSelected = currentValue === value;
    return (
      <TouchableOpacity
        key={value}
        style={[
          styles.optionButton,
          {
            borderColor: isSelected ? colors.primary : theme.colors.border,
            backgroundColor: isSelected ? colors.primary + '20' : 'transparent',
          },
        ]}
        onPress={() => {
          setter(value);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
      >
        <Text
          style={[
            styles.optionText,
            { color: isSelected ? colors.primary : theme.colors.text },
          ]}
        >
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
            <Text style={[styles.label, { color: theme.colors.text }]}>Name *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  backgroundColor: theme.colors.card,
                },
              ]}
              value={name}
              onChangeText={setName}
              placeholder="Client name"
              placeholderTextColor={theme.colors.text + '60'}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Age *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  backgroundColor: theme.colors.card,
                },
              ]}
              value={age}
              onChangeText={setAge}
              placeholder="Age"
              keyboardType="number-pad"
              placeholderTextColor={theme.colors.text + '60'}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Gender</Text>
            <View style={styles.optionsRow}>
              {renderOption('male', 'Male', gender, setGender)}
              {renderOption('female', 'Female', gender, setGender)}
              {renderOption('other', 'Other', gender, setGender)}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Height (cm)</Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  backgroundColor: theme.colors.card,
                },
              ]}
              value={height}
              onChangeText={setHeight}
              placeholder="Height in cm"
              keyboardType="decimal-pad"
              placeholderTextColor={theme.colors.text + '60'}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Weight (kg)</Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  backgroundColor: theme.colors.card,
                },
              ]}
              value={weight}
              onChangeText={setWeight}
              placeholder="Weight in kg"
              keyboardType="decimal-pad"
              placeholderTextColor={theme.colors.text + '60'}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Experience Level</Text>
            <View style={styles.optionsRow}>
              {renderOption('beginner', 'Beginner', experience, setExperience)}
              {renderOption('intermediate', 'Intermediate', experience, setExperience)}
              {renderOption('advanced', 'Advanced', experience, setExperience)}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Primary Goal</Text>
            <View style={styles.optionsRow}>
              {renderOption('fat_loss', 'Fat Loss', goals, setGoals)}
              {renderOption('hypertrophy', 'Muscle Growth', goals, setGoals)}
              {renderOption('strength', 'Strength', goals, setGoals)}
              {renderOption('rehab', 'Rehabilitation', goals, setGoals)}
              {renderOption('sport_specific', 'Sport Performance', goals, setGoals)}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Training Frequency (days/week)</Text>
            <View style={styles.optionsRow}>
              {['2', '3', '4', '5', '6'].map((freq) => {
                const freqLabel = `${freq}x`;
                return renderOption(freq, freqLabel, trainingFrequency, setTrainingFrequency);
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Available Equipment</Text>
            <View style={styles.optionsRow}>
              {renderOption('commercial_gym', 'Commercial Gym', equipment, setEquipment)}
              {renderOption('home_gym', 'Home Gym', equipment, setEquipment)}
              {renderOption('dumbbells_only', 'Dumbbells Only', equipment, setEquipment)}
              {renderOption('bodyweight', 'Bodyweight', equipment, setEquipment)}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Time Per Session (minutes)</Text>
            <View style={styles.optionsRow}>
              {renderOption('45', '45 min', timePerSession, setTimePerSession)}
              {renderOption('60', '60 min', timePerSession, setTimePerSession)}
              {renderOption('90', '90 min', timePerSession, setTimePerSession)}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Injuries or Limitations</Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  backgroundColor: theme.colors.card,
                },
              ]}
              value={injuries}
              onChangeText={setInjuries}
              placeholder="Any injuries or limitations..."
              multiline
              placeholderTextColor={theme.colors.text + '60'}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, saving && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>

        <Modal visible={showSuccessModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check-circle"
                size={64}
                color={colors.success}
              />
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Success!</Text>
              <Text style={[styles.modalMessage, { color: theme.colors.text }]}>
                Client updated successfully
              </Text>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </>
  );
}
