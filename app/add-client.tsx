
import React, { useState } from 'react';
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
import { useRouter, Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';

export default function AddClientScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [experience, setExperience] = useState('');
  const [goals, setGoals] = useState('');
  const [trainingFrequency, setTrainingFrequency] = useState('');
  const [equipment, setEquipment] = useState('');
  const [injuries, setInjuries] = useState('');
  const [timePerSession, setTimePerSession] = useState('');

  const handleSubmit = async () => {
    console.log('User tapped Create Client button');
    
    if (!name || !age || !gender || !experience || !goals || !trainingFrequency || !equipment || !timePerSession) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.log('Validation failed: Missing required fields');
      setErrorMessage('Please fill in all required fields');
      setErrorModalVisible(true);
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const clientData = {
        name,
        age: parseInt(age),
        gender,
        height: height ? parseInt(height) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        experience,
        goals,
        trainingFrequency: parseInt(trainingFrequency),
        equipment,
        injuries: injuries || undefined,
        timePerSession: parseInt(timePerSession),
      };

      console.log('Creating client with data:', clientData);
      
      const { authenticatedPost } = await import('@/utils/api');
      const createdClient = await authenticatedPost('/api/clients', clientData);
      console.log('[AddClient] Client created successfully:', createdClient);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error: any) {
      console.error('Error creating client:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorMessage(error?.message || 'Failed to create client. Please try again.');
      setErrorModalVisible(true);
      setLoading(false);
    }
  };

  const renderGenderOption = (value: string, label: string) => {
    const isSelected = gender === value;
    return (
      <TouchableOpacity
        key={value}
        style={[
          styles.optionButton,
          { borderColor: theme.colors.border },
          isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
        ]}
        onPress={() => {
          setGender(value);
          Haptics.selectionAsync();
        }}
        activeOpacity={0.7}
      >
        <Text style={[styles.optionText, { color: isSelected ? '#FFFFFF' : theme.colors.text }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderExperienceOption = (value: string, label: string) => {
    const isSelected = experience === value;
    return (
      <TouchableOpacity
        key={value}
        style={[
          styles.optionButton,
          { borderColor: theme.colors.border },
          isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
        ]}
        onPress={() => {
          setExperience(value);
          Haptics.selectionAsync();
        }}
        activeOpacity={0.7}
      >
        <Text style={[styles.optionText, { color: isSelected ? '#FFFFFF' : theme.colors.text }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderGoalOption = (value: string, label: string) => {
    const isSelected = goals === value;
    return (
      <TouchableOpacity
        key={value}
        style={[
          styles.optionButton,
          { borderColor: theme.colors.border },
          isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
        ]}
        onPress={() => {
          setGoals(value);
          Haptics.selectionAsync();
        }}
        activeOpacity={0.7}
      >
        <Text style={[styles.optionText, { color: isSelected ? '#FFFFFF' : theme.colors.text }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEquipmentOption = (value: string, label: string) => {
    const isSelected = equipment === value;
    return (
      <TouchableOpacity
        key={value}
        style={[
          styles.optionButton,
          { borderColor: theme.colors.border },
          isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
        ]}
        onPress={() => {
          setEquipment(value);
          Haptics.selectionAsync();
        }}
        activeOpacity={0.7}
      >
        <Text style={[styles.optionText, { color: isSelected ? '#FFFFFF' : theme.colors.text }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderTimeOption = (value: string, label: string) => {
    const isSelected = timePerSession === value;
    return (
      <TouchableOpacity
        key={value}
        style={[
          styles.optionButton,
          { borderColor: theme.colors.border },
          isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
        ]}
        onPress={() => {
          setTimePerSession(value);
          Haptics.selectionAsync();
        }}
        activeOpacity={0.7}
      >
        <Text style={[styles.optionText, { color: isSelected ? '#FFFFFF' : theme.colors.text }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'New Client',
          presentation: 'modal',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={{ color: colors.primary, fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Basic Information
            </Text>
            
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Name
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Client's full name"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.label, { color: theme.colors.text }]}>
              Age
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Age in years"
              placeholderTextColor={colors.textSecondary}
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
            />

            <Text style={[styles.label, { color: theme.colors.text }]}>
              Gender
            </Text>
            <View style={styles.optionsRow}>
              {renderGenderOption('male', 'Male')}
              {renderGenderOption('female', 'Female')}
              {renderGenderOption('other', 'Other')}
            </View>

            <Text style={[styles.label, { color: theme.colors.text }]}>
              Height (cm)
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Height in centimeters"
              placeholderTextColor={colors.textSecondary}
              value={height}
              onChangeText={setHeight}
              keyboardType="number-pad"
            />

            <Text style={[styles.label, { color: theme.colors.text }]}>
              Weight (kg)
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Weight in kilograms"
              placeholderTextColor={colors.textSecondary}
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Training Profile
            </Text>

            <Text style={[styles.label, { color: theme.colors.text }]}>
              Experience Level
            </Text>
            <View style={styles.optionsRow}>
              {renderExperienceOption('beginner', 'Beginner')}
              {renderExperienceOption('intermediate', 'Intermediate')}
              {renderExperienceOption('advanced', 'Advanced')}
            </View>

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

            <Text style={[styles.label, { color: theme.colors.text }]}>
              Training Frequency (days/week)
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="2-6 days per week"
              placeholderTextColor={colors.textSecondary}
              value={trainingFrequency}
              onChangeText={setTrainingFrequency}
              keyboardType="number-pad"
            />

            <Text style={[styles.label, { color: theme.colors.text }]}>
              Available Equipment
            </Text>
            <View style={styles.optionsColumn}>
              {renderEquipmentOption('commercial_gym', 'Commercial Gym')}
              {renderEquipmentOption('home_gym', 'Home Gym')}
              {renderEquipmentOption('dumbbells_only', 'Dumbbells Only')}
              {renderEquipmentOption('bodyweight', 'Bodyweight')}
            </View>

            <Text style={[styles.label, { color: theme.colors.text }]}>
              Time Per Session
            </Text>
            <View style={styles.optionsRow}>
              {renderTimeOption('45', '45 min')}
              {renderTimeOption('60', '60 min')}
              {renderTimeOption('90', '90 min')}
            </View>

            <Text style={[styles.label, { color: theme.colors.text }]}>
              Injuries or Limitations (Optional)
            </Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Any injuries, limitations, or exercises to avoid"
              placeholderTextColor={colors.textSecondary}
              value={injuries}
              onChangeText={setInjuries}
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.submitButtonText}>Create Client</Text>
              </>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
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
    flexWrap: 'wrap',
  },
  optionsColumn: {
    gap: 8,
  },
  optionButton: {
    flex: 1,
    minWidth: 100,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
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
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
