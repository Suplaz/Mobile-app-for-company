import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TONES } from '@/constants/colors';

interface Props {
  tone: keyof typeof TONES;
  label: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ tone, label, size = 'sm' }: Props) {
  const { fg, bg } = TONES[tone] ?? TONES.ok;
  return (
    <View style={[s.pill, { backgroundColor: bg }]}>
      <View style={[s.dot, { backgroundColor: fg }]} />
      <Text style={[s.text, { color: fg, fontSize: size === 'md' ? 12 : 9.5 }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  pill:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5 },
  dot:   { width: 6, height: 6, borderRadius: 3 },
  text:  { fontFamily: 'monospace', fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
});
