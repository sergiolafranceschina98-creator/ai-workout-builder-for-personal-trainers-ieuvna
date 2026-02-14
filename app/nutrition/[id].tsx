
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
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
  goals: string;
}

interface NutritionPlan {
  id: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fats: number;
  mealSuggestions?: any; // Can be array or object from JSONB
  notes?: string;
  createdAt: string;
}

export default function NutritionScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    console.log('Fetching nutrition data for client:', id);
    try {
      const { authenticatedGet } = await import('@/utils/api');
      
      const clientData = await authenticatedGet<Client>(`/api/clients/${id}`);
      setClient(clientData);

      const nutritionData = await authenticatedGet<NutritionPlan | null>(`/api/clients/${id}/nutrition`);
      console.log('[Nutrition] Fetched nutrition plan:', nutritionData);
      setNutritionPlan(nutritionData);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
      setNutritionPlan(null);
      setLoading(false);
    }
  };

  const handleGenerateNutrition = async () => {
    console.log('User tapped Generate Nutrition Plan button');

    if (!client) return;

    setGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { authenticatedPost } = await import('@/utils/api');

      const requestData = {
        goal: client.goals,
        weight: client.weight || 70,
        height: client.height || 170,
        age: client.age,
        gender: client.gender,
        activityLevel: 'moderate',
      };

      console.log('[Nutrition] Generating nutrition plan:', requestData);

      const result = await authenticatedPost(`/api/clients/${id}/nutrition`, requestData);
      console.log('[Nutrition] Nutrition plan generated:', result);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await fetchData();
    } catch (error) {
      console.error('Error generating nutrition plan:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setGenerating(false);
    }
  };

  const formatGoal = (goal: string) => {
    const goalMap: { [key: string]: string } = {
      fat_loss: 'Fat Loss',
      hypertrophy: 'Muscle Growth',
      strength: 'Strength',
      rehab: 'Rehabilitation',
      sport_specific: 'Sport Specific',
    };
    return goalMap[goal] || goal;
  };

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Nutrition Plan',
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
  const goalText = client ? formatGoal(client.goals) : '';

  return (
    <>
      <Stack.Screen
        options={{
          title: `${clientName} - Nutrition`,
          presentation: 'modal',
        }}
      />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {!nutritionPlan ? (
            <View style={[styles.emptyState, { backgroundColor: theme.colors.card }]}>
              <IconSymbol
                ios_icon_name="leaf.fill"
                android_material_icon_name="restaurant"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                No Nutrition Plan Yet
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Generate an AI-powered nutrition plan tailored to your client&apos;s goals
              </Text>
              <TouchableOpacity
                style={[styles.generateButton, generating && styles.generateButtonDisabled]}
                onPress={handleGenerateNutrition}
                disabled={generating}
                activeOpacity={0.7}
              >
                {generating ? (
                  <>
                    <ActivityIndicator color="#FFFFFF" />
                    <Text style={styles.generateButtonText}>Generating...</Text>
                  </>
                ) : (
                  <>
                    <IconSymbol
                      ios_icon_name="sparkles"
                      android_material_icon_name="auto-awesome"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.generateButtonText}>Generate Nutrition Plan</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={[styles.header, { backgroundColor: theme.colors.card }]}>
                <IconSymbol
                  ios_icon_name="leaf.fill"
                  android_material_icon_name="restaurant"
                  size={48}
                  color={colors.primary}
                />
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                  Nutrition Plan
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                  Goal: {goalText}
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Daily Macros
                </Text>
                <View style={[styles.macrosCard, { backgroundColor: theme.colors.card }]}>
                  <View style={styles.macroItem}>
                    <View style={[styles.macroIcon, { backgroundColor: colors.primary + '20' }]}>
                      <IconSymbol
                        ios_icon_name="flame.fill"
                        android_material_icon_name="local-fire-department"
                        size={24}
                        color={colors.primary}
                      />
                    </View>
                    <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>
                      Calories
                    </Text>
                    <Text style={[styles.macroValue, { color: theme.colors.text }]}>
                      {nutritionPlan.calories}
                    </Text>
                  </View>

                  <View style={styles.macroItem}>
                    <View style={[styles.macroIcon, { backgroundColor: colors.success + '20' }]}>
                      <IconSymbol
                        ios_icon_name="p.circle.fill"
                        android_material_icon_name="fitness-center"
                        size={24}
                        color={colors.success}
                      />
                    </View>
                    <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>
                      Protein
                    </Text>
                    <Text style={[styles.macroValue, { color: theme.colors.text }]}>
                      {nutritionPlan.protein}
                    </Text>
                    <Text style={[styles.macroUnit, { color: colors.textSecondary }]}>
                      g
                    </Text>
                  </View>

                  <View style={styles.macroItem}>
                    <View style={[styles.macroIcon, { backgroundColor: colors.warning + '20' }]}>
                      <IconSymbol
                        ios_icon_name="c.circle.fill"
                        android_material_icon_name="grain"
                        size={24}
                        color={colors.warning}
                      />
                    </View>
                    <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>
                      Carbs
                    </Text>
                    <Text style={[styles.macroValue, { color: theme.colors.text }]}>
                      {nutritionPlan.carbohydrates}
                    </Text>
                    <Text style={[styles.macroUnit, { color: colors.textSecondary }]}>
                      g
                    </Text>
                  </View>

                  <View style={styles.macroItem}>
                    <View style={[styles.macroIcon, { backgroundColor: colors.error + '20' }]}>
                      <IconSymbol
                        ios_icon_name="f.circle.fill"
                        android_material_icon_name="opacity"
                        size={24}
                        color={colors.error}
                      />
                    </View>
                    <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>
                      Fats
                    </Text>
                    <Text style={[styles.macroValue, { color: theme.colors.text }]}>
                      {nutritionPlan.fats}
                    </Text>
                    <Text style={[styles.macroUnit, { color: colors.textSecondary }]}>
                      g
                    </Text>
                  </View>
                </View>
              </View>

              {nutritionPlan.mealSuggestions && Array.isArray(nutritionPlan.mealSuggestions) && nutritionPlan.mealSuggestions.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Meal Suggestions
                  </Text>
                  {nutritionPlan.mealSuggestions.map((meal: string, index: number) => {
                    const mealNumber = index + 1;
                    return (
                      <View key={index} style={[styles.mealCard, { backgroundColor: theme.colors.card }]}>
                        <View style={styles.mealHeader}>
                          <IconSymbol
                            ios_icon_name="fork.knife"
                            android_material_icon_name="restaurant-menu"
                            size={20}
                            color={colors.primary}
                          />
                          <Text style={[styles.mealTitle, { color: theme.colors.text }]}>
                            Meal {mealNumber}
                          </Text>
                        </View>
                        <Text style={[styles.mealText, { color: colors.textSecondary }]}>
                          {meal}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {nutritionPlan.notes && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Notes
                  </Text>
                  <View style={[styles.notesCard, { backgroundColor: theme.colors.card }]}>
                    <Text style={[styles.notesText, { color: colors.textSecondary }]}>
                      {nutritionPlan.notes}
                    </Text>
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[styles.regenerateButton, generating && styles.regenerateButtonDisabled]}
                onPress={handleGenerateNutrition}
                disabled={generating}
                activeOpacity={0.7}
              >
                {generating ? (
                  <>
                    <ActivityIndicator color="#FFFFFF" />
                    <Text style={styles.regenerateButtonText}>Regenerating...</Text>
                  </>
                ) : (
                  <>
                    <IconSymbol
                      ios_icon_name="arrow.clockwise"
                      android_material_icon_name="refresh"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.regenerateButtonText}>Regenerate Plan</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyState: {
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  generateButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  macrosCard: {
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  macroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  macroLabel: {
    fontSize: 16,
    flex: 1,
  },
  macroValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 4,
  },
  macroUnit: {
    fontSize: 16,
  },
  mealCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  mealText: {
    fontSize: 14,
    lineHeight: 20,
  },
  notesCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  regenerateButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  regenerateButtonDisabled: {
    opacity: 0.6,
  },
  regenerateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
