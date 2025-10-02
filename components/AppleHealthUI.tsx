import React,  { useState } from  'react';
import { View, Text, Button } from 'react-native';
import { initAppleHealth, getHeartRateSamples, getStepsSamples } from './AppleHealthAuth';
import type { HealthValue } from 'react-native-health';
import { SafeAreaView } from 'react-native-safe-area-context';

const AppleHealthShow = () => {
    const [heartRateData, setHeartRateData] = useState<HealthValue[]>([]);
    const [stepsData, setStepsData] = useState<HealthValue[]>([]);
    const [authorized, setAuthorized] = useState(false);

    const handleAuthorize = () => {
        console.log("Requesting Apple Health authorization...");
        initAppleHealth(
            // On Success 
            
            () => {
                console.log("Authorization successful. Fetching heart rate data ...");
                getHeartRateSamples(new Date(2025, 0, 1), setHeartRateData);
                console.log("Heart rate access successful. Fetching steps data ...");
                getStepsSamples(new Date(2025, 0, 1), setStepsData);

            },

            (error) => {
                alert (error);
            },  
            
            
        );
    };
    
    return (
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            {!authorized ? (
                <Button 
                    title="Authorize and Fetch Heart Rate, Steps" 
                    onPress= {async () => { 
                        await handleAuthorize();
                        setAuthorized(true);
                    }}
                />
            ) : (
                <View>
                    <Text>{JSON.stringify(heartRateData, null, 2)}</Text>
                    <Text>{JSON.stringify(stepsData, null, 2)}</Text>
                    <Text style={{ color: 'green' }}>Data fetched from Apple Health.</Text>
                </View>
            )}
        </SafeAreaView>
    );

};

export default AppleHealthShow;