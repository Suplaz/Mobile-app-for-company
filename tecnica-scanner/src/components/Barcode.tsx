import React from 'react';
import { View, StyleSheet } from 'react-native';
import { code39bars } from '@/constants/barcodes';

interface Props { value: string; height?: number }

export default function Barcode({ value, height = 32 }: Props) {
  const bars = code39bars(value);
  return (
    <View style={[s.row, { height }]}>
      {bars.map((b, i) => (
        <View
          key={i}
          style={{
            width: b.w,
            height: '100%',
            backgroundColor: b.on ? '#111' : 'transparent',
          }}
        />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'stretch' },
});
