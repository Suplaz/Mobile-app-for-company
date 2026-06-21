import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useStore } from '@/store/useStore';

export default function Toast() {
  const { toast, clearToast } = useStore();
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return;
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => clearToast());
  }, [toast]);

  if (!toast) return null;

  return (
    <Animated.View style={[s.wrap, { opacity }]} pointerEvents="none">
      <View style={s.pill}>
        <Text style={s.text}>{toast}</Text>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: {
    position: 'absolute', bottom: 54, left: 0, right: 0,
    alignItems: 'center', zIndex: 90, pointerEvents: 'none',
  },
  pill: {
    backgroundColor: '#1c1f20', paddingHorizontal: 20, paddingVertical: 11,
    borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 9,
    shadowColor: '#000', shadowOpacity: 0.34, shadowRadius: 28, shadowOffset: { width: 0, height: 10 },
  },
  text: { color: '#fff', fontSize: 13.5, fontWeight: '500' },
});
