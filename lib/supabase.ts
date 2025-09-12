import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  location_lng?: number;
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


    // Health session management
    async saveHealthSession(sessionData: {
        userName: string;
        userAge: number;
        heartRate: number;
        steps: number;
        locationLat?: number;
        locationLng?: number;
        currentMood: string;
        desiredMood: string;
    }): Promise<any> {
        console.log('Attempting to save health session:', sessionData);
        
        const { data, error } = await supabase
            .from('health_sessions')
            .insert({
                user_name: sessionData.userName,
                user_age: sessionData.userAge,
                heart_rate: sessionData.heartRate,
                steps: sessionData.steps,
                location_lat: sessionData.locationLat,
                location_lng: sessionData.locationLng,
                current_mood: sessionData.currentMood,
                desired_mood: sessionData.desiredMood,
                session_date: new Date().toISOString(),
            })
            .select()
            .single();

        console.log("Insert data:", data);
        console.log("Insert error:", error);

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
        
    ) {
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
}
