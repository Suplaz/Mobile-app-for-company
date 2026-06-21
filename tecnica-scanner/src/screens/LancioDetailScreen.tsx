import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useStore } from '@/store/useStore';
import { T, LANCIOS, LANCIO_PDFS } from '@/constants/data';
import { C } from '@/constants/colors';
import { getLancioUrl } from '@/lib/supabase';

type Props = NativeStackScreenProps<RootStackParamList, 'LancioDetail'>;

export default function LancioDetailScreen({ navigation, route }: Props) {
  const { lancioIdx, fromScan } = route.params;
  const { lang, setBollaPer, setLancioIdx } = useStore();
  const t = T[lang];
  const L = LANCIOS[lancioIdx];

  if (!L) return null;

  const sizeRange = (() => {
    // Pull from LSIZES if available, else show comm
    return L.comm;
  })();

  async function openPDF() {
    const pdfPath = LANCIO_PDFS[L.cn];
    if (!pdfPath) { return; }
    // Try to get signed URL from Supabase Storage
    try {
      const url = await getLancioUrl(pdfPath);
      if (url) { Linking.openURL(url); return; }
    } catch {}
    // Fallback: try local path
    Linking.openURL(pdfPath);
  }

  function openBolla() {
    setLancioIdx(lancioIdx);
    setBollaPer(64);
    navigation.navigate('Bolla', { lancioIdx });
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bgWarm }}>
      <SafeAreaView edges={['top']} style={s.hdr}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>‹ {t.back}</Text>
        </TouchableOpacity>
        {fromScan && (
          <View style={s.scanAlert}>
            <Text style={s.scanAlertTxt}>◼ {t.scanFindsLancio}</Text>
          </View>
        )}
        <Text style={s.code}>{L.comm}</Text>
        <Text style={s.name}>Lancio {L.n} · {L.m}</Text>
      </SafeAreaView>

      <ScrollView contentContainerStyle={s.body}>
        <View style={s.card}>
          {[
            { label: t.commessaL, value: L.cn },
            { label: t.articoloL, value: L.c },
            { label: t.coloreL,   value: L.col },
            { label: t.sizesL,    value: L.comm },
          ].map((r) => (
            <View key={r.label} style={s.kvRow}>
              <Text style={s.kvKey}>{r.label}</Text>
              <Text style={s.kvVal}>{r.value}</Text>
            </View>
          ))}
          <View style={s.kvRowLast}>
            <Text style={s.kvKey}>{t.paiaTot}</Text>
            <Text style={s.paia}>{L.pa}</Text>
          </View>
        </View>

        <TouchableOpacity style={s.printBtn} onPress={openPDF}>
          <Text style={s.printBtnTxt}>🖨  {t.printListafa}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.bollaBtn} onPress={openBolla}>
          <Text style={s.bollaBtnTxt}>📋  {t.printBolla}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  hdr:        { backgroundColor: C.charcoal, paddingHorizontal: 20, paddingBottom: 22 },
  backBtn:    { backgroundColor: 'rgba(255,255,255,.14)', alignSelf: 'flex-start', paddingHorizontal: 13, paddingVertical: 8, borderRadius: 8, marginTop: 8 },
  backTxt:    { color: '#fff', fontSize: 13, fontWeight: '600' },
  scanAlert:  { marginTop: 14, backgroundColor: 'rgba(237,107,6,.2)', borderRadius: 8, padding: 8, paddingHorizontal: 12 },
  scanAlertTxt:{ fontSize: 12, fontWeight: '600', color: '#F4A96A' },
  code:       { fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,.6)', marginTop: 16 },
  name:       { fontSize: 23, fontWeight: '700', color: '#fff', lineHeight: 28, marginTop: 5 },
  body:       { padding: 18, paddingHorizontal: 20, paddingBottom: 34, gap: 14 },
  card:       { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 16 },
  kvRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  kvRowLast:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 11 },
  kvKey:      { fontSize: 13, color: C.textSecondary },
  kvVal:      { fontSize: 13.5, fontWeight: '600', color: C.textPrimary, fontFamily: 'monospace' },
  paia:       { fontSize: 16, fontWeight: '700', color: C.orange, fontFamily: 'monospace' },
  printBtn:   { backgroundColor: C.blueDark, borderRadius: 11, padding: 15, alignItems: 'center' },
  printBtnTxt:{ color: '#fff', fontSize: 15, fontWeight: '700' },
  bollaBtn:   { backgroundColor: C.orange, borderRadius: 11, padding: 15, alignItems: 'center', shadowColor: C.orange, shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  bollaBtnTxt:{ color: '#fff', fontSize: 15, fontWeight: '700' },
});
