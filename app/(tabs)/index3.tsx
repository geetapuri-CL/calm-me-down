import { useFocusEffect } from '@react-navigation/native';
import React, { useState, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Button } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { FitbitAuth } from '@/components/FitbitAuth';
import { HeartRateTable } from '@/components/HeartRateTable';

const HF_API_KEY= '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';

export default function HomeScreen() {
  const [token, setToken] = useState<string | null>(null);
  const [heartRateData, setHeartRateData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [llmResponse, setLlmResponse] = useState('');
  const [showHeartRateData, setShowHeartRateData] = useState(false); // New state variable

   // Reset data on Home tab focus
  useFocusEffect(
    useCallback(() => {
      console.log ('Home tab focused, resetting data');
      setShowHeartRateData(false);
      setHeartRateData([]);
      setError(null);
      setLoading(false);

      return () => {
        console.log('Home tab unfocused');
      }
    }, [])
  );

  const fetchHeartRate = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        'https://api.fitbit.com/1/user/-/activities/heart/date/today/1d.json',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json();
      setHeartRateData(data['activities-heart'] || []);
      setShowHeartRateData(true); // Show the table after fetching data
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  
  const analyzeHeartRateWithLLM = async () => {

    //const prompt = `Analyze the following heart rate data and provide insights:\n\n${JSON.stringify(heartRateData, null, 2)}`;
    const prompt = "Hello"
    const requestBody = {inputs: prompt};
    console.log('Request JSON: ', JSON.stringify(requestBody, null, 2));
    try {
      const response = await fetch('https://api-inference.huggingface.co/models/distilgpt2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${HF_API_KEY}`,
        },
        body: JSON.stringify(
          requestBody,
        ),
      });
      console.log ('LLM response status: ', response.status);

      const respText = await response.text();
      console.log('LLM raw response: ', respText);

      if (!response.ok) {
        console.log('LLM response not ok: ', response);
        throw new Error(`LLM request failed: ${response.status} - ${respText}`);
        
      }
      
      const result = await response.json();
      if (result.error) {
        throw new Error(`LLM error: ${result.error}`);
      }
      return result[0]?.generated_text || 'No response from LLM';
    }
    catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  };
  return (
    <View style={styles.container}>
      <FitbitAuth onTokenChange={setToken} />

      <TouchableOpacity style={styles.iconButton} onPress={fetchHeartRate} disabled={!token || loading}>
        <FontAwesome name="heart" size={64} color={token ? 'red' : 'grey'} />
      </TouchableOpacity>

      {loading && <Text>Loading heart rate data...</Text>}
      {error && <Text style={{ color: 'red' }}>{error}</Text>}

      {showHeartRateData && heartRateData.length > 0 && <HeartRateTable data={heartRateData} />}

      <Button title="Analyze with LLM" onPress= {analyzeHeartRateWithLLM} disabled={heartRateData.length === 0 } />

      {loading && <Text>Analyzing with LLM...</Text>}
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
      {llmResponse ? <Text>{llmResponse}</Text> : null}

    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#121212' },
  iconButton: { alignItems: 'center', marginVertical: 20 },
});
