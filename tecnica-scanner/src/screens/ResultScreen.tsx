import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { T, STAGES } from '@/constants/data';
import { C, TONES, DOCCAT } from '@/constants/colors';
import Toast from '@/components/Toast';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

const TONE_KEY = { ok: 'ok', info: 'info', attention: 'attention', issue: 'issue' } as const;

export default function ResultScreen({ navigation, route }: Props) {
  const { assetId } = route.params;
  const { lang, user, showToast } = useStore();
  const t = T[lang];
  const isAuth = !!user;

  const [asset, setAsset]   = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [documents, setDocuments]   = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [actionOpen, setActionOpen] = useState(false);

  useEffect(() => { fetchAsset(); }, [assetId]);

  async function fetchAsset() {
    setLoading(true);
    const { data: a } = await supabase.from('assets').select('*').eq('id', assetId).single();
    setAsset(a);
    if (a && (a.access === 'public' || isAuth)) {
      const [{ data: h }, { data: w }, { data: d }] = await Promise.all([
        supabase.from('asset_history').select('*').eq('asset_id', assetId).order('created_at', { ascending: false }),
        supabase.from('work_orders').select('*').eq('asset_id', assetId),
        supabase.from('documents').select('*').eq('asset_id', assetId),
      ]);
      setHistory(h ?? []);
      setWorkOrders(w ?? []);
      setDocuments(d ?? []);
    }
    setLoading(false);
  }

  if (loading) return <View style={[s.bg, { alignItems: 'center', justifyContent: 'center' }]}><Text style={{ color: C.textMuted }}>Loading…</Text></View>;
  if (!asset)  return <View style={[s.bg, { alignItems: 'center', justifyContent: 'center' }]}><Text style={{ color: C.textMuted }}>Asset not found: {assetId}</Text></View>;

  const accessible = asset.access === 'public' || isAuth;
  const tone   = TONES[asset.tone as keyof typeof TONES] ?? TONES.ok;
  const accFg  = asset.access === 'public' ? C.blueInfo : C.red;
  const accBg  = asset.access === 'public' ? C.blueLight : C.redLight;
  const accLbl = asset.access === 'public' ? t.publicTag : t.restrictedTag;

  const sIdx   = asset.stage ? STAGES.indexOf(asset.stage as any) : -1;
  const mat: {k:string;v:string}[] = asset.material ?? [];
  const proc: {k:string;v:string}[] = asset.process ?? [];

  return (
    <View style={s.bg}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.hdr}>
          <SafeAreaView edges={['top']}>
            <View style={s.hdrTop}>
              <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                <Text style={s.backTxt}>‹ {t.back}</Text>
              </TouchableOpacity>
              {accessible && (
                <TouchableOpacity style={s.dotsBtn} onPress={() => setActionOpen(true)}>
                  <Text style={{ color: '#fff', fontSize: 20, letterSpacing: 4 }}>···</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={s.hdrMeta}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.hdrKind}>{asset.kind} · {asset.id}</Text>
                <Text style={s.hdrName}>{asset.name}</Text>
              </View>
              <View style={[s.accBadge, { backgroundColor: accBg }]}>
                <Text style={[s.accBadgeTxt, { color: accFg }]}>{accLbl}</Text>
              </View>
            </View>
            <View style={s.hdrStatus}>
              <View style={[s.statusPill, { backgroundColor: tone.bg }]}>
                <View style={[s.statusDot, { backgroundColor: tone.fg }]} />
                <Text style={[s.statusTxt, { color: tone.fg }]}>{t[asset.status_key] ?? asset.status_key}</Text>
              </View>
              {asset.stage && (
                <View style={s.stagePill}>
                  <View style={[s.statusDot, { backgroundColor: C.orange }]} />
                  <Text style={[s.statusTxt, { color: '#F4A96A' }]}>{t['stage_' + asset.stage] ?? asset.stage}</Text>
                </View>
              )}
            </View>
          </SafeAreaView>
        </View>

        {/* Locked state */}
        {!accessible && (
          <View style={s.lockedArea}>
            <View style={s.lockIcon}><Text style={{ fontSize: 30 }}>🔒</Text></View>
            <Text style={s.lockedTitle}>{t.restrictedTitle}</Text>
            <Text style={s.lockedMsg}>{t.restrictedMsg}</Text>
            <TouchableOpacity style={s.signInBlue} onPress={() => navigation.navigate('Login', {})}>
              <Text style={s.signInBlueText}>{t.signIn}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Content */}
        {accessible && (
          <View style={s.content}>

            {/* Production Stage timeline */}
            {asset.stage && (
              <View style={s.card}>
                <View style={s.cardHdrRow}>
                  <Text style={s.cardLabel}>{t.prodStage}</Text>
                  <View style={s.stageBadge}><Text style={s.stageBadgeTxt}>{t.stageStep} {sIdx + 1} / {STAGES.length}</Text></View>
                </View>
                <View style={{ marginTop: 14 }}>
                  {STAGES.map((st, i) => {
                    const state = i < sIdx ? 'done' : i === sIdx ? 'current' : 'pending';
                    const nodeColor = state === 'done' ? C.green : state === 'current' ? C.orange : '#D2D2CC';
                    const labelColor = state === 'pending' ? C.textMuted : C.textPrimary;
                    const statusTxt = state === 'done' ? t.stDone : state === 'current' ? t.stCurrent : t.stPending;
                    const statusColor = state === 'done' ? C.green : state === 'current' ? C.orange : C.textFaint;
                    return (
                      <View key={st} style={{ flexDirection: 'row', gap: 13 }}>
                        <View style={{ alignItems: 'center' }}>
                          <View style={[s.node, { backgroundColor: state === 'pending' ? '#fff' : nodeColor, borderColor: nodeColor, borderWidth: 2 }]}>
                            {state === 'done' && <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>✓</Text>}
                            {state === 'current' && <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#fff' }} />}
                          </View>
                          {i < STAGES.length - 1 && <View style={[s.connector, { backgroundColor: state === 'done' ? C.green : C.border }]} />}
                        </View>
                        <View style={{ flex: 1, paddingBottom: 14 }}>
                          <Text style={[s.stageLabel, { color: labelColor }]}>{t['stage_' + st] ?? st}</Text>
                          <Text style={[s.stageStatus, { color: statusColor }]}>{statusTxt}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Process parameters */}
            {proc.length > 0 && (
              <View style={s.card}>
                <Text style={s.cardLabel}>{t.process}</Text>
                {proc.map((p, i) => (
                  <View key={i} style={[s.kvRow, i < proc.length - 1 && s.kvBorder]}>
                    <Text style={s.kvKey}>{p.k}</Text>
                    <Text style={s.kvVal}>{p.v}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Location */}
            <View style={s.card}>
              <Text style={s.cardLabel}>{t.location}</Text>
              <View style={s.locRow}>
                <View style={s.locPin}><Text style={{ fontSize: 18 }}>📍</Text></View>
                <Text style={s.locName}>{asset.zone ?? '—'}</Text>
              </View>
              <TouchableOpacity style={s.mapBtn} onPress={() => Linking.openURL('assets/factory-map.pdf')}>
                <Text style={s.mapBtnTxt}>{t.viewMap}</Text>
                <Text style={{ color: C.blueDark, fontSize: 18 }}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Material / specs */}
            {mat.length > 0 && (
              <View style={s.card}>
                <Text style={s.cardLabel}>{asset.material ? t.material : t.details}</Text>
                {mat.map((m, i) => (
                  <View key={i} style={[s.kvRow, i < mat.length - 1 && s.kvBorder]}>
                    <Text style={s.kvKey}>{m.k}</Text>
                    <Text style={s.kvVal}>{m.v}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Work orders */}
            {workOrders.length > 0 && (
              <View style={s.card}>
                <Text style={s.cardLabel}>{t.maintenance}</Text>
                {workOrders.map((w) => {
                  const wt = TONES[w.tone as keyof typeof TONES] ?? TONES.ok;
                  return (
                    <View key={w.id} style={s.woRow}>
                      <View style={s.woIcon}><Text style={{ fontSize: 16 }}>🔧</Text></View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={s.woTitle}>{w.title}</Text>
                        <Text style={s.woId}>{w.id}</Text>
                      </View>
                      <View style={[s.woBadge, { backgroundColor: wt.bg }]}>
                        <Text style={[s.woBadgeTxt, { color: wt.fg }]}>{t[w.status_key] ?? w.status_key}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* History */}
            {history.length > 0 && (
              <View style={s.card}>
                <Text style={s.cardLabel}>{t.history}</Text>
                <View style={{ marginTop: 11 }}>
                  {history.map((h, i) => (
                    <View key={h.id ?? i} style={{ flexDirection: 'row', gap: 12, paddingBottom: 14 }}>
                      <View style={{ alignItems: 'center', paddingTop: 3 }}>
                        <View style={s.histDot} />
                        {i < history.length - 1 && <View style={s.histLine} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.histTime}>{new Date(h.created_at).toLocaleString()}</Text>
                        <Text style={s.histWhat}>{h.what}</Text>
                        <Text style={s.histWho}>{h.who}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Documents */}
            {documents.length > 0 && (
              <View style={s.card}>
                <Text style={s.cardLabel}>{t.documents}</Text>
                {documents.map((doc) => {
                  const dc = DOCCAT[doc.category as keyof typeof DOCCAT] ?? DOCCAT.spec;
                  return (
                    <TouchableOpacity
                      key={doc.id}
                      style={s.docRow}
                      onPress={() => showToast('Opening ' + doc.name)}
                    >
                      <View style={s.docIcon}><Text style={{ color: C.red, fontSize: 14 }}>📄</Text></View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={s.docName} numberOfLines={1}>{doc.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4 }}>
                          <View style={[s.docBadge, { backgroundColor: dc.bg }]}>
                            <Text style={[s.docBadgeTxt, { color: dc.fg }]}>{t['doc_' + doc.category] ?? doc.category}</Text>
                          </View>
                          {doc.file_size && <Text style={s.docSize}>{doc.file_size}</Text>}
                        </View>
                      </View>
                      <Text style={{ color: '#C8C8C2', fontSize: 18 }}>›</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Action sheet */}
      <Modal visible={actionOpen} transparent animationType="slide" onRequestClose={() => setActionOpen(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setActionOpen(false)} />
        <View style={s.sheet}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>{t.actions}</Text>
          {[
            { label: t.move,   icon: '📦', onPress: () => { setActionOpen(false); showToast(t.moved); } },
            { label: t.checkout, icon: '✅', onPress: () => { setActionOpen(false); showToast(t.checkedOut); } },
            { label: t.report, icon: '⚠️', onPress: () => { setActionOpen(false); showToast(t.reported); } },
          ].map((a) => (
            <TouchableOpacity key={a.label} style={s.sheetRow} onPress={a.onPress}>
              <View style={s.sheetIcon}><Text style={{ fontSize: 18 }}>{a.icon}</Text></View>
              <Text style={s.sheetRowTxt}>{a.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={s.sheetCancel} onPress={() => setActionOpen(false)}>
            <Text style={s.sheetCancelTxt}>{t.cancel}</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Toast />
    </View>
  );
}

const s = StyleSheet.create({
  bg:           { flex: 1, backgroundColor: C.bgWarm },
  hdr:          { backgroundColor: C.charcoal, paddingHorizontal: 20, paddingBottom: 20 },
  hdrTop:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 },
  backBtn:      { backgroundColor: 'rgba(255,255,255,.14)', paddingHorizontal: 13, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  backTxt:      { color: '#fff', fontSize: 13, fontWeight: '600' },
  dotsBtn:      { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,.14)', alignItems: 'center', justifyContent: 'center' },
  hdrMeta:      { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginTop: 16 },
  hdrKind:      { fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,.6)', letterSpacing: 0.4 },
  hdrName:      { fontSize: 23, fontWeight: '700', color: '#fff', lineHeight: 27, marginTop: 5 },
  accBadge:     { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5 },
  accBadgeTxt:  { fontSize: 10, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: 'monospace' },
  hdrStatus:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  statusPill:   { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 7 },
  statusDot:    { width: 8, height: 8, borderRadius: 4 },
  statusTxt:    { fontSize: 12, fontWeight: '700' },
  stagePill:    { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 7, backgroundColor: 'rgba(237,107,6,.22)' },
  content:      { padding: 18, paddingHorizontal: 20, paddingBottom: 34, gap: 14 },
  card:         { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 15, paddingHorizontal: 16 },
  cardHdrRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLabel:    { fontSize: 11, fontWeight: '700', letterSpacing: 1.44, textTransform: 'uppercase', color: C.textMuted, fontFamily: 'monospace' },
  stageBadge:   { backgroundColor: C.orangeLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  stageBadgeTxt:{ fontSize: 10, fontWeight: '700', color: C.orangeText, fontFamily: 'monospace', letterSpacing: 0.5 },
  node:         { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  connector:    { width: 2, flex: 1, minHeight: 16, marginVertical: 2 },
  stageLabel:   { fontSize: 14.5, fontWeight: '600' },
  stageStatus:  { fontSize: 11.5, fontWeight: '600', marginTop: 1 },
  kvRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 9 },
  kvBorder:     { borderBottomWidth: 1, borderBottomColor: C.borderLight },
  kvKey:        { fontSize: 13.5, color: C.textSecondary },
  kvVal:        { fontSize: 13.5, fontWeight: '600', color: C.textPrimary, fontFamily: 'monospace', textAlign: 'right', flex: 1 },
  locRow:       { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 11 },
  locPin:       { width: 36, height: 36, borderRadius: 8, backgroundColor: C.blueLight, alignItems: 'center', justifyContent: 'center' },
  locName:      { fontSize: 15, fontWeight: '600', color: C.textPrimary, flex: 1 },
  mapBtn:       { marginTop: 12, backgroundColor: '#F0F4F7', borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  mapBtnTxt:    { fontSize: 13.5, fontWeight: '600', color: C.blueDark, flex: 1 },
  woRow:        { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 11, paddingHorizontal: 12, borderWidth: 1, borderColor: '#EDEDE8', borderRadius: 9, marginTop: 9 },
  woIcon:       { width: 32, height: 32, borderRadius: 7, backgroundColor: '#F0F0EC', alignItems: 'center', justifyContent: 'center' },
  woTitle:      { fontSize: 13.5, fontWeight: '600', color: C.textPrimary },
  woId:         { fontSize: 10.5, color: C.textMuted, fontFamily: 'monospace', marginTop: 1 },
  woBadge:      { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  woBadgeTxt:   { fontSize: 9.5, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', fontFamily: 'monospace' },
  histDot:      { width: 9, height: 9, borderRadius: 5, backgroundColor: C.orange },
  histLine:     { width: 1, flex: 1, backgroundColor: C.border, marginTop: 3 },
  histTime:     { fontSize: 10.5, color: C.textMuted, fontFamily: 'monospace' },
  histWhat:     { fontSize: 13.5, color: C.textPrimary, marginTop: 2 },
  histWho:      { fontSize: 11.5, color: C.textSecondary, marginTop: 1 },
  docRow:       { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#EDEDE8', borderRadius: 9, marginTop: 9, backgroundColor: '#fff' },
  docIcon:      { width: 32, height: 32, borderRadius: 7, backgroundColor: C.redLight, alignItems: 'center', justifyContent: 'center' },
  docName:      { fontSize: 13.5, fontWeight: '600', color: C.textPrimary },
  docBadge:     { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  docBadgeTxt:  { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', fontFamily: 'monospace' },
  docSize:      { fontSize: 10.5, color: C.textMuted, fontFamily: 'monospace' },
  lockedArea:   { padding: 40, paddingHorizontal: 26, alignItems: 'center' },
  lockIcon:     { width: 72, height: 72, borderRadius: 18, backgroundColor: C.redLight, alignItems: 'center', justifyContent: 'center' },
  lockedTitle:  { fontSize: 19, fontWeight: '700', color: C.textPrimary, marginTop: 20 },
  lockedMsg:    { fontSize: 13.5, color: C.textSecondary, marginTop: 8, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  signInBlue:   { marginTop: 24, backgroundColor: C.blueDark, borderRadius: 10, padding: 14, paddingHorizontal: 28, width: '100%', maxWidth: 300, alignItems: 'center' },
  signInBlueText:{ color: '#fff', fontSize: 15, fontWeight: '600' },
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,.42)' },
  sheet:        { backgroundColor: '#F2F2EE', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 10, paddingHorizontal: 12, paddingBottom: 30 },
  sheetHandle:  { width: 38, height: 4, borderRadius: 3, backgroundColor: '#CFCFC8', alignSelf: 'center', marginBottom: 12, marginTop: 2 },
  sheetTitle:   { fontSize: 11, fontWeight: '700', letterSpacing: 1.44, textTransform: 'uppercase', color: C.textMuted, fontFamily: 'monospace', paddingHorizontal: 8, paddingBottom: 10 },
  sheetRow:     { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 11, padding: 15, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 8 },
  sheetIcon:    { width: 30, height: 30, borderRadius: 8, backgroundColor: '#F0F0EC', alignItems: 'center', justifyContent: 'center' },
  sheetRowTxt:  { fontSize: 15.5, fontWeight: '600', color: C.textPrimary },
  sheetCancel:  { marginTop: 4, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 11, padding: 15, alignItems: 'center' },
  sheetCancelTxt:{ fontSize: 15.5, fontWeight: '700', color: C.slate },
});
