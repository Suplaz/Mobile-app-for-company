import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Print from 'expo-print';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useStore } from '@/store/useStore';
import { T, LANCIOS, LSIZES } from '@/constants/data';
import { C } from '@/constants/colors';
import Barcode from '@/components/Barcode';

type Props = NativeStackScreenProps<RootStackParamList, 'Listafa'>;

export default function ListafaScreen({ navigation, route }: Props) {
  const { lancioIdx } = route.params;
  const { lang, showToast } = useStore();
  const t = T[lang];
  const L = LANCIOS[lancioIdx];
  if (!L) return null;

  const sizeArr = LSIZES[L.cn] ?? [];
  const totalPairs = sizeArr.reduce((sum, e) => sum + e.qty, 0);

  async function handlePrint() {
    const rows = sizeArr.map((e) => `
      <tr>
        <td style="font-size:14pt;font-weight:700;text-align:center;border:1px solid #ddd;padding:6px 10px;">${e.mp}</td>
        <td style="font-size:14pt;font-weight:700;text-align:center;border:1px solid #ddd;padding:6px 10px;">${e.qty}</td>
        <td style="text-align:center;border:1px solid #ddd;padding:6px 10px;"></td>
      </tr>
    `).join('');

    const html = `
      <html><head><style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { font-size: 20pt; color: #004063; margin: 0; }
        .sub { font-size: 10pt; color: #666; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { background: #004063; color: white; padding: 8px; font-size: 10pt; border: 1px solid #004063; }
        .total { margin-top: 12px; font-size: 12pt; font-weight: bold; }
        .footer { margin-top: 24px; font-size: 9pt; color: #999; border-top: 1px solid #eee; padding-top: 8px; display: flex; justify-content: space-between; }
      </style></head><body>
        <h1>Lancio ${L.n} — ${L.m}</h1>
        <div class="sub">CN: ${L.cn} · ${L.comm} · ${L.col}</div>
        <table>
          <tr><th>Misura</th><th>Paia</th><th>✓</th></tr>
          ${rows}
        </table>
        <div class="total">Totale: ${totalPairs} paia</div>
        <div class="footer"><span>Tecnica Group · Lista di imballaggio</span><span>${new Date().toLocaleDateString()}</span></div>
      </body></html>
    `;

    await Print.printAsync({ html });
    showToast(t.printDone ?? 'Sent to printer');
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bgWarm }}>
      <SafeAreaView edges={['top']} style={s.hdr}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>‹ {t.back}</Text>
        </TouchableOpacity>
        <Text style={s.title}>Lancio {L.n}</Text>
        <Text style={s.sub}>{L.m} · {L.col}</Text>
      </SafeAreaView>

      <ScrollView contentContainerStyle={s.body}>
        {/* Barcode */}
        <View style={s.barcodeCard}>
          <Barcode value={L.cn} height={44} />
          <Text style={s.barcodeLabel}>{L.cn}</Text>
        </View>

        {/* Meta */}
        <View style={s.card}>
          {[
            { label: t.commessaL ?? 'Commessa', value: L.cn },
            { label: t.articoloL ?? 'Articolo', value: L.c },
            { label: t.coloreL ?? 'Colore', value: L.col },
          ].map((r) => (
            <View key={r.label} style={s.kvRow}>
              <Text style={s.kvKey}>{r.label}</Text>
              <Text style={s.kvVal}>{r.value}</Text>
            </View>
          ))}
          <View style={s.kvRowLast}>
            <Text style={s.kvKey}>{t.paiaTot ?? 'Totale paia'}</Text>
            <Text style={s.paia}>{totalPairs}</Text>
          </View>
        </View>

        {/* Size table */}
        <Text style={s.sectionLabel}>{t.sizesL ?? 'Misure'}</Text>
        <View style={s.tableCard}>
          <View style={s.tableHdr}>
            <Text style={[s.thCell, { flex: 1 }]}>Misura</Text>
            <Text style={[s.thCell, { width: 70, textAlign: 'right' }]}>Paia</Text>
          </View>
          {sizeArr.map((e) => (
            <View key={e.mp} style={s.tableRow}>
              <Text style={[s.tdCell, { flex: 1, fontFamily: 'monospace', fontWeight: '700' }]}>{e.mp}</Text>
              <Text style={[s.tdCell, { width: 70, textAlign: 'right', color: C.orange, fontWeight: '700' }]}>{e.qty}</Text>
            </View>
          ))}
          <View style={[s.tableRow, { backgroundColor: '#F7F7F3', borderTopWidth: 2, borderTopColor: C.border }]}>
            <Text style={[s.tdCell, { flex: 1, fontWeight: '700', color: C.textPrimary }]}>TOTALE</Text>
            <Text style={[s.tdCell, { width: 70, textAlign: 'right', fontWeight: '800', color: C.orange }]}>{totalPairs}</Text>
          </View>
        </View>

        <TouchableOpacity style={s.printBtn} onPress={handlePrint}>
          <Text style={s.printBtnTxt}>🖨  {t.printListafa ?? 'Print Listafa'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  hdr:         { backgroundColor: C.charcoal, paddingHorizontal: 20, paddingBottom: 22 },
  backBtn:     { backgroundColor: 'rgba(255,255,255,.14)', alignSelf: 'flex-start', paddingHorizontal: 13, paddingVertical: 8, borderRadius: 8, marginTop: 8 },
  backTxt:     { color: '#fff', fontSize: 13, fontWeight: '600' },
  title:       { fontSize: 23, fontWeight: '700', color: '#fff', marginTop: 16 },
  sub:         { fontSize: 13, color: 'rgba(255,255,255,.65)', marginTop: 5 },
  body:        { padding: 18, paddingHorizontal: 20, paddingBottom: 36, gap: 14 },
  barcodeCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 20, alignItems: 'center' },
  barcodeLabel:{ fontSize: 13, fontFamily: 'monospace', color: C.textMuted, marginTop: 8 },
  card:        { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 16 },
  kvRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  kvRowLast:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 11 },
  kvKey:       { fontSize: 13, color: C.textSecondary },
  kvVal:       { fontSize: 13.5, fontWeight: '600', color: C.textPrimary, fontFamily: 'monospace' },
  paia:        { fontSize: 16, fontWeight: '700', color: C.orange, fontFamily: 'monospace' },
  sectionLabel:{ fontSize: 11, fontWeight: '700', letterSpacing: 1.44, textTransform: 'uppercase', color: C.textMuted, fontFamily: 'monospace', paddingHorizontal: 2 },
  tableCard:   { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 12, overflow: 'hidden' },
  tableHdr:    { flexDirection: 'row', backgroundColor: C.charcoal, paddingHorizontal: 16, paddingVertical: 10 },
  thCell:      { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,.8)', letterSpacing: 0.5, textTransform: 'uppercase' },
  tableRow:    { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  tdCell:      { fontSize: 14, color: C.textPrimary },
  printBtn:    { backgroundColor: C.blueDark, borderRadius: 11, padding: 15, alignItems: 'center' },
  printBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
