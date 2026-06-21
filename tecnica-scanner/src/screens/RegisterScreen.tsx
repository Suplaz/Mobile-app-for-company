import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useStore } from '@/store/useStore';
import { T } from '@/constants/data';
import { C } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import Toast from '@/components/Toast';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const { lang, user, reg, setReg, resetReg, showToast } = useStore();
  const t = T[lang];

  async function handleConfirm() {
    if (!reg.material || !reg.location) return;
    const who = user?.email ?? '—';
    // Update asset zone in Supabase
    await supabase.from('assets').update({ zone: reg.location, updated_at: new Date().toISOString() }).eq('id', reg.material);
    await supabase.from('asset_history').insert([
      { asset_id: reg.material, what: 'Registered to ' + reg.location, who },
      { asset_id: reg.location, what: reg.material + ' stored here',   who },
    ]);
    await supabase.from('registrations').insert({
      material_id: reg.material, location_id: reg.location, registered_by: user?.id,
    });
    setReg({ done: true });
    showToast(t.regDone ?? 'Registered');
  }

  if (reg.done) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bgWarm }}>
        <SafeAreaView edges={['top']} style={s.hdr}>
          <TouchableOpacity style={s.backBtn} onPress={() => { resetReg(); navigation.goBack(); }}>
            <Text style={s.backTxt}>‹ {t.back}</Text>
          </TouchableOpacity>
          <Text style={s.title}>{t.regTitle}</Text>
        </SafeAreaView>
        <View style={s.doneArea}>
          <View style={s.doneCircle}><Text style={{ fontSize: 36 }}>✅</Text></View>
          <Text style={s.doneTitle}>{t.regDoneTitle}</Text>
          <Text style={s.doneMsg}>{(t.regDoneMsg ?? '').replace('{m}', reg.material ?? '').replace('{l}', reg.location ?? '')}</Text>
          <View style={s.doneBtns}>
            <TouchableOpacity style={s.viewBtn} onPress={() => { const id = reg.material; resetReg(); navigation.navigate('Result', { assetId: id! }); }}>
              <Text style={s.viewBtnTxt}>{t.viewItem}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.anotherBtn} onPress={() => resetReg()}>
              <Text style={s.anotherBtnTxt}>{t.regAnother}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Toast />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bgWarm }}>
      <SafeAreaView edges={['top']} style={s.hdr}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>‹ {t.back}</Text>
        </TouchableOpacity>
        <Text style={s.title}>{t.regTitle}</Text>
        <Text style={s.sub}>{t.regSub}</Text>
      </SafeAreaView>

      <ScrollView contentContainerStyle={s.body}>
        {/* Step 1 — Material */}
        <View style={s.card}>
          <View style={s.stepRow}>
            <View style={s.stepNum}><Text style={s.stepNumTxt}>1</Text></View>
            <Text style={s.stepLabel}>{t.stepMaterial}</Text>
          </View>
          {reg.material ? (
            <View style={s.setRow}>
              <Text style={{ fontSize: 20 }}>✅</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.setName}>{reg.material}</Text>
              </View>
              <TouchableOpacity style={s.rescanBtn} onPress={() => navigation.navigate('Scanning', { mode: 'reg-material' })}>
                <Text style={s.rescanTxt}>{t.rescan}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={s.scanDash} onPress={() => navigation.navigate('Scanning', { mode: 'reg-material' })}>
              <Text style={s.scanDashTxt}>◼  {t.scanMaterial}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Step 2 — Location */}
        <View style={s.card}>
          <View style={s.stepRow}>
            <View style={s.stepNum}><Text style={s.stepNumTxt}>2</Text></View>
            <Text style={s.stepLabel}>{t.stepLocation}</Text>
          </View>
          {reg.location ? (
            <View style={[s.setRow, { backgroundColor: C.blueLight, borderColor: '#CBDEEA' }]}>
              <Text style={{ fontSize: 20 }}>📍</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.setName, { color: C.blueInfo }]}>{reg.location}</Text>
              </View>
              <TouchableOpacity style={[s.rescanBtn, { borderColor: '#C2D6E4' }]} onPress={() => navigation.navigate('Scanning', { mode: 'reg-location' })}>
                <Text style={[s.rescanTxt, { color: C.blueInfo }]}>{t.rescan}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={s.scanDash} onPress={() => navigation.navigate('Scanning', { mode: 'reg-location' })}>
              <Text style={s.scanDashTxt}>📍  {t.scanLocation}</Text>
            </TouchableOpacity>
          )}
        </View>

        {reg.material && reg.location && (
          <TouchableOpacity style={s.confirmBtn} onPress={handleConfirm}>
            <Text style={s.confirmBtnTxt}>{t.confirmReg}</Text>
          </TouchableOpacity>
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
  stepRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepNum:     { width: 24, height: 24, borderRadius: 12, backgroundColor: C.charcoal, alignItems: 'center', justifyContent: 'center' },
  stepNumTxt:  { color: '#fff', fontSize: 13, fontWeight: '700' },
  stepLabel:   { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: C.textMuted, fontFamily: 'monospace' },
  setRow:      { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.greenLight, borderWidth: 1, borderColor: '#CDE6D5', borderRadius: 10, padding: 12, paddingHorizontal: 14 },
  setName:     { fontSize: 14.5, fontWeight: '700', color: C.textPrimary },
  rescanBtn:   { borderWidth: 1, borderColor: '#C7DCCD', backgroundColor: '#fff', borderRadius: 7, paddingHorizontal: 11, paddingVertical: 7 },
  rescanTxt:   { fontSize: 11.5, fontWeight: '700', color: C.green },
  scanDash:    { marginTop: 12, borderWidth: 1.5, borderColor: '#D2D2CC', borderStyle: 'dashed', backgroundColor: '#FAFAF8', borderRadius: 10, padding: 16, alignItems: 'center', justifyContent: 'center' },
  scanDashTxt: { fontSize: 14, fontWeight: '600', color: C.slate },
  confirmBtn:  { backgroundColor: C.orange, borderRadius: 11, padding: 15, alignItems: 'center', shadowColor: C.orange, shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  confirmBtnTxt:{ color: '#fff', fontSize: 15, fontWeight: '700' },
  doneArea:    { flex: 1, padding: 34, paddingHorizontal: 26, alignItems: 'center' },
  doneCircle:  { width: 78, height: 78, borderRadius: 39, backgroundColor: C.greenLight, alignItems: 'center', justifyContent: 'center' },
  doneTitle:   { fontSize: 20, fontWeight: '700', color: C.textPrimary, marginTop: 18 },
  doneMsg:     { fontSize: 14, color: C.textSecondary, marginTop: 8, textAlign: 'center', lineHeight: 21, maxWidth: 290 },
  doneBtns:    { marginTop: 24, width: '100%', maxWidth: 320, gap: 10 },
  viewBtn:     { backgroundColor: C.blueDark, borderRadius: 10, padding: 14, alignItems: 'center' },
  viewBtnTxt:  { color: '#fff', fontSize: 15, fontWeight: '700' },
  anotherBtn:  { backgroundColor: '#fff', borderWidth: 1, borderColor: '#D8D8D2', borderRadius: 10, padding: 13, alignItems: 'center' },
  anotherBtnTxt:{ color: C.slate, fontSize: 14.5, fontWeight: '600' },
});
