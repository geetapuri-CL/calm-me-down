import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type HeartRateEntry = {
  dateTime: string;
  value: {
    restingHeartRate: number;
    heartRateZones: Array<{ name: string; min: number; max: number }>;
  };
};

export function HeartRateTable({ data }: { data: HeartRateEntry[] }) {
  const renderItem = ({ item }: { item: HeartRateEntry }) => (
    <View style={styles.row}>
      <Text style={styles.cell}>{item.dateTime}</Text>
      <Text style={styles.cell}>{item.value.restingHeartRate ?? 'N/A'}</Text>
      <View style={[styles.cell, { flex: 2 }]}>
        {item.value.heartRateZones?.map((zone, idx) => (
          <Text key={idx}>
            {zone.name}: {zone.min} - {zone.max} bpm
          </Text>
        ))}
      </View>
    </View>
  );

  return (
    <View>
      <View style={[styles.row, styles.header]}>
        <Text style={styles.headerCell}>Date</Text>
        <Text style={styles.headerCell}>Resting HR</Text>
        <Text style={[styles.headerCell, { flex: 2 }]}>Heart Rate Zones</Text>
      </View>
      {data.map((item, index) => (
        <View key={item.dateTime || index}>
          {renderItem({ item })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#ccc' },
  cell: { flex: 1, textAlign: 'center', backgroundColor: '#f0f0f0' },
  header: { backgroundColor: '#f0f0f0' },
  headerCell: { flex: 1, fontWeight: 'bold', textAlign: 'center' },
});
