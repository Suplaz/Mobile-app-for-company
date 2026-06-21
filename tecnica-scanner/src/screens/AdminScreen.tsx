import React, { useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Image,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useStore } from '@/store/useStore';
import { T, LANCIOS, QR_HOST, STAGES } from '@/constants/data';
import { C } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import Toast from '@/components/Toast';

type Props = NativeStackScreenProps<RootStackParamList, 'Admin'>;

const TYPES = ['Pallet', 'Machine', 'Location'] as const;

export default function AdminScreen({ navigation }: Props) {
  const { lang, adminForm, setAdminForm, resetAdminForm, user, showToast } = useStore();
  const t = T[lang];
  const f = adminForm;

  const qrValue = `https://${QR_HOST}/${f.id || 'preview'}`;

  async function handleSave() {
    if (!f.name.trim() || !f.id.trim()) return;
    const { error } = await supabase.from('assets').insert({
      id: f.id.trim(), name: f.name.trim(), kind: f.type,
      access: f.access, zone: f.zone, stage: f.stage,
      status_key: 's_inProduction', tone: 'info', created_by: user?.id,
    });
    if (error) { showToast('Error: ' + error.message); return; }
    await supabase.from('asset_history').insert({
      asset_id: f.id.trim(), what: 'Tag created', who: user?.email ?? '—',
    });
    showToast(t.tagCreated);
    resetAdminForm();
    navigation.goBack();
  }

  const accPublicStyle  = [s.pill, f.access === 'public'     ? s.pillActive : s.pillInactive];
  const accRestrictedStyle = [s.pill, f.access === 'restricted' ? s.pillActive : s.pillInactive];

  return (
    <View style={{ flex: 1, backgroundColor: C.bgWarm }}>
      <SafeAreaView edges={['top']} style={s.hdr}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>‹ {t.back}</Text>
        </TouchableOpacity>
        <Text style={s.title}>{t.adminTitle}</Text>
        <Text style={s.sub}>{t.adminSub}</Text>
      </SafeAreaView>

      <ScrollView contentContainerStyle={s.body}>

        {/* Quick-fill from Lancio */}
        <View style={s.card}>
          <Text style={s.label}>{t.orderFill}</Text>
          <Text style={s.subLabel}>{t.orderFillSub}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            {LANCIOS.map((L, i) => (
              <TouchableOpacity
                key={i}
                style={s.lancioChip}
                onPress={() => setAdminForm({ name: L.m, id: 'TSKB' + L.y + L.cn, type: 'Pallet', access: 'public', stage: 'packaging' })}
              >
                <Text style={s.chipN}>Lancio {L.n}</Text>
                <Text style={s.chipModel} numberOfLines={1}>{L.m}</Text>
                <Text style={s.chipPaia}>{L.pa} paia</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Form */}
        <View style={s.card}>
          <Text style={s.label}>{t.fName}</Text>
          <TextInput style={s.input} value={f.name} onChangeText={(v) => setAdminForm({ name: v })} placeholder="Mach1 LV Boot Shells" placeholderTextColor="#B0B5B6" />

          <Text style={[s.label, { marginTop: 16 }]}>{t.fId}</Text>
          <TextInput style={[s.input, { fontFamily: 'monospace' }]} value={f.id} onChangeText={(v) => setAdminForm({ id: v })} placeholder="PL-2287" placeholderTextColor="#B0B5B6" autoCapitalize="characters" />
          <Text style={s.hint}>{t.idHint}</Text>

          <Text style={[s.label, { marginTop: 16 }]}>{t.fType}</Text>
          <View style={{ flexDirection: 'row', gap: 7 }}>
            {TYPES.map((tp) => (
              <TouchableOpacity
                key={tp}
                style={[s.pill, f.type === tp ? s.pillActive : s.pillInactive]}
                onPress={() => setAdminForm({ type: tp as any })}
              >
                <Text style={[s.pillTxt, { color: f.type === tp ? '#B5560A' : C.slate }]}>{tp}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[s.label, { marginTop: 16 }]}>{t.fStage}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
            {STAGES.map((st) => (
              <TouchableOpacity
                key={st}
                style={[s.pill, f.stage === st ? s.pillActive : s.pillInactive]}
                onPress={() => setAdminForm({ stage: st })}
              >
                <Text style={[s.pillTxt, { color: f.stage === st ? '#B5560A' : C.slate }]}>{t['stage_' + st] ?? st}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[s.label, { marginTop: 16 }]}>{t.fAccess}</Text>
          <View style={{ flexDirection: 'row', gap: 7 }}>
            <TouchableOpacity style={accPublicStyle}     onPress={() => setAdminForm({ access: 'public' })}>
              <Text style={[s.pillTxt, { color: f.access === 'public' ? '#B5560A' : C.slate }]}>{t.publicTag}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={accRestrictedStyle} onPress={() => setAdminForm({ access: 'restricted' })}>
              <Text style={[s.pillTxt, { color: f.access === 'restricted' ? '#B5560A' : C.slate }]}>{t.restrictedTag}</Text>
            </TouchableOpacity>
          </View>
          {f.access === 'public' && (
            <View style={s.infoNote}><Text style={s.infoNoteTxt}>ℹ  {t.helpPublic}</Text></View>
          )}
          {f.access === 'restricted' && (
            <View style={[s.infoNote, { backgroundColor: C.redLight }]}>
              <Text style={[s.infoNoteTxt, { color: C.red }]}>🔒  {t.helpRestricted}</Text>
            </View>
          )}

          <Text style={[s.label, { marginTop: 16 }]}>{t.fZone}</Text>
          <TextInput style={s.input} value={f.zone} onChangeText={(v) => setAdminForm({ zone: v })} placeholder="Hall B · Rack B-04 · Level 3" placeholderTextColor="#B0B5B6" />
        </View>

        {/* QR Preview */}
        <Text style={s.sectionLabel}>{t.labelPreview}</Text>
        <View style={[s.card, { alignItems: 'center' }]}>
          <Image source={require('../../assets/tecnica-logo.png')} style={{ height: 22, width: 80 }} resizeMode="contain" />
          <View style={s.qrWrap}>
            <QRCode value={qrValue} size={160} />
          </View>
          <Text style={s.qrId}>{f.id || 'ID'}</Text>
          <Text style={s.qrName}>{f.name || 'Asset name'}</Text>
          <View style={[s.pill, { marginTop: 11, alignSelf: 'center', backgroundColor: f.access === 'public' ? C.blueLight : C.redLight }]}>
            <Text style={[s.pillTxt, { color: f.access === 'public' ? C.blueInfo : C.red }]}>{f.access === 'public' ? t.publicTag : t.restrictedTag}</Text>
          </View>
          <View style={s.urlWrap}>
            <Text style={s.urlLabel}>{t.encLink}</Text>
            <Text style={s.urlVal}>{qrValue}</Text>
          </View>
        </View>

        <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
          <Text style={s.saveBtnTxt}>{t.addToScanner}</Text>
        </TouchableOpacity>

      </ScrollView>
      <Toast />
    </View>
  );
}

const s = StyleSheet.create({
  hdr:        { backgroundColor: C.charcoal, paddingHorizontal: 20, paddingBottom: 22 },
  backBtn:    { backgroundColor: 'rgba(255,255,255,.14)', alignSelf: 'flex-start', paddingHorizontal: 13, paddingVertical: 8, borderRadius: 8, marginTop: 8 },
  backTxt:    { color: '#fff', fontSize: 13, fontWeight: '600' },
  title:      { fontSize: 23, fontWeight: '700', color: '#fff', marginTop: 16 },
  sub:        { fontSize: 13, color: 'rgba(255,255,255,.65)', marginTop: 5 },
  body:       { padding: 18, paddingHorizontal: 20, paddingBottom: 36, gap: 14 },
  card:       { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 18, paddingHorizontal: 16 },
  label:      { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: C.textMuted, fontFamily: 'monospace', marginBottom: 7 },
  subLabel:   { fontSize: 11.5, color: '#9AA0A2', marginTop: 3 },
  input:      { borderWidth: 1, borderColor: '#D8D8D2', borderRadius: 9, padding: 12, paddingHorizontal: 14, fontSize: 15, color: C.textPrimary, backgroundColor: '#FAFAF8' },
  hint:       { fontSize: 11, color: '#9AA0A2', marginTop: 6 },
  pill:       { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  pillActive: { borderColor: C.orange, backgroundColor: C.orangeLight },
  pillInactive:{ borderColor: '#D8D8D2', backgroundColor: '#fff' },
  pillTxt:    { fontSize: 13, fontWeight: '600' },
  infoNote:   { marginTop: 9, backgroundColor: C.blueLight, borderRadius: 8, padding: 9, paddingHorizontal: 11 },
  infoNoteTxt:{ fontSize: 12, color: C.blueInfo, lineHeight: 17 },
  sectionLabel:{ fontSize: 11, fontWeight: '700', letterSpacing: 1.44, textTransform: 'uppercase', color: C.textMuted, fontFamily: 'monospace', paddingHorizontal: 2 },
  qrWrap:     { marginTop: 16, borderWidth: 1, borderColor: '#ECECE6', borderRadius: 8, padding: 8, backgroundColor: '#fff' },
  qrId:       { fontSize: 19, fontWeight: '700', color: C.textPrimary, fontFamily: 'monospace', marginTop: 16, letterSpacing: 0.2 },
  qrName:     { fontSize: 13.5, color: C.slate, marginTop: 3 },
  urlWrap:    { marginTop: 14, width: '100%', borderTopWidth: 1, borderTopColor: C.borderLight, paddingTop: 11 },
  urlLabel:   { fontSize: 9.5, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: C.textFaint, fontFamily: 'monospace' },
  urlVal:     { fontSize: 11, color: C.textMuted, fontFamily: 'monospace', marginTop: 3, lineHeight: 16 },
  lancioChip: { width: 148, backgroundColor: '#F7F7F3', borderWidth: 1, borderColor: C.border, borderRadius: 9, padding: 11, paddingHorizontal: 12, marginRight: 9 },
  chipN:      { fontSize: 12, fontWeight: '800', color: C.blueDark },
  chipModel:  { fontSize: 11, fontWeight: '600', color: C.textPrimary, marginTop: 3 },
  chipPaia:   { fontSize: 10, color: C.textMuted, fontFamily: 'monospace', marginTop: 2 },
  saveBtn:    { backgroundColor: C.orange, borderRadius: 11, padding: 15, alignItems: 'center', shadowColor: C.orange, shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  saveBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
