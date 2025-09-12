import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Health specific types
export interface User {
  id: string;
  name: string;
  age: number;
  created_at: string;
}

export interface HealthSession {
  id: string;
  user_id: string;
  heart_rate: number;
  steps: number;
  location_lat?: number;
  location_lon?: number;
  current_mood: string;
  desired_mood: string;
  session_date: string;
}

export interface TherapyResponse {
  id: string;
  session_id: string;
  prompt_used: string;
  generated_lyrics: string;
  model_used: string;
  effectiveness_rating?: number;
  created_at: string;
}

export class DatabaseService {
    // User management
    async createOrUpdateUser(userData: { name: string; age: number }): Promise<User | null> {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            throw new Error('User not authenticated');
        }

        const { data, error } = await supabase
            .from('users')
            .upsert({
                id: user.id,
                name: userData.name,
                age: userData.age,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating/updating user:', error);
            throw error;
        }

        return data;
    }

    // Health session management
    async saveHealthSession(sessionData: {
        heartRate: number;
        steps: number;
        locationLat?: number;
        locationLon?: number;
        currentMood: string;
        desiredMood: string;
    }): Promise<HealthSession | null> {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            throw new Error('User not authenticated');
        }

        const { data, error } = await supabase
            .from('health_sessions')
            .insert({
                user_id: user.id,
                heart_rate: sessionData.heartRate,
                steps: sessionData.steps,
                location_lat: sessionData.locationLat,
                location_lon: sessionData.locationLon,
                current_mood: sessionData.currentMood,
                desired_mood: sessionData.desiredMood,
                session_date: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving health session:', error);
            throw error;
        }

        return data;
    }

    async saveTherapyResponse(
        sessionId: string,
        promptUsed: string,
        generatedLyrics: string,
        modelUsed: string = 'sonar-pro',
    ): Promise<TherapyResponse | null> {
        const { data, error } = await supabase
            .from('therapy_responses')
            .insert({
                session_id: sessionId,
                prompt_used: promptUsed,
                generated_lyrics: generatedLyrics,
                model_used: modelUsed,
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving therapy response:', error);
            throw error;
        }

        return data;
    }

    // Get prompts that worked well for specific moods
  async getSuccessfulPrompts(currentMood: string, desiredMood: string) {
    const { data, error } = await supabase
      .from('therapy_responses')
      .select(`
        prompt_used,
        effectiveness_rating,
        health_sessions!inner(current_mood, desired_mood)
      `)
      .eq('health_sessions.current_mood', currentMood)
      .eq('health_sessions.desired_mood', desiredMood)
      .gte('effectiveness_rating', 4)  // Only high-rated prompts
      .order('effectiveness_rating', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  // Authentication methods
  async signUp(email: string, password: string, userData: { name: string; age: number }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });

    if (error) {
      console.error('Error signing up:', error);
      throw error;
    }

    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Error signing in:', error);
      throw error;
    }

    return data;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting current user:', error);
      throw error;
    }

    return user;
  }

  // Session state management
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}