
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useRouter, useLocalSearchParams, Stack, useFocusEffect } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';
import {
  getClientById,
  getNutritionByClientId,
  createNutritionPlan,
  Client,
  NutritionPlan,
} from '@/utils/localStorage';

export default function NutritionScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null);

  const fetchData = useCallback(async () => {
    console.log('Fetching nutrition data for client:', id);
    try {
      const clientData = await getClientById(id);
      setClient(clientData);

      const nutritionData = await getNutritionByClientId(id);
      console.log('[Nutrition] Fetched nutrition plan:', nutritionData);
      setNutritionPlan(nutritionData);
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
      setNutritionPlan(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleGenerateNutrition = async () => {
    console.log('User tapped Generate Nutrition Plan button');

    if (!client) {
      console.log('No client data available');
      return;
    }

    setGenerating(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Calculate basic macros based on client data
      const weight = client.weight || 70;
      const height = client.height || 170;
      const age = client.age;
      
      // Basic BMR calculation (Mifflin-St Jeor)
      const bmr = client.gender === 'male'
        ? 10 * weight + 6.25 * height - 5 * age + 5
        : 10 * weight + 6.25 * height - 5 * age - 161;
      
      // Activity multiplier (moderate activity)
      const activityMultiplier = 1.55;
      let calories = Math.round(bmr * activityMultiplier);
      
      // Adjust based on goal
      const goal = client.goals.toLowerCase();
      if (goal.includes('fat') || goal.includes('loss')) {
        calories = Math.round(calories * 0.85); // 15% deficit
      } else if (goal.includes('hypertrophy') || goal.includes('muscle')) {
        calories = Math.round(calories * 1.1); // 10% surplus
      }
      
      // Calculate macros
      const proteinGrams = Math.round(weight * 2.2); // 2.2g per kg
      const fatGrams = Math.round(weight * 1); // 1g per kg
      const proteinCals = proteinGrams * 4;
      const fatCals = fatGrams * 9;
      const carbCals = calories - proteinCals - fatCals;
      const carbGrams = Math.round(carbCals / 4);
      
      // Generate meal suggestions
      const mealSuggestions = [
        'Breakfast: Oatmeal with protein powder, berries, and almonds',
        'Lunch: Grilled chicken breast with brown rice and vegetables',
        'Snack: Greek yogurt with honey and mixed nuts',
        'Dinner: Salmon with sweet potato and broccoli',
        'Post-workout: Protein shake with banana',
      ];
      
      const notes = `This nutrition plan is tailored for ${client.goals.toLowerCase()}. Adjust portions based on hunger and energy levels. Stay hydrated with at least 2-3 liters of water daily.`;

      const newPlan = await createNutritionPlan({
        clientId: id,
        calories,
        protein: proteinGrams,
        carbohydrates: carbGrams,
        fats: fatGrams,
        mealSuggestions,
        notes,
      });

      console.log('Nutrition plan generated successfully:', newPlan.id);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await fetchData();
    } catch (error) {
      console.error('Error generating nutrition plan:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
                Generate a nutrition plan tailored to your client&apos;s goals
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
