import { useFocusEffect } from '@react-navigation/native';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Button } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { FitbitAuth } from '@/components/FitbitAuth';
import { HeartRateTable } from '@/components/HeartRateTable';
import { ScrollView } from 'react-native';
import { UserPrompts} from '@/components/UserPrompts';
import { LocationService } from '@/components/LocationService';
//import { AuthComponent } from '@/components/AuthComponent';
import { DatabaseService } from '@/lib/supabase';
import * as Location from 'expo-location';
import {IconButton } from 'react-native-paper'
import { Audio, AVPlaybackStatusError } from 'expo-av'
import { AVPlaybackStatus } from 'expo-av';


const PPLX_API_KEY= process.env.EXPO_PUBLIC_PPLX_API_KEY;

export default function HomeScreen() {
  const [userData, setUserData] = useState<{name: string, age: number, currentMood: string | null, desiredMood: string | null} | null>(null);
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
  const [dbService] = useState(() => new DatabaseService());
  const [savedUser, setSavedUser] = useState<any>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [songReady, setSongReady] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const [sessionID, setSessionID] = useState<string | null >(null);
  const [pollCount, setPollCount] = useState(0)
  const [canShowFeedback, setCanShowFeedback] = useState(false);


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
    setSongReady(false);
    setCanShowFeedback(false);
    setPollCount(0);
    // Don't reset location data - keep it persistent
    // setLocationData(null);
  }, []);

   // Reset data on Home tab focus - always reset when switching to home tab
  useFocusEffect(
    useCallback(() => {
      console.log ('Home tab focused, resetting to initial state');
      resetAppState();

      return () => {
        console.log('Home tab unfocused');
        if (soundRef.current) {
          soundRef.current.stopAsync();
          soundRef.current.unloadAsync();
          soundRef.current = null;
        }
      }
    }, [resetAppState])
  );

  useEffect (() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.stopAsync();
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      stopPolling();
    
    };
  }, []);

  const fetchHealthData = async ({saveToDB,sessionID} : {saveToDB?: boolean | null, sessionID?:string | null} = {}) => {
    if (!token) {
      console.log('No token available for API calls');
      return;
    }
    if (!saveToDB && !sessionID) {
      console.log("No session id and no saveToDB present")
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
      let latestHR = 
        hrData.length > 0 
        ? hrData[hrData.length -1].value.restingHeartRate
        : null;

      //mock
      latestHR = 120

      // Process steps data
      const stepsData = fitbitStepsData['activities-steps'] || [];
      stepsData.forEach((entry: any) => {
        console.log(`Date: ${entry.dateTime}, Steps: ${entry.value}`);
        entry.value = 3000; // your test steps value
      });
      let latestSteps = 
        stepsData.lentgh > 0
        ? stepsData[stepsData.length -1].value
        : null;

      //mock 
      latestSteps = 3000;

      setHeartRateData(hrData);
      setStepsData(stepsData);
      setShowHeartRateData(true);
      
      console.log("Heart rate data length:", hrData.length);
      console.log("Steps data length:", stepsData.length);

      if (saveToDB && sessionID){
        console.log("fetch and save HR and steps")
        await dbService.saveRollingHeartMeasurement(sessionID, latestHR)
        await dbService.saveRollingStepsMeasurement(sessionID, latestSteps)
      }
      
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
    console.log('Resting HR sample:', heartRateData[0]?.value?.restingHeartRate);
  }
  const analyzeHealthDataWithLLM = useCallback(async () => {
    if (!heartRateData?.length || !stepsData?.length || !userData) {
      setError('No health data or user data to analyze.');
      return;
    }

      const sampleHR = heartRateData[0].value.restingHeartRate;
      const sampleSteps = stepsData[0].value;
      setHRsample(sampleHR);

      // First save health session
      const healthSession = await dbService.saveHealthSession({
        userName: userData.name,
        userAge: userData.age,
        heartRate: sampleHR,
        steps: sampleSteps,
        locationLat: locationData?.coords.latitude,
        locationLng: locationData?.coords.longitude,
        currentMood: userData.currentMood!,
        desiredMood: userData.desiredMood!,
      });
      setSessionID(healthSession.id);

    const USE_MOCK_LYRICS = true;
    let lyrics:string;
    let song_path: string;
    
    

    const locationStr = locationData ?
      `My current location is Lat: ${locationData.coords.latitude.toFixed(4)}, Lng: ${locationData.coords.longitude.toFixed(4)}.` :
      'Location data not available.';

      console.log('Analyzing health data with LLM for test...');
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
      ${locationData ? `- Location: ${locationData.coords.latitude.toFixed(4)}, ${locationData.coords.longitude.toFixed(4)}` : ''}

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
      
      if (USE_MOCK_LYRICS) {
        lyrics = 'testing for mock lyrics';
        song_path = ''
        console.log ("Using mock lyrics for testing")
        console.log ("Using mock song for test")
        

      } else {
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
      lyrics = respJson.choices?.[0]?.message?.content;
      console.log('Generated Lyrics using LLM/API response:', lyrics);
    }

    //call play song here, after fetching the lyrics (or song in future)
    // when song is fetched with api, we will store and play (or find another mechanism)
    // for now, dummy song

    setSongReady(true);
    //playSong();
      //Save therapy response to Supabase with prompt
      
    try {
        if (lyrics && healthSession) {
          console.log("Calling DB service")
          await dbService.saveTherapyResponse(
            healthSession.id,
            prompt,
            lyrics,
            json_pplx.model
        );
      }

      const output = lyrics ;

      setLlmResponse(output || 'No response from model.');
      console.log('LLM response:', output);
    } catch (e: any) {
      console.log('Error during LLM analysis or saving response:', e);
      setError(e.message || String(e));
      } finally {
        setAnalyzing(false);
        console.log('Analysis complete');
      }
    } catch (e: any) {
      console.log('Error during LLM analysis:', e);
      setError(e.message || String(e));
    }
  }, [heartRateData, stepsData, userData, locationData, dbService]);

  const handleLocationChange = (location: Location.LocationObject) => {
    console.log('Location updated:', location);
    setLocationData(location);
  }

  // Debug: Log when location data changes
  React.useEffect(() => {
    //console.log('Location data state changed:', locationData);
  }, [locationData]); 

  const playSong = async () => {
    console.log("inside playsong")
    if (soundRef.current === null ){
      const { sound } = await Audio.Sound.createAsync(
        require('/Users/geetapuri/phd/SUTD/2025/Sep2025_Term3/Agentic-diffrhythm/src/cmd/assets/music/PTASJO_-_Renaissance.mp3') );// Use a file or a remote URL
      soundRef.current = sound;
      soundRef.current.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
      console.log("status update from setOnPlaybackStatusUpdate - ", soundRef.current.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate) )
    }  
    
    await soundRef.current.playAsync();
    startPolling();
  };

  const pauseSong = async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      stopPolling();
    }
    console.log("Paused song")
  };

  const restartSong = async () => {
    if (soundRef.current) {
      await soundRef.current.setPositionAsync(0);
      await soundRef.current.playAsync();
    }
  };

  const startPolling = () => {
    
    console.log("inside start polling")
    setPollCount(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval (() => {
      fetchHealthData({saveToDB: true, sessionID: sessionID ?? null});
      setPollCount (prev => {
        const newCount = prev +1;
        if (newCount >=3) setCanShowFeedback(true);
        return newCount;
      });
    }, 10000);
  };

  const stopPolling = () => {
    console.log("Inside stop polling")
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    console.log("Polled for ", pollCount, "times")
  }

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus)=> {
    if (status.isLoaded) {
      if (status.didJustFinish && !status.isLooping && !canShowFeedback) {
        stopPolling();
        setCanShowFeedback(true); // Always prompt when finished
      }
    } else {
      console.log("Audio playback error: ", (status as AVPlaybackStatusError).error);
    }

  
};

  return (
    <ScrollView style={styles.container}
      contentContainerStyle={{ padding: 6, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled">

      {/* Location Service - Always active */}
      <LocationService onLocationChange={handleLocationChange} />

      {/* Step 1: User Prompts */}
      {!userData && (
        <UserPrompts onSubmit={(name, age, currentMood, desiredMood) => {
          console.log(`User Info - Name: ${name}, Age: ${age}, CurrentMood: ${currentMood}, DesiredMood: ${desiredMood}`);
          setUserData({ name, age, currentMood, desiredMood });
        }} />
      )}

      {/* Location Display - Only show after user data */}
      {userData && locationData && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Your Location</Text>
          <Text style={styles.infoText}>
            Lat: {locationData.coords.latitude.toFixed(4)},
            Lng: {locationData.coords.longitude.toFixed(4)}
          </Text>
        </View>
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
          <TouchableOpacity style={styles.iconButton} onPress={() => fetchHealthData()} disabled={loading || analyzing}>
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

      {/* Step 4: Generate Lyrics or Song */}
      {userData && heartRateData.length > 0 && stepsData.length > 0 && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Step 4: Generate Personalized Song</Text>
          {!songReady && (
            <Button
              title={analyzing ? 'Generating Song…' : 'Generate Song'}
              onPress={analyzeHealthDataWithLLM} //uncomment this to call , comment so you dont waste money :D
              disabled={analyzing || loading}
            />
          )}
          {songReady && (
            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <IconButton icon="play" onPress={playSong} iconColor='green' containerColor='white' />
            <IconButton icon="pause" onPress={pauseSong} iconColor='orange' containerColor='white' />
            <IconButton icon="restart" onPress={restartSong}iconColor='blue' containerColor='white' />
          </View>

          )}

          
          <Text style={styles.statusText}>
            {songReady ? "Press the button to to play song" : "Presss Generate Song to create your personalized music"} </Text>

        </View>
      )}

      {canShowFeedback && (
        <View style={styles.infoText}>
          <Text >Step 5: How do you feel now? </Text>
          <UserPrompts
            userData = {userData}
            sessionID = {sessionID}
            onSubmitFeedback={(sessionID, mood) => dbService.saveMoodFeedback(sessionID, mood)}
            onClose = {() => setCanShowFeedback(false)}
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
