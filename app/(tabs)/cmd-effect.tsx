// src/app/(tabs)/cmd-effect.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { DatabaseService } from '@/lib/supabase';
import { FontAwesome } from '@expo/vector-icons';
import { LineChart } from "react-native-gifted-charts";

const sessionID = 'your-session-id-here';  // Replace with actual sessionID flow
const userData = {
  currentMood: 'stressed',
  desiredMood: 'relaxed'
};
const feedbackMood = 'calm';




export default function CmdEffectScreen() {
    console.log("welcome to personal analytics");
    const [dbService] = useState(() => new DatabaseService());
    const [heartRateData, setHeartRateData] = useState([]);
    const [stepsData, setStepsData] = useState([]);
    const [loading, setLoading] = useState(true);

    const dataSet = [
      {
        data: heartRateData,
        color: '#E74C3C',
        label: 'Heart Rate',
      },
      {
        data: stepsData,
        color: '#2980B9',
        label: 'Steps',
      }
    ];

    useEffect(() => {
        const fetchChartData = async () => {
            try {
                // Your async calls go here
                const heartRateRows = await dbService.getRollingHeartRate(sessionID);
                const stepsRows = await dbService.getRollingSteps(sessionID);
                
                // Format for chart
                const formattedHR = heartRateRows.map(row => ({
                    value: row.heart_rate,
                    label: new Date(row.measured_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                }));
                
                const formattedSteps = stepsRows.map(row => ({
                    value: row.steps,
                    label: new Date(row.measured_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                }));
                
                setHeartRateData(formattedHR);
                setStepsData(formattedSteps);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching chart data:', error);
                setLoading(false);
            }
        };
        
        fetchChartData();
    }, [dbService]); 

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Loading chart data...</Text>
            </View>
        );
    }

    const moodMarkers = [
      {label: 'Session Start', value: 0, mood: userData.currentMood, color: '#FFB900'},
      {label: 'Goal', value: stepsData.length - 1, mood: userData.desiredMood, color: '#44B900'},
      {label: 'Feedback', value: stepsData.length - 1, mood: feedbackMood, color: '#AA00FF'},
    ];

 
    console.log("welcome to personal analytics")
    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={styles.whiteText}>Personal Analytics</Text>
        <LineChart
          dataSet={[
            { data: heartRateData, color: '#E74C3C', label: 'Heart Rate' },
            { data: stepsData, color: '#2980B9', label: 'Steps' }
          ]}
          width={320}
          height={220}
          renderDataPointLabel={(dataPoint, index) => {
            const marker = moodMarkers.find(m => m.index === index);
            if (marker) {
              return (
                <Text style={{color: marker.color, fontWeight: 'bold', fontSize: 12}}>
                  {marker.mood}
                </Text>
              );
            }
            return null;
          }}
        />
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  whiteText: {
    color: 'white',
    fontSize: 20,
  },
});