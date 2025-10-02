import React,  { useState } from  'react';
import { View, Text, Button } from 'react-native';
import { initAppleHealth, getHeartRateSamples } from './AppleHealthAuth';
import type { HealthValue } from 'react-native-health';
import { SafeAreaView } from 'react-native-safe-area-context';

const AppleHealthShow = () => {
    const [heartRateData, setHeartRateData] = useState<HealthValue[]>([]);
    const [authorized, setAuthorized] = useState(false);

    const handleAuthorize = () => {
        console.log("Requesting Apple Health authorization...");
        initAppleHealth(
            
            () => getHeartRateSamples(new Date(2025, 0, 1), setHeartRateData),
            (error) => {
                alert (error);
            }
        );
    };
    
    return (
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            {!authorized ? (
                <Button 
                    title="Authorize and Fetch Heart Rate" 
                    onPress= {async () => { 
                        await handleAuthorize();
                        setAuthorized(true);
                    }}
                />
            ) : (
                <Text>{JSON.stringify(heartRateData, null, 2)}</Text>
            )}
        </SafeAreaView>
    );

};

export default AppleHealthShow;