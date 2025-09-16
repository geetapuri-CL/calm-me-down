// src/app/(tabs)/cmd-effect.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { DatabaseService } from '@/lib/supabase';
import { FontAwesome } from '@expo/vector-icons';

export default function CmdEffectScreen() {
    console.log("welcome to personal analytics")
    return (
        <View style= {{  flex:1 , justifyContent: 'center', alignItems: 'center'}}>
            <Text style = {styles.whiteText}>

                Personal Analytics

            </Text>
        </View>
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