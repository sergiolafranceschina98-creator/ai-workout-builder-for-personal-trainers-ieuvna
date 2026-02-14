
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import ProgressRing from '@/components/ProgressRing';
import StatCard from '@/components/StatCard';
import { colors, shadows } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';

interface Client {
  id: string;
  name: string;
  age: number;
  gender: string;
  experience: string;
  goals: string;
  trainingFrequency: number;
  createdAt: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchClients = async () => {
    console.log('Fetching clients for trainer');
    try {
      const { authenticatedGet } = await import('@/utils/api');
      const data = await authenticatedGet<Client[]>('/api/clients');
      console.log('[Home] Fetched clients:', data);
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      console.log('[Home] Screen focused - refreshing client list');
      if (user) {
        fetchClients();
      }
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchClients();
  };

  const handleAddClient = () => {
    console.log('User tapped Add Client button');
    router.push('/add-client');
  };

  const handleClientPress = (clientId: string) => {
    console.log('User tapped client card:', clientId);
    router.push(`/client/${clientId}`);
  };

  const getExperienceBadgeColor = (experience: string) => {
    const exp = experience.toLowerCase();
    if (exp === 'beginner') return colors.success;
    if (exp === 'intermediate') return colors.accent;
    if (exp === 'advanced') return colors.error;
    return colors.textSecondary;
  };

  const formatGoal = (goal: string) => {
    const goalMap: Record<string, string> = {
      'fat_loss': 'Fat Loss',
      'hypertrophy': 'Muscle Growth',
      'strength': 'Strength',
      'rehab': 'Rehabilitation',
      'sport_specific': 'Sport Performance',
    };
    return goalMap[goal] || goal;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>
          Loading clients...
        </Text>
      </View>
    );
  }

  const totalClients = clients.length;
  const activePrograms = 0;
  const completionRate = 0;

  const userName = user?.name || 'Trainer';
  const greetingText = `Welcome back, ${userName}!`;
  const subtitleText = 'Manage your clients and programs';

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <LinearGradient
          colors={[colors.primary, colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.greeting}>
                {greetingText}
              </Text>
              <Text style={styles.subtitle}>
                {subtitleText}
              </Text>
            </View>
            <View style={styles.headerIcon}>
              <IconSymbol
                ios_icon_name="figure.strengthtraining.traditional"
                android_material_icon_name="fitness-center"
                size={48}
                color="#FFFFFF"
              />
            </View>
          </View>
        </LinearGradient>

        <View style={styles.statsContainer}>
          <StatCard
            title="Total Clients"
            value={totalClients.toString()}
            icon="person"
            color={colors.primary}
          />
          <StatCard
            title="Active Programs"
            value={activePrograms.toString()}
            icon="description"
            color={colors.accent}
          />
          <StatCard
            title="Completion Rate"
            value={`${completionRate}%`}
            icon="check-circle"
            color={colors.success}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Your Clients
          </Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={handleAddClient}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="plus"
              android_material_icon_name="add"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.addButtonText}>
              Add Client
            </Text>
          </TouchableOpacity>
        </View>

        {clients.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="person.crop.circle.badge.plus"
              android_material_icon_name="person-add"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyTitle}>
              No Clients Yet
            </Text>
            <Text style={styles.emptySubtitle}>
              Add your first client to start creating personalized workout programs
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              onPress={handleAddClient}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="plus.circle.fill"
                android_material_icon_name="add-circle"
                size={24}
                color="#FFFFFF"
              />
              <Text style={styles.emptyButtonText}>
                Add Your First Client
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.clientsList}>
            {clients.map((client) => {
              const experienceColor = getExperienceBadgeColor(client.experience);
              const goalText = formatGoal(client.goals);
              const frequencyText = `${client.trainingFrequency}x/week`;
              const experienceText = client.experience;
              
              return (
                <TouchableOpacity
                  key={client.id}
                  style={[styles.clientCard, shadows.medium]}
                  onPress={() => handleClientPress(client.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.clientHeader}>
                    <View style={[styles.clientAvatar, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={[styles.clientInitial, { color: colors.primary }]}>
                        {client.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.clientInfo}>
                      <Text style={styles.clientName}>
                        {client.name}
                      </Text>
                      <View style={styles.clientMeta}>
                        <Text style={styles.clientMetaText}>
                          {client.age} yrs
                        </Text>
                        <Text style={styles.clientMetaText}>
                          •
                        </Text>
                        <Text style={styles.clientMetaText}>
                          {client.gender}
                        </Text>
                      </View>
                    </View>
                    <IconSymbol
                      ios_icon_name="chevron.right"
                      android_material_icon_name="chevron-right"
                      size={24}
                      color={colors.textSecondary}
                    />
                  </View>
                  <View style={styles.clientDetails}>
                    <View style={[styles.badge, { backgroundColor: experienceColor + '20' }]}>
                      <Text style={[styles.badgeText, { color: experienceColor }]}>
                        {experienceText}
                      </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: colors.accent + '20' }]}>
                      <Text style={[styles.badgeText, { color: colors.accent }]}>
                        {goalText}
                      </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={[styles.badgeText, { color: colors.primary }]}>
                        {frequencyText}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#1C1C1E',
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1C1C1E',
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
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#1C1C1E',
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    color: colors.textSecondary,
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  clientsList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  clientCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 4,
    backgroundColor: '#FFFFFF',
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clientInitial: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#1C1C1E',
  },
  clientMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clientMetaText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  clientDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
