
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
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
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
  const theme = useTheme();
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

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.emptyContainer}>
          <IconSymbol
            ios_icon_name="person.crop.circle.badge.exclamationmark"
            android_material_icon_name="error"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>
            Please sign in to view your clients
          </Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => router.push('/auth')}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading clients...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {clients.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol
              ios_icon_name="person.2.slash"
              android_material_icon_name="group"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              No Clients Yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Add your first client to start creating personalized workout programs
            </Text>
          </View>
        ) : (
          <View style={styles.clientList}>
            {clients.map((client) => {
              const experienceColor = getExperienceBadgeColor(client.experience);
              const goalText = formatGoal(client.goals);
              const frequencyText = `${client.trainingFrequency}x/week`;
              
              return (
                <TouchableOpacity
                  key={client.id}
                  style={[styles.clientCard, { backgroundColor: theme.colors.card }]}
                  onPress={() => handleClientPress(client.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.clientHeader}>
                    <View style={styles.clientAvatar}>
                      <IconSymbol
                        ios_icon_name="person.fill"
                        android_material_icon_name="person"
                        size={24}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.clientInfo}>
                      <Text style={[styles.clientName, { color: theme.colors.text }]}>
                        {client.name}
                      </Text>
                      <View style={styles.clientMeta}>
                        <Text style={[styles.clientMetaText, { color: colors.textSecondary }]}>
                          {client.age}
                        </Text>
                        <Text style={[styles.clientMetaText, { color: colors.textSecondary }]}>
                          •
                        </Text>
                        <Text style={[styles.clientMetaText, { color: colors.textSecondary }]}>
                          {client.gender}
                        </Text>
                      </View>
                    </View>
                    <IconSymbol
                      ios_icon_name="chevron.right"
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
                    <View style={[styles.badge, { backgroundColor: colors.secondary + '20' }]}>
                      <Text style={[styles.badgeText, { color: colors.secondary }]}>
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

      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddClient}
        activeOpacity={0.8}
      >
        <IconSymbol
          ios_icon_name="plus"
          android_material_icon_name="add"
          size={28}
          color="#FFFFFF"
        />
      </TouchableOpacity>
    </View>
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
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    minHeight: 400,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
  },
  signInButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  clientList: {
    gap: 12,
  },
  clientCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  clientMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clientMetaText: {
    fontSize: 14,
  },
  clientDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'ios' ? 100 : 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
