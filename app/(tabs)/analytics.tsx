// app/(tabs)/analytics.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { DatabaseService } from '@/lib/supabase';
import { FontAwesome } from '@expo/vector-icons';

interface AnalyticsStats {
  totalSessions: number;
  avgHeartRate: number;
  avgSteps: number;
  moodTransitions: { transition: string; count: number }[];
  recentSessions: any[];
  uniqueUsers: number;
}

export default function AnalyticsScreen() {
  const [stats, setStats] = useState<AnalyticsStats>({
    totalSessions: 0,
    avgHeartRate: 0,
    avgSteps: 0,
    moodTransitions: [],
    recentSessions: [],
    uniqueUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [dbService] = useState(() => new DatabaseService());

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading analytics data...');
      
      // Get all health sessions
      const sessions = await dbService.getAllHealthSessions();
      console.log(`Found ${sessions.length} sessions`);
      
      if (sessions.length === 0) {
        setStats({
          totalSessions: 0,
          avgHeartRate: 0,
          avgSteps: 0,
          moodTransitions: [],
          recentSessions: [],
          uniqueUsers: 0
        });
        setLoading(false);
        return;
      }

      // Calculate basic stats
      const totalSessions = sessions.length;
      const avgHeartRate = Math.round(
        sessions.reduce((sum, s) => sum + (s.heart_rate || 0), 0) / totalSessions
      );
      const avgSteps = Math.round(
        sessions.reduce((sum, s) => sum + (s.steps || 0), 0) / totalSessions
      );
      
      // Count unique users
      const uniqueUsers = new Set(sessions.map(s => s.user_name)).size;
      
      // Count mood transitions
      const moodCounts: { [key: string]: number } = {};
      sessions.forEach(session => {
        if (session.current_mood && session.desired_mood) {
          const transition = `${session.current_mood} → ${session.desired_mood}`;
          moodCounts[transition] = (moodCounts[transition] || 0) + 1;
        }
      });
      
      const moodTransitions = Object.entries(moodCounts)
        .map(([transition, count]) => ({ transition, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5

      setStats({
        totalSessions,
        avgHeartRate,
        avgSteps,
        moodTransitions,
        recentSessions: sessions.slice(0, 8), // Last 8 sessions
        uniqueUsers
      });
      
      console.log('Analytics loaded successfully');
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      setError(`Failed to load analytics: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    loadAnalytics();
  };

  if (loading && stats.totalSessions === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <FontAwesome name="spinner" size={24} color="#007AFF" />
        <Text style={styles.loadingText}>Loading Analytics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <FontAwesome name="exclamation-triangle" size={24} color="#ff6b6b" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (stats.totalSessions === 0) {
    return (
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
      >
        <View style={styles.centered}>
          <FontAwesome name="bar-chart" size={48} color="#666" />
          <Text style={styles.emptyTitle}>No Data Yet</Text>
          <Text style={styles.emptySubtitle}>
            Complete a wellness session to see your analytics here!
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Your Wellness Analytics</Text>
      
      {/* Basic Stats Cards */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <FontAwesome name="heart" size={24} color="#ff6b6b" />
          <Text style={styles.statNumber}>{stats.avgHeartRate}</Text>
          <Text style={styles.statLabel}>Avg Heart Rate</Text>
        </View>
        
        <View style={styles.statCard}>
          <FontAwesome name="street-view" size={24} color="#4CAF50" />
          <Text style={styles.statNumber}>{stats.avgSteps.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Avg Steps</Text>
        </View>
        
        <View style={styles.statCard}>
          <FontAwesome name="music" size={24} color="#9C27B0" />
          <Text style={styles.statNumber}>{stats.totalSessions}</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
        
        <View style={styles.statCard}>
          <FontAwesome name="users" size={24} color="#FF9800" />
          <Text style={styles.statNumber}>{stats.uniqueUsers}</Text>
          <Text style={styles.statLabel}>Users</Text>
        </View>
      </View>

      {/* Mood Transitions */}
      {stats.moodTransitions.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Popular Mood Transitions</Text>
          <View style={styles.section}>
            {stats.moodTransitions.map((item, index) => (
              <View key={index} style={styles.moodItem}>
                <View style={styles.moodItemLeft}>
                  <Text style={styles.moodRank}>#{index + 1}</Text>
                  <Text style={styles.moodTransition}>{item.transition}</Text>
                </View>
                <View style={styles.moodBadge}>
                  <Text style={styles.moodCount}>{item.count}</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Recent Sessions */}
      <Text style={styles.sectionTitle}>Recent Sessions</Text>
      <View style={styles.section}>
        {stats.recentSessions.map((session, index) => (
          <View key={session.id || index} style={styles.sessionItem}>
            <View style={styles.sessionHeader}>
              <Text style={styles.sessionUser}>{session.user_name}</Text>
              <Text style={styles.sessionDate}>
                {new Date(session.session_date).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.sessionDetails}>
              {session.heart_rate} BPM {session.steps?.toLocaleString()} steps
            </Text>
            <Text style={styles.sessionMood}>
              😔 {session.current_mood} → 😊 {session.desired_mood}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  loadingText: {
    color: '#007AFF',
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    color: '#ff6b6b',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 22,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    marginTop: 8,
  },
  section: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  moodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  moodItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  moodRank: {
    fontSize: 14,
    color: '#666',
    marginRight: 12,
    width: 24,
  },
  moodTransition: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  moodBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  moodCount: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  sessionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sessionUser: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  sessionDate: {
    fontSize: 12,
    color: '#ccc',
  },
  sessionDetails: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 4,
  },
  sessionMood: {
    fontSize: 14,
    color: '#4CAF50',
  },
});
