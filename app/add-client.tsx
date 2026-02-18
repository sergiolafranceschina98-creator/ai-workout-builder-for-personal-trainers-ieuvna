
import { useRouter, Stack } from 'expo-router';
import React, { useState } from 'react';
import { IconSymbol } from '@/components/IconSymbol';
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
import * as Haptics from 'expo-haptics';
import { colors } from '@/styles/commonStyles';
import { createClient } from '@/utils/localStorage';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
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
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  modalButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default function AddClientScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async () => {
    console.log('User tapped Submit button');
    
    if (!name.trim()) {
      console.log('Validation failed: Name is required');
      return;
    }

    if (!age || parseInt(age) <= 0) {
      console.log('Validation failed: Valid age is required');
      return;
    }

    try {
      setLoading(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const clientData = {
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

      console.log('Creating client with data:', clientData);
      const newClient = await createClient(clientData);
      console.log('Client created successfully:', newClient.id);

      setShowSuccessModal(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setTimeout(() => {
        setShowSuccessModal(false);
        router.back();
      }, 1500);
    } catch (error) {
      console.error('Error creating client:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
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
          {
            borderColor: isSelected ? colors.primary : theme.colors.border,
            backgroundColor: isSelected ? colors.primary + '20' : 'transparent',
          },
        ]}
        onPress={() => {
          setGender(value);
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

  const renderExperienceOption = (value: string, label: string) => {
    const isSelected = experience === value;
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
          setExperience(value);
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

  const renderGoalOption = (value: string, label: string) => {
    const isSelected = goals === value;
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
          setGoals(value);
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

  const renderEquipmentOption = (value: string, label: string) => {
    const isSelected = equipment === value;
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
          setEquipment(value);
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

  const renderTimeOption = (value: string, label: string) => {
    const isSelected = timePerSession === value;
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
          setTimePerSession(value);
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

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          title: 'New Client',
          headerBackTitle: 'Back',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
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
            {renderGenderOption('male', 'Male')}
            {renderGenderOption('female', 'Female')}
            {renderGenderOption('other', 'Other')}
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
            {renderExperienceOption('beginner', 'Beginner')}
            {renderExperienceOption('intermediate', 'Intermediate')}
            {renderExperienceOption('advanced', 'Advanced')}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Primary Goal</Text>
          <View style={styles.optionsRow}>
            {renderGoalOption('fat_loss', 'Fat Loss')}
            {renderGoalOption('hypertrophy', 'Muscle Growth')}
            {renderGoalOption('strength', 'Strength')}
            {renderGoalOption('rehab', 'Rehabilitation')}
            {renderGoalOption('sport_specific', 'Sport Performance')}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Training Frequency (days/week)</Text>
          <View style={styles.optionsRow}>
            {['2', '3', '4', '5', '6'].map((freq) => {
              const isSelected = trainingFrequency === freq;
              const freqLabel = `${freq}x`;
              return (
                <TouchableOpacity
                  key={freq}
                  style={[
                    styles.optionButton,
                    {
                      borderColor: isSelected ? colors.primary : theme.colors.border,
                      backgroundColor: isSelected ? colors.primary + '20' : 'transparent',
                    },
                  ]}
                  onPress={() => {
                    setTrainingFrequency(freq);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: isSelected ? colors.primary : theme.colors.text },
                    ]}
                  >
                    {freqLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Available Equipment</Text>
          <View style={styles.optionsRow}>
            {renderEquipmentOption('commercial_gym', 'Commercial Gym')}
            {renderEquipmentOption('home_gym', 'Home Gym')}
            {renderEquipmentOption('dumbbells_only', 'Dumbbells Only')}
            {renderEquipmentOption('bodyweight', 'Bodyweight')}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Time Per Session (minutes)</Text>
          <View style={styles.optionsRow}>
            {renderTimeOption('45', '45 min')}
            {renderTimeOption('60', '60 min')}
            {renderTimeOption('90', '90 min')}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Injuries or Limitations</Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: theme.colors.border,
                color: theme.colors.text,
                backgroundColor: theme.colors.card,
                minHeight: 80,
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
          style={[styles.submitButton, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Create Client</Text>
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
              Client created successfully
            </Text>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
