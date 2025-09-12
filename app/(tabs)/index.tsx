import { useFocusEffect } from '@react-navigation/native';
import React, { useState, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Button } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { FitbitAuth } from '@/components/FitbitAuth';
import { HeartRateTable } from '@/components/HeartRateTable';
import { ScrollView } from 'react-native';
import { UserPrompts} from '@/components/UserPrompts';
import { LocationService } from '@/components/LocationService';
import * as Location from 'expo-location';

const PPLX_API_KEY= process.env.EXPO_PUBLIC_PPLX_API_KEY;

export default function HomeScreen() {
  const [userData, setUserData] = useState<{name: string, age: string, currentMood: string | null, desiredMood: string | null} | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [heartRateData, setHeartRateData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [llmResponse, setLlmResponse] = useState('');
  const [HRsample, setHRsample] = useState(0);
  const [showHeartRateData, setShowHeartRateData] = useState(false);
  const [stepsData, setStepsData] = useState<any[]>([])
  const [locationData, setLocationData] = useState<Location.LocationObject | null>(null);


  // Reset all app state
  const resetAppState = useCallback(() => {
    setUserData(null);
    setToken(null);
    setHeartRateData([]);
    setStepsData([]);
    setShowHeartRateData(false);
    setError(null);
    setLoading(false);
    setAnalyzing(false);
    setLlmResponse('');
    setHRsample(0);
    setLocationData(null);
  }, []);

   // Reset data on Home tab focus
  useFocusEffect(
    useCallback(() => {
      console.log ('Home tab focused, resetting data');
      resetAppState();

      return () => {
        console.log('Home tab unfocused');
      }
    }, [resetAppState])
  );

  const fetchHealthData = async () => {
    if (!token) {
      console.log('No token available for API calls');
      return;
    }

    console.log('Starting health data fetch with token:', token.substring(0, 20) + '...');
    setLoading(true);
    setError(null);

    try {
      // First test with a simple profile call to verify token works
      console.log('Testing token with profile API...');
      const profileRes = await fetch('https://api.fitbit.com/1/user/-/profile.json', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-Fitbit-Client-Id': '23QLP5'
        },
      });
      
      console.log('Profile response status:', profileRes.status);
      if (!profileRes.ok) {
        const profileError = await profileRes.json();
        console.error('Profile test failed:', profileError);
        throw new Error(`Token validation failed: ${profileRes.status} - ${JSON.stringify(profileError)}`);
      }
      
      console.log('Token is valid, proceeding with health data...');
      
      // Fetch both heart rate and steps data in parallel
      const [hrRes, stepsRes] = await Promise.all([
        fetch('https://api.fitbit.com/1/user/-/activities/heart/date/today/1d.json', {
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Fitbit-Client-Id': '23QLP5'
          },
        }),
        fetch('https://api.fitbit.com/1/user/-/activities/steps/date/today/1d.json', {
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Fitbit-Client-Id': '23QLP5'
          },
        })
      ]);

      if (!hrRes.ok) {
        console.log('Heart rate fetch response not ok', hrRes.status);
        const hrError = await hrRes.json();
        console.error('Heart rate fetch error:', hrError);
        throw new Error(`Failed to fetch heart rate data: ${hrRes.status} - ${JSON.stringify(hrError)}`);
      }
      
      if (!stepsRes.ok) {
        console.log('Steps fetch response not ok', stepsRes.status);
        const stepsError = await stepsRes.json();
        console.error('Steps fetch error:', stepsError);
        throw new Error(`Failed to fetch steps data: ${stepsRes.status} - ${JSON.stringify(stepsError)}`);
      }

      const [fitbitHRData, fitbitStepsData] = await Promise.all([
        hrRes.json(),
        stepsRes.json()
      ]);

      console.log('Fetched fitbit HR data:', JSON.stringify(fitbitHRData));
      console.log('Fetched fitbit Steps data:', JSON.stringify(fitbitStepsData));

      // Process heart rate data
      const hrData = fitbitHRData['activities-heart'] || [];
      hrData.forEach((entry: any) => {
        console.log(`Date: ${entry.dateTime}, Resting HR: ${entry.value.restingHeartRate}`);
        entry.value.restingHeartRate = 120; // Your test HR value
      });

      // Process steps data
      const stepsData = fitbitStepsData['activities-steps'] || [];
      stepsData.forEach((entry: any) => {
        console.log(`Date: ${entry.dateTime}, Steps: ${entry.value}`);
        entry.value = 3000; // your test steps value
      });

      setHeartRateData(hrData);
      setStepsData(stepsData);
      setShowHeartRateData(true);
      
      console.log("Heart rate data length:", hrData.length);
      console.log("Steps data length:", stepsData.length);
      
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };


  const displayAnalyseStats = () => {
    console.log('Displaying analysis stats');
    console.log('Heart rate data length:', heartRateData.length);
    console.log('Heart rate data sample:', JSON.stringify(heartRateData.slice(0, 1)));
    console.log('Resting HR sample:', heartRateData[0]?.value?.restingHeartRate);
    console.log('Resting HR sample:', heartRateData[0].value.restingHeartRate);

  }
  const analyzeHealthDataWithLLM = useCallback(async () => {
      if (!heartRateData?.length || !stepsData?.length || !userData) {
        setError('No health data or user data to analyze.');
        return;
  }

      const sampleHR = heartRateData[0].value.restingHeartRate;
      const sampleSteps = stepsData[0].value;
      setHRsample(sampleHR);

      const locationStr = locationData ?
        `My current location is Lat: ${locationData.coords.latitude.toFixed(4)}, Lng: ${locationData.coords.longitude.toFixed(4)}.` :
        'Location data not available.';

      console.log('Analyzing health data with LLM...');
      console.log(`Using health data: ${sampleHR} BPM, ${sampleSteps.toLocaleString()} steps`);
      console.log('User data:', userData);
      console.log(locationStr);

    setError(null);
    setAnalyzing(true);

    try {
      const prompt = `Hi, I'm ${userData.name}, ${userData.age} years old. 

Current Health Status:
- Heart Rate: ${sampleHR} BPM
- Steps Today: ${sampleSteps.toLocaleString()} steps
- Location: ${locationStr}

Emotional Journey:
- Current Mood: ${userData.currentMood}
- Desired Mood: ${userData.desiredMood}

Please generate personalized, meaningful lyrics for a song that will help me transition from feeling ${userData.currentMood} to feeling ${userData.desiredMood}. Consider my health statistics (heart rate and activity level) when crafting the lyrics. The song should be motivational and therapeutic, helping me reach my desired emotional state through music. Make it personal and relatable to my current physical and emotional state. 
Keep the lyrics concise, around 200 words, and ensure they flow well together. Avoid generic phrases and focus on creating a unique piece that resonates with my situation and location. Thank you!`;

      const json_pplx = {
        "model": "sonar-pro",
        "messages": [
          {"role": "user", "content": prompt}
        ],
        "max_tokens": 300,
        "temperature": 0.8
      }

      const resp = await fetch(
        'https://api.perplexity.ai/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${PPLX_API_KEY}`
          },
          body: JSON.stringify(json_pplx)
        }
      );
      
      const respJson = await resp.json();

      // Extract the lyrics output (usually here)
      const lyrics = respJson.choices?.[0]?.message?.content;
      console.log('Generated Lyrics:', lyrics);

      const output = lyrics ;

      setLlmResponse(output || 'No response from model.');
      console.log('LLM response:', output);
    } catch (e: any) {
      console.log('Error during LLM analysis:', e);
      setError(e.message || String(e));
    } finally {
      setAnalyzing(false);
      console.log('Analysis complete');
    }
  }, [heartRateData, stepsData, userData, locationData]);

  const handleLocationChange = (location: Location.LocationObject) => {
    console.log('Location updated:', location);
    setLocationData(location);
  } 

  
  return (
    <ScrollView style={styles.container}
      contentContainerStyle={{ padding: 6, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled">

      {/* Step 1: User Prompts */}
      
      {/*Add location service*/}
      
      {userData && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Your Location</Text>
          <LocationService onLocationChange={handleLocationChange} />

          {locationData && (
            <Text style={styles.infoText}>
              Lat: {locationData.coords.latitude.toFixed(4)},
              Lng: {locationData.coords.longitude.toFixed(4)}
            </Text>
          )}
        </View>
      )}

      {!userData && (
        <UserPrompts onSubmit={(name, age, currentMood, desiredMood) => {
          console.log(`User Info - Name: ${name}, Age: ${age}, CurrentMood: ${currentMood}, DesiredMood: ${desiredMood}`);
          setUserData({ name, age, currentMood, desiredMood });
        }} />
      )}

      {/* Step 2: Fitbit Auth & Data Collection */}
      {userData && !token && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Step 2: Connect Fitbit</Text>
          <FitbitAuth onTokenChange={setToken} />
        </View>
      )}

      {userData && token && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Step 3: Get Health Data</Text>
          <TouchableOpacity style={styles.iconButton} onPress={fetchHealthData} disabled={loading || analyzing}>
            <FontAwesome name="heart" size={64} color={loading ? 'orange' : 'red'} />
          </TouchableOpacity>
          <Text style={styles.stepDescription}>Tap the heart to fetch your health data (heart rate & steps)</Text>
        </View>
      )}

      {loading && <Text style={styles.statusText}>Loading health data...</Text>}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {showHeartRateData && (heartRateData.length > 0 || stepsData.length > 0) && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Your Health Data</Text>
          {heartRateData.length > 0 && (
            <View style={styles.dataSection}>
              <Text style={styles.dataSubtitle}>Heart Rate</Text>
              <HeartRateTable data={heartRateData} />
            </View>
          )}
          {stepsData.length > 0 && (
            <View style={styles.dataSection}>
              <Text style={styles.dataSubtitle}>Steps</Text>
              {stepsData.map((entry: any, index: number) => (
                <View key={index} style={styles.stepsRow}>
                  <Text style={styles.stepsDate}>{entry.dateTime}</Text>
                  <Text style={styles.stepsValue}>{entry.value.toLocaleString()} steps</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Step 4: Generate Lyrics */}
      {userData && heartRateData.length > 0 && stepsData.length > 0 && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Step 4: Generate Personalized Lyrics</Text>
          <Button
            title={analyzing ? 'Generating Lyrics…' : 'Generate Lyrics'}
            onPress={analyzeHealthDataWithLLM} //uncomment this to call 
            disabled={analyzing || loading}
          />
        </View>
      )}

      {analyzing && <Text style={styles.statusText}>Generating personalized lyrics...</Text>}
      {!!HRsample && stepsData.length > 0 && (
        <Text style={styles.infoText}>
          Using health data: {HRsample} BPM, {stepsData[0].value.toLocaleString()} steps
        </Text>
      )}
      {!!llmResponse && (
        <View style={styles.lyricsContainer}>
          <Text style={styles.lyricsTitle}>Your Personalized Lyrics:</Text>
          <Text style={styles.lyricsText}>{llmResponse}</Text>
          <Button
            title="Start Over"
            onPress={resetAppState}
            color="#4CAF50"
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#121212' },
  iconButton: { alignItems: 'center', marginVertical: 20 },
  stepContainer: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginVertical: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    textAlign: 'center',
    marginVertical: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginVertical: 4,
  },
  lyricsContainer: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  lyricsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  lyricsText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
  },
  dataSection: {
    marginVertical: 8,
  },
  dataSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#333',
    borderRadius: 6,
    marginVertical: 2,
  },
  stepsDate: {
    fontSize: 14,
    color: '#ccc',
  },
  stepsValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
});
