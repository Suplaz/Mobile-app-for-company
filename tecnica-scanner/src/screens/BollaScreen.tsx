import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Print from 'expo-print';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useStore } from '@/store/useStore';
import { T, LANCIOS, LSIZES, BOXES } from '@/constants/data';
import { C } from '@/constants/colors';
import Barcode from '@/components/Barcode';
import Toast from '@/components/Toast';

type Props = NativeStackScreenProps<RootStackParamList, 'Bolla'>;

export default function BollaScreen({ navigation, route }: Props) {
  const { lancioIdx } = route.params;
  const { lang, bollaPer, setBollaPer, bollaBox, setBollaBox, showToast } = useStore();
  const t = T[lang];
  const L = LANCIOS[lancioIdx];
  if (!L) return null;

  const sizeArr = LSIZES[L.cn] ?? [];
  const totalPairs = sizeArr.reduce((s, e) => s + e.qty, 0);
  const numBoxes = Math.ceil(totalPairs / bollaPer);

  // Build per-box size distribution
  const remaining = sizeArr.map((e) => ({ mp: e.mp, qty: e.qty }));
  const boxes: { label: string; cn: string; sizes: { sz: string; qty: number }[] }[] = [];
  for (let i = 0; i < numBoxes; i++) {
    const perBox: { sz: string; qty: number }[] = [];
    let left = bollaPer;
    for (const rem of remaining) {
      if (left <= 0) break;
      const take = Math.min(rem.qty, left);
      if (take > 0) { perBox.push({ sz: rem.mp, qty: take }); rem.qty -= take; left -= take; }
    }
    if (perBox.length > 0) {
      boxes.push({ label: `${L.cn}-${String(i + 1).padStart(3, '0')}`, cn: L.cn, sizes: perBox });
    }
  }

  async function handlePrint() {
    const boxCards = boxes.map((bx, i) => `
      <div style="width:85mm;padding:6mm;box-sizing:border-box;border:1px solid #ddd;border-radius:6px;margin-bottom:8px;page-break-inside:avoid;">
        <div style="font-size:8pt;color:#666;font-family:monospace;">${bx.label}</div>
        <div style="font-size:16pt;font-weight:900;color:#004063;margin:2px 0;">L${L.n} · Box ${i + 1}/${boxes.length}</div>
        <div style="font-size:9pt;font-weight:600;">${L.m}</div>
        <div style="font-size:8pt;color:#666;margin-top:3px;">${bx.sizes.map((s) => `${s.sz}: ${s.qty}`).join(' · ')}</div>
        <div style="margin-top:6px;font-size:8pt;color:#444;">Box code: ${bollaBox} · ${bollaPer} pairs</div>
      </div>
    `).join('');

    const html = `
      <html><head><style>
        body { font-family: Arial, sans-serif; padding: 16px; }
        h2 { font-size: 16pt; color: #004063; margin: 0 0 4px; }
        .meta { font-size: 9pt; color: #666; margin-bottom: 16px; }
        .grid { display: flex; flex-wrap: wrap; gap: 8px; }
      </style></head><body>
        <h2>Bolla — Lancio ${L.n}</h2>
        <div class="meta">${L.m} · CN ${L.cn} · ${totalPairs} paia · ${boxes.length} colli</div>
        <div class="grid">${boxCards}</div>
        <div style="margin-top:20px;font-size:8pt;color:#bbb;border-top:1px solid #eee;padding-top:8px;">
          Tecnica Group · ${new Date().toLocaleDateString()}
        </div>
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
        <Text style={s.title}>Bolla — Lancio {L.n}</Text>
        <Text style={s.sub}>{L.m}</Text>
      </SafeAreaView>

      <ScrollView contentContainerStyle={s.body}>
        {/* Barcode */}
        <View style={s.barcodeCard}>
          <Barcode value={L.cn} height={44} />
          <Text style={s.barcodeLabel}>{L.cn}</Text>
        </View>

        {/* Box config */}
        <View style={s.card}>
          <Text style={s.label}>{t.boxCode ?? 'Box Code'}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {BOXES.map((b) => (
              <TouchableOpacity
                key={b.code}
                style={[s.pill, bollaBox === b.code ? s.pillActive : s.pillInactive]}
                onPress={() => { setBollaBox(b.code); setBollaPer(b.pairs); }}
              >
                <Text style={[s.pillTxt, { color: bollaBox === b.code ? '#B5560A' : C.slate }]}>{b.code}</Text>
                <Text style={[s.pillSub, { color: bollaBox === b.code ? '#B5560A' : C.textFaint }]}>{b.pairs}p</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[s.label, { marginTop: 16 }]}>{t.pairsPerBox ?? 'Pairs per box'}</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {[48, 56, 64, 72, 76, 90, 108].map((n) => (
              <TouchableOpacity
                key={n}
                style={[s.pill, bollaPer === n ? s.pillActive : s.pillInactive]}
                onPress={() => setBollaPer(n)}
              >
                <Text style={[s.pillTxt, { color: bollaPer === n ? '#B5560A' : C.slate }]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary */}
        <View style={[s.card, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
          <View>
            <Text style={s.summaryVal}>{totalPairs}</Text>
            <Text style={s.summaryLbl}>{t.paiaTot ?? 'Total pairs'}</Text>
          </View>
          <View style={s.divider} />
          <View style={{ alignItems: 'center' }}>
            <Text style={s.summaryVal}>{bollaPer}</Text>
            <Text style={s.summaryLbl}>{t.perBox ?? 'per box'}</Text>
          </View>
          <View style={s.divider} />
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[s.summaryVal, { color: C.orange }]}>{boxes.length}</Text>
            <Text style={s.summaryLbl}>{t.colli ?? 'colli'}</Text>
          </View>
        </View>

        {/* Box labels grid */}
        <Text style={s.sectionLabel}>{t.labelPreview}</Text>
        <View style={s.gridWrap}>
          {boxes.map((bx, i) => (
            <View key={i} style={s.boxLabel}>
              <Text style={s.boxCode}>{bollaBox}</Text>
              <Text style={s.boxLancio}>L{L.n}</Text>
              <Text style={s.boxNum}>{i + 1}/{boxes.length}</Text>
              <Text style={s.boxSizes} numberOfLines={2}>{bx.sizes.map((s) => `${s.sz}:${s.qty}`).join(' ')}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={s.printBtn} onPress={handlePrint}>
          <Text style={s.printBtnTxt}>🖨  {t.printBolla ?? 'Print Bolla'} ({boxes.length} {t.colli ?? 'colli'})</Text>
        </TouchableOpacity>
      </ScrollView>
      <Toast />
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
  card:        { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 16 },
  label:       { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: C.textMuted, fontFamily: 'monospace', marginBottom: 7 },
  pill:        { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  pillActive:  { borderColor: C.orange, backgroundColor: C.orangeLight },
  pillInactive:{ borderColor: '#D8D8D2', backgroundColor: '#fff' },
  pillTxt:     { fontSize: 13, fontWeight: '700' },
  pillSub:     { fontSize: 9, marginTop: 1 },
  summaryVal:  { fontSize: 24, fontWeight: '800', color: C.textPrimary, fontFamily: 'monospace' },
  summaryLbl:  { fontSize: 10, color: C.textFaint, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  divider:     { width: 1, height: 40, backgroundColor: C.borderLight },
  sectionLabel:{ fontSize: 11, fontWeight: '700', letterSpacing: 1.44, textTransform: 'uppercase', color: C.textMuted, fontFamily: 'monospace', paddingHorizontal: 2 },
  gridWrap:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  boxLabel:    { width: '47%', backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 9, padding: 12 },
  boxCode:     { fontSize: 9, fontFamily: 'monospace', color: C.textMuted, letterSpacing: 1 },
  boxLancio:   { fontSize: 20, fontWeight: '900', color: C.blueDark, marginTop: 2 },
  boxNum:      { fontSize: 11, fontFamily: 'monospace', color: C.orange, marginTop: 4 },
  boxSizes:    { fontSize: 9, fontFamily: 'monospace', color: C.textSecondary, marginTop: 4, lineHeight: 14 },
  printBtn:    { backgroundColor: C.orange, borderRadius: 11, padding: 15, alignItems: 'center', shadowColor: C.orange, shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  printBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
