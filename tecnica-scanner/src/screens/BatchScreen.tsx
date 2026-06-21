import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Print from 'expo-print';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useStore } from '@/store/useStore';
import { T, LANCIOS, BOXES } from '@/constants/data';
import { C } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import Toast from '@/components/Toast';

type Props = NativeStackScreenProps<RootStackParamList, 'Batch'>;

const DEMO_JOBS: Record<string, { customer: string; date: string; items: { lancio: number; qty: number; cn: string }[] }> = {
  'JO-4471': { customer: 'Tecnica SPA', date: '2025-11-03', items: [{ lancio: 100, qty: 3, cn: '10562' }, { lancio: 200, qty: 2, cn: '10952' }, { lancio: 300, qty: 4, cn: '11182' }] },
  'JO-4480': { customer: 'Tecnica SPA', date: '2025-11-10', items: [{ lancio: 400, qty: 2, cn: '11898' }, { lancio: 500, qty: 3, cn: '12322' }] },
};

export default function BatchScreen({ navigation }: Props) {
  const { lang, user, jobInput, setJobInput, jobLoaded, setJobLoaded, partType, setPartType, cageCapacity, setCageCapacity, showToast } = useStore();
  const t = T[lang];

  const job = jobLoaded ? DEMO_JOBS[jobLoaded] : null;

  const totalCages = job
    ? job.items.reduce((sum, it) => {
        const lancio = LANCIOS.find((l) => l.cn === it.cn);
        if (!lancio) return sum;
        return sum + it.qty;
      }, 0)
    : 0;

  async function loadJob() {
    const key = jobInput.trim().toUpperCase();
    if (DEMO_JOBS[key]) { setJobLoaded(key); return; }
    const { data } = await supabase.from('jobs').select('*').eq('id', key).single();
    if (data) { setJobLoaded(key); } else { showToast('Job not found: ' + key); }
  }

  async function handlePrint() {
    if (!job) return;
    const labels = job.items.flatMap((it) => {
      const lancio = LANCIOS.find((l) => l.cn === it.cn);
      if (!lancio) return [];
      return Array.from({ length: it.qty }, (_, i) => ({
        n: lancio.n, model: lancio.m, cn: it.cn, cage: i + 1, of: it.qty,
        part: partType, cap: cageCapacity, jo: jobLoaded,
      }));
    });

    const html = `
      <html><head><style>
        body { font-family: Arial, sans-serif; margin: 0; }
        .page { width: 100mm; height: 60mm; padding: 6mm; box-sizing: border-box; page-break-after: always; border: 1px solid #ccc; }
        .jo { font-size: 8pt; color: #666; font-family: monospace; }
        .model { font-size: 9pt; font-weight: bold; margin-top: 3px; }
        .lancio { font-size: 22pt; font-weight: 900; color: #004063; }
        .detail { font-size: 8pt; color: #444; margin-top: 4px; font-family: monospace; }
        .footer { margin-top: 8px; display: flex; justify-content: space-between; font-size: 8pt; }
      </style></head><body>
        ${labels.map((lb) => `
          <div class="page">
            <div class="jo">${lb.jo} · CN ${lb.cn}</div>
            <div class="lancio">Lancio ${lb.n}</div>
            <div class="model">${lb.model}</div>
            <div class="detail">${lb.part.toUpperCase()} · Cage ${lb.cage}/${lb.of} · ${lb.cap} pairs</div>
            <div class="footer"><span>Tecnica Group</span><span>${new Date().toLocaleDateString()}</span></div>
          </div>
        `).join('')}
      </body></html>
    `;

    await Print.printAsync({ html });
    await supabase.from('batch_runs').insert({
      job_id: jobLoaded, part_type: partType, cage_capacity: cageCapacity, printed_by: user?.id,
    });
    showToast(t.printDone ?? 'Sent to printer');
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bgWarm }}>
      <SafeAreaView edges={['top']} style={s.hdr}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>‹ {t.back}</Text>
        </TouchableOpacity>
        <Text style={s.title}>{t.batchTitle}</Text>
        <Text style={s.sub}>{t.batchSub}</Text>
      </SafeAreaView>

      <ScrollView contentContainerStyle={s.body}>
        {/* Lancio chips */}
        <View style={s.card}>
          <Text style={s.label}>{t.orderFill}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
            {Object.keys(DEMO_JOBS).map((jo) => (
              <TouchableOpacity
                key={jo}
                style={[s.chip, jobLoaded === jo && s.chipActive]}
                onPress={() => { setJobInput(jo); setJobLoaded(jo); }}
              >
                <Text style={[s.chipTxt, { color: jobLoaded === jo ? C.orange : C.blueDark }]}>{jo}</Text>
                <Text style={s.chipSub}>{DEMO_JOBS[jo].customer}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Job input */}
        <View style={s.card}>
          <Text style={s.label}>{t.jobId ?? 'Job Order ID'}</Text>
          <View style={{ flexDirection: 'row', gap: 9 }}>
            <TextInput
              style={[s.input, { flex: 1, fontFamily: 'monospace' }]}
              value={jobInput}
              onChangeText={setJobInput}
              placeholder="JO-4471"
              placeholderTextColor="#B0B5B6"
              autoCapitalize="characters"
            />
            <TouchableOpacity style={s.loadBtn} onPress={loadJob}>
              <Text style={s.loadBtnTxt}>{t.load ?? 'Load'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Part type + cage capacity */}
        {job && (
          <>
            <View style={s.card}>
              <Text style={s.label}>{t.partType ?? 'Part Type'}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['scafo', 'gambetto'] as const).map((pt) => (
                  <TouchableOpacity
                    key={pt}
                    style={[s.pill, partType === pt ? s.pillActive : s.pillInactive]}
                    onPress={() => setPartType(pt)}
                  >
                    <Text style={[s.pillTxt, { color: partType === pt ? '#B5560A' : C.slate }]}>{pt.charAt(0).toUpperCase() + pt.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[s.label, { marginTop: 16 }]}>{t.cageCap ?? 'Pairs per Cage'}</Text>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {[24, 36, 48, 64, 96].map((cap) => (
                  <TouchableOpacity
                    key={cap}
                    style={[s.pill, cageCapacity === cap ? s.pillActive : s.pillInactive]}
                    onPress={() => setCageCapacity(cap)}
                  >
                    <Text style={[s.pillTxt, { color: cageCapacity === cap ? '#B5560A' : C.slate }]}>{cap}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Job summary */}
            <View style={s.card}>
              <Text style={s.label}>{jobLoaded} — {job.customer}</Text>
              <Text style={s.subLabel}>{job.date} · {totalCages} {t.cagesTotal ?? 'cages total'}</Text>
              {job.items.map((it, i) => {
                const lancio = LANCIOS.find((l) => l.cn === it.cn);
                return (
                  <View key={i} style={s.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.itemLancio}>Lancio {lancio?.n ?? '?'}</Text>
                      <Text style={s.itemModel} numberOfLines={1}>{lancio?.m ?? it.cn}</Text>
                    </View>
                    <Text style={s.itemQty}>{it.qty} cages</Text>
                  </View>
                );
              })}
            </View>

            {/* Label grid preview */}
            <Text style={s.sectionLabel}>{t.labelPreview}</Text>
            <View style={s.gridWrap}>
              {job.items.flatMap((it, ii) => {
                const lancio = LANCIOS.find((l) => l.cn === it.cn);
                return Array.from({ length: it.qty }, (_, ci) => (
                  <View key={`${ii}-${ci}`} style={s.labelCard}>
                    <Text style={s.labelJo}>{jobLoaded}</Text>
                    <Text style={s.labelLancio}>L{lancio?.n ?? '?'}</Text>
                    <Text style={s.labelDetail} numberOfLines={1}>{lancio?.m}</Text>
                    <Text style={s.labelCage}>{ci + 1}/{it.qty}</Text>
                    <Text style={s.labelPart}>{partType}</Text>
                  </View>
                ));
              })}
            </View>

            <TouchableOpacity style={s.printBtn} onPress={handlePrint}>
              <Text style={s.printBtnTxt}>🖨  {t.printLabels ?? 'Print Labels'} ({totalCages})</Text>
            </TouchableOpacity>
          </>
        )}
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
  card:        { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 16 },
  label:       { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: C.textMuted, fontFamily: 'monospace', marginBottom: 7 },
  subLabel:    { fontSize: 11.5, color: '#9AA0A2', marginBottom: 10 },
  input:       { borderWidth: 1, borderColor: '#D8D8D2', borderRadius: 9, padding: 12, paddingHorizontal: 14, fontSize: 15, color: C.textPrimary, backgroundColor: '#FAFAF8' },
  loadBtn:     { backgroundColor: C.blueDark, borderRadius: 9, paddingHorizontal: 18, justifyContent: 'center' },
  loadBtnTxt:  { color: '#fff', fontSize: 14, fontWeight: '700' },
  chip:        { backgroundColor: '#F7F7F3', borderWidth: 1, borderColor: C.border, borderRadius: 9, padding: 10, paddingHorizontal: 14, marginRight: 9, minWidth: 90 },
  chipActive:  { borderColor: C.orange, backgroundColor: C.orangeLight },
  chipTxt:     { fontSize: 13, fontWeight: '800' },
  chipSub:     { fontSize: 10, color: C.textMuted, marginTop: 2 },
  pill:        { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  pillActive:  { borderColor: C.orange, backgroundColor: C.orangeLight },
  pillInactive:{ borderColor: '#D8D8D2', backgroundColor: '#fff' },
  pillTxt:     { fontSize: 13, fontWeight: '600' },
  itemRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderTopWidth: 1, borderTopColor: C.borderLight },
  itemLancio:  { fontSize: 13, fontWeight: '700', color: C.blueDark },
  itemModel:   { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  itemQty:     { fontSize: 13, fontWeight: '700', color: C.orange, fontFamily: 'monospace' },
  sectionLabel:{ fontSize: 11, fontWeight: '700', letterSpacing: 1.44, textTransform: 'uppercase', color: C.textMuted, fontFamily: 'monospace', paddingHorizontal: 2 },
  gridWrap:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  labelCard:   { width: '47%', backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 9, padding: 11 },
  labelJo:     { fontSize: 9, fontFamily: 'monospace', color: C.textMuted },
  labelLancio: { fontSize: 18, fontWeight: '900', color: C.blueDark, marginTop: 2 },
  labelDetail: { fontSize: 10, color: C.textSecondary, marginTop: 2 },
  labelCage:   { fontSize: 11, fontFamily: 'monospace', color: C.orange, marginTop: 6 },
  labelPart:   { fontSize: 9, color: C.textFaint, fontFamily: 'monospace', textTransform: 'uppercase', marginTop: 2 },
  printBtn:    { backgroundColor: C.orange, borderRadius: 11, padding: 15, alignItems: 'center', shadowColor: C.orange, shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  printBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
