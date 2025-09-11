import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';

interface LocationServiceProps {
    onLocationChange: (location: any) => void;
}

export const LocationService :React.FC<LocationServiceProps>= ({ onLocationChange }) => {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [error, setError] = useState<string | null>(null);

    const getCurrentLocation = async () => {
        try {
            // Request permission to access location
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setError('Permission to access location was denied');
                return;
            }
            // Get the current location
            const currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            setLocation(currentLocation);
            onLocationChange(currentLocation);
            setError(null);

        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    };

    useEffect(() => {
        getCurrentLocation();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
};
