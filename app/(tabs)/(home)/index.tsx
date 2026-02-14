
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, shadows } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import ProgressRing from '@/components/ProgressRing';
import StatCard from '@/components/StatCard';

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
      setLoading(false);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchClients();
    setRefreshing(false);
  };

  const handleAddClient = () => {
    console.log('User tapped Add Client button');
    router.push('/add-client');
  };

  const handleClientPress = (clientId: string) => {
    console.log('User tapped client:', clientId);
    router.push(`/client/${clientId}`);
  };

  const getExperienceBadgeColor = (experience: string) => {
    const expLower = experience.toLowerCase();
    if (expLower === 'beginner') return colors.success;
    if (expLower === 'intermediate') return colors.warning;
    if (expLower === 'advanced') return colors.error;
    return colors.textSecondary;
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

  // Calculate stats
  const totalClients = clients.length;
  const activeClients = clients.length;
  const beginnerCount = clients.filter(c => c.experience.toLowerCase() === 'beginner').length;
  const intermediateCount = clients.filter(c => c.experience.toLowerCase() === 'intermediate').length;
  const advancedCount = clients.filter(c => c.experience.toLowerCase() === 'advanced').length;

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <IconSymbol
              ios_icon_name="person"
              android_material_icon_name="person"
              size={64}
              color={colors.textTertiary}
            />
          </View>
          <Text style={styles.emptyTitle}>Welcome to AI Workout Builder</Text>
          <Text style={styles.emptySubtitle}>
            Sign in to start creating personalized workout programs for your clients
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/auth')}
          >
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user.name || 'Trainer'}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <IconSymbol
              ios_icon_name="notifications"
              android_material_icon_name="notifications"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        {clients.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyGradient}
            >
              <IconSymbol
                ios_icon_name="group"
                android_material_icon_name="group"
                size={64}
                color="#FFFFFF"
              />
              <Text style={styles.emptyStateTitle}>No Clients Yet</Text>
              <Text style={styles.emptyStateSubtitle}>
                Add your first client to start creating AI-powered workout programs
              </Text>
            </LinearGradient>
          </View>
        ) : (
          <>
            {/* Stats Overview */}
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Overview</Text>
              <View style={styles.statsGrid}>
                <StatCard
                  title="Total Clients"
                  value={totalClients}
                  icon="group"
                  iconColor={colors.primary}
                  gradient={true}
                  style={styles.statCard}
                />
                <StatCard
                  title="Active Programs"
                  value={activeClients}
                  icon="fitness-center"
                  iconColor={colors.success}
                  style={styles.statCard}
                />
              </View>
            </View>

            {/* Experience Distribution */}
            <View style={styles.progressSection}>
              <Text style={styles.sectionTitle}>Client Experience</Text>
              <View style={styles.progressGrid}>
                <ProgressRing
                  value={beginnerCount}
                  maxValue={totalClients}
                  size={100}
                  strokeWidth={10}
                  title="Beginner"
                  subtitle={`${beginnerCount} clients`}
                  color={colors.success}
                />
                <ProgressRing
                  value={intermediateCount}
                  maxValue={totalClients}
                  size={100}
                  strokeWidth={10}
                  title="Intermediate"
                  subtitle={`${intermediateCount} clients`}
                  color={colors.warning}
                />
                <ProgressRing
                  value={advancedCount}
                  maxValue={totalClients}
                  size={100}
                  strokeWidth={10}
                  title="Advanced"
                  subtitle={`${advancedCount} clients`}
                  color={colors.error}
                />
              </View>
            </View>

            {/* Clients List */}
            <View style={styles.clientsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Your Clients</Text>
                <Text style={styles.clientCount}>{totalClients}</Text>
              </View>
              <View style={styles.clientList}>
                {clients.map((client) => {
                  const experienceColor = getExperienceBadgeColor(client.experience);
                  const goalText = formatGoal(client.goals);
                  const frequencyText = `${client.trainingFrequency}x/week`;
                  
                  return (
                    <TouchableOpacity
                      key={client.id}
                      style={styles.clientCard}
                      onPress={() => handleClientPress(client.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.clientHeader}>
                        <View style={styles.clientAvatar}>
                          <IconSymbol
                            ios_icon_name="person"
                            android_material_icon_name="person"
                            size={24}
                            color={colors.primary}
                          />
                        </View>
                        <View style={styles.clientInfo}>
                          <Text style={styles.clientName}>{client.name}</Text>
                          <View style={styles.clientMeta}>
                            <Text style={styles.clientMetaText}>{client.age}</Text>
                            <Text style={styles.clientMetaText}>•</Text>
                            <Text style={styles.clientMetaText}>{client.gender}</Text>
                          </View>
                        </View>
                        <IconSymbol
                          ios_icon_name="arrow-forward"
                          android_material_icon_name="arrow-forward"
                          size={20}
                          color={colors.textSecondary}
                        />
                      </View>
                      
                      <View style={styles.clientDetails}>
                        <View style={[styles.badge, { backgroundColor: experienceColor + '20' }]}>
                          <Text style={[styles.badgeText, { color: experienceColor }]}>
                            {client.experience}
                          </Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
                          <Text style={[styles.badgeText, { color: colors.primary }]}>
                            {goalText}
                          </Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: colors.accent + '20' }]}>
                          <Text style={[styles.badgeText, { color: colors.accent }]}>
                            {frequencyText}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddClient}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <IconSymbol
            ios_icon_name="add"
            android_material_icon_name="add"
            size={28}
            color="#FFFFFF"
          />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 48 : 20,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    minHeight: 500,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    ...shadows.medium,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  emptyStateCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
    ...shadows.large,
  },
  emptyGradient: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
  },
  progressSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  progressGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
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
  clientCount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    backgroundColor: colors.accentGlow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  clientList: {
    gap: 12,
  },
  clientCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  clientAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.accentGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  clientMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'ios' ? 100 : 90,
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    ...shadows.glow,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
