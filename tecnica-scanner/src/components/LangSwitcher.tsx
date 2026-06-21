import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useStore } from '@/store/useStore';
import { Lang } from '@/constants/data';

const LANGS: Lang[] = ['en', 'hu', 'it'];

interface Props { dark?: boolean }

export default function LangSwitcher({ dark }: Props) {
  const { lang, setLang } = useStore();
  return (
    <View style={s.row}>
      {LANGS.map((l) => {
        const active = l === lang;
        return (
          <TouchableOpacity
            key={l}
            onPress={() => setLang(l)}
            style={[
              s.btn,
              dark
                ? active ? s.activeDark : s.inactiveDark
                : active ? s.activeLight : s.inactiveLight,
            ]}
          >
            <Text style={[s.label, { color: active ? (dark ? '#fff' : '#fff') : (dark ? 'rgba(255,255,255,.55)' : '#8A9092') }]}>
              {l.toUpperCase()}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row:           { flexDirection: 'row', gap: 5 },
  btn:           { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 7 },
  activeLight:   { backgroundColor: '#004063', borderWidth: 1, borderColor: '#004063' },
  inactiveLight: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#D8D8D2' },
  activeDark:    { backgroundColor: 'rgba(255,255,255,.22)', borderWidth: 1, borderColor: 'rgba(255,255,255,.3)' },
  inactiveDark:  { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,.2)' },
  label:         { fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },
});
