
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, shadows } from '@/styles/commonStyles';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import StatCard from '@/components/StatCard';
import { getAllClients, Client } from '@/utils/localStorage';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 24,
    gap: 12,
  },
  clientsSection: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  clientCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    ...shadows.medium,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000',
  },
  clientMeta: {
    fontSize: 14,
    opacity: 0.6,
    color: '#000',
  },
  experienceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  experienceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  clientDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
    color: '#000',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
    color: '#000',
  },
  emptySubtitle: {
    fontSize: 16,
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: 24,
    color: '#000',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f2f7',
  },
});

export default function HomeScreen() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchClients = useCallback(async () => {
    try {
      console.log('Fetching clients from local storage...');
      const data = await getAllClients();
      console.log('Clients loaded:', data.length);
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log('Home screen focused, refreshing clients...');
      fetchClients();
    }, [fetchClients])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchClients();
  }, [fetchClients]);

  const handleAddClient = () => {
    console.log('User tapped Add Client button');
    router.push('/add-client');
  };

  const handleClientPress = (clientId: string) => {
    console.log('User tapped client:', clientId);
    router.push(`/client/${clientId}`);
  };

  const getExperienceBadgeColor = (experience: string): string => {
    const exp = experience.toLowerCase();
    if (exp === 'beginner') {
      const beginnerColor = '#34C759';
      return beginnerColor;
    }
    if (exp === 'intermediate') {
      const intermediateColor = '#FF9500';
      return intermediateColor;
    }
    const advancedColor = '#FF3B30';
    return advancedColor;
  };

  const formatGoal = (goal: string): string => {
    const goalMap: Record<string, string> = {
      fat_loss: 'Fat Loss',
      hypertrophy: 'Muscle Growth',
      strength: 'Strength',
      rehab: 'Rehabilitation',
      sport_specific: 'Sport Performance',
      'Muscle Growth': 'Muscle Growth',
      'Fat Loss': 'Fat Loss',
      'Strength': 'Strength',
      'Endurance': 'Endurance',
    };
    return goalMap[goal] || goal;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const totalClients = clients.length;
  const activeClients = clients.length;
  const totalClientsText = totalClients.toString();
  const activeClientsText = activeClients.toString();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.statsContainer}>
          <StatCard
            title="Total Clients"
            value={totalClientsText}
            icon="group"
            color={colors.primary}
          />
          <StatCard
            title="Active"
            value={activeClientsText}
            icon="fitness-center"
            color={colors.success}
          />
        </View>

        <View style={styles.clientsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: '#000' }]}>Clients</Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={handleAddClient}
            >
              <IconSymbol
                ios_icon_name="plus"
                android_material_icon_name="add"
                size={18}
                color="#fff"
              />
              <Text style={[styles.addButtonText, { color: '#fff' }]}>Add Client</Text>
            </TouchableOpacity>
          </View>

          {clients.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <IconSymbol
                  ios_icon_name="person.2"
                  android_material_icon_name="group"
                  size={64}
                  color="#000"
                  style={{ opacity: 0.3 }}
                />
              </View>
              <Text style={styles.emptyTitle}>
                No Clients Yet
              </Text>
              <Text style={styles.emptySubtitle}>
                Add your first client to start creating personalized workout programs
              </Text>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                onPress={handleAddClient}
              >
                <IconSymbol
                  ios_icon_name="plus.circle.fill"
                  android_material_icon_name="add-circle"
                  size={24}
                  color="#fff"
                />
                <Text style={styles.emptyButtonText}>Add Your First Client</Text>
              </TouchableOpacity>
            </View>
          ) : (
            clients.map((client) => {
              const experienceColor = getExperienceBadgeColor(client.experience);
              const goalText = formatGoal(client.goals);
              const ageText = `${client.age} years`;
              const genderText = client.gender;
              const metaText = `${ageText} • ${genderText}`;
              const frequencyText = `${client.trainingFrequency}x/week`;
              
              return (
                <TouchableOpacity
                  key={client.id}
                  style={styles.clientCard}
                  onPress={() => handleClientPress(client.id)}
                >
                  <View style={styles.clientHeader}>
                    <View style={styles.clientInfo}>
                      <Text style={styles.clientName}>
                        {client.name}
                      </Text>
                      <Text style={styles.clientMeta}>
                        {metaText}
                      </Text>
                    </View>
                    <View style={[styles.experienceBadge, { backgroundColor: experienceColor }]}>
                      <Text style={styles.experienceBadgeText}>
                        {client.experience}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.clientDetails}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>
                        Goal
                      </Text>
                      <Text style={styles.detailValue}>
                        {goalText}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>
                        Frequency
                      </Text>
                      <Text style={styles.detailValue}>
                        {frequencyText}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}
