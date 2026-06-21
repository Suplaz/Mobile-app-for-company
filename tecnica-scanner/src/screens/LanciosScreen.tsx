import React, { useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useStore } from '@/store/useStore';
import { T, LANCIOS } from '@/constants/data';
import { C } from '@/constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Lancios'>;

export default function LanciosScreen({ navigation }: Props) {
  const { lang } = useStore();
  const t = T[lang];
  const [search, setSearch] = useState('');

  const filtered = LANCIOS.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(l.n).includes(q) || l.m.toLowerCase().includes(q) ||
      l.comm.toLowerCase().includes(q) || l.cn.includes(q)
    );
  });

  return (
    <View style={{ flex: 1, backgroundColor: C.bgWarm }}>
      <SafeAreaView edges={['top']} style={s.safeHdr}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>‹ {t.back}</Text>
        </TouchableOpacity>
        <Text style={s.title}>{t.lanciTitle}</Text>
        <View style={s.searchBar}>
          <Text style={{ color: '#fff', fontSize: 16 }}>🔍</Text>
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder={t.lanciSearch}
            placeholderTextColor="rgba(255,255,255,.45)"
          />
        </View>
      </SafeAreaView>

      <FlatList
        data={filtered}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={s.list}
        ItemSeparatorComponent={() => <View style={{ height: 11 }} />}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={s.row}
            onPress={() => navigation.navigate('LancioDetail', { lancioIdx: LANCIOS.indexOf(item) })}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 9 }}>
                <Text style={s.lancioN}>Lancio {item.n}</Text>
                <Text style={s.comm} numberOfLines={1}>{item.comm}</Text>
              </View>
              <Text style={s.model} numberOfLines={1}>{item.m}</Text>
              <Text style={s.color}>{item.col}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.paia}>{item.pa}</Text>
              <Text style={s.paiaLbl}>{t.paiaWord ?? 'PAIA'}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  safeHdr:    { backgroundColor: C.blueDark, paddingHorizontal: 20, paddingBottom: 18 },
  backBtn:    { backgroundColor: 'rgba(255,255,255,.16)', alignSelf: 'flex-start', paddingHorizontal: 13, paddingVertical: 8, borderRadius: 8, marginTop: 8 },
  backTxt:    { color: '#fff', fontSize: 13, fontWeight: '600' },
  title:      { fontSize: 23, fontWeight: '700', color: '#fff', marginTop: 16 },
  searchBar:  { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: 'rgba(255,255,255,.13)', borderRadius: 10, padding: 11, paddingHorizontal: 13, marginTop: 14 },
  searchInput:{ flex: 1, color: '#fff', fontSize: 14, padding: 0 },
  list:       { padding: 16, paddingHorizontal: 20, paddingBottom: 30 },
  row:        { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 12 },
  lancioN:    { fontSize: 15.5, fontWeight: '700', color: C.blueDark },
  comm:       { fontSize: 10.5, color: C.textMuted, fontFamily: 'monospace', flex: 1 },
  model:      { fontSize: 14, fontWeight: '600', color: C.textPrimary, marginTop: 4 },
  color:      { fontSize: 11.5, color: C.textMuted, fontFamily: 'monospace', marginTop: 2 },
  paia:       { fontSize: 18, fontWeight: '700', color: C.orange, fontFamily: 'monospace', lineHeight: 20 },
  paiaLbl:    { fontSize: 9, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: C.textFaint, fontFamily: 'monospace', marginTop: 3 },
});
