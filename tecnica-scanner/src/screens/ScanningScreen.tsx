import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, FlatList, Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useStore } from '@/store/useStore';
import { T } from '@/constants/data';
import { C } from '@/constants/colors';
import { supabase } from '@/lib/supabase';

type Props = NativeStackScreenProps<RootStackParamList, 'Scanning'>;

const DEMO_TAGS = [
  { id: 'PL-2287', name: 'Mach1 LV Boot Shells',    access: 'public',     tone: 'info'      },
  { id: 'CG-3301', name: 'Mach1 LV 130 · 28.0',     access: 'public',     tone: 'info'      },
  { id: 'CG-3302', name: 'Cochise 110 · 29.0',       access: 'public',     tone: 'info'      },
  { id: 'CNC-07',  name: 'CNC Mill #07',             access: 'restricted', tone: 'attention' },
  { id: 'LOC-T1-RAMPA',    name: 'Rampa T1 csarnok',        access: 'public', tone: 'ok' },
  { id: 'LOC-T1-RAKTAR',   name: 'T1 raktár',               access: 'public', tone: 'ok' },
  { id: 'LOC-T2-RAKTAR',   name: 'T2 raktár',               access: 'public', tone: 'attention' },
  { id: 'LOC-SUPERMARKET', name: 'Plasztika Szupermarket',   access: 'public', tone: 'ok' },
];

const ACC = { public: { fg: C.blueInfo, bg: C.blueLight, label: 'Public' }, restricted: { fg: C.red, bg: C.redLight, label: 'Restricted' } } as const;

export default function ScanningScreen({ navigation, route }: Props) {
  const { lang, addRecent, scanMode, setScanMode, setReg, reg } = useStore();
  const t = T[lang];
  const mode = route.params?.mode ?? scanMode ?? 'view';

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const sweepY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!permission?.granted) requestPermission();
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(sweepY, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(sweepY, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  function handleScan(id: string) {
    if (mode === 'reg-material') {
      setReg({ material: id });
      navigation.goBack();
    } else if (mode === 'reg-location') {
      setReg({ location: id });
      navigation.goBack();
    } else {
      addRecent(id);
      navigation.replace('Result', { assetId: id, fromScan: true });
    }
  }

  function onBarCodeScanned({ data }: { data: string }) {
    if (scanned) return;
    setScanned(true);
    // Parse asset ID from URL: https://scan.tecnicagroup.hu/{id}
    const parts = data.split('/');
    const id = parts[parts.length - 1];
    handleScan(id);
  }

  const sweepTranslate = sweepY.interpolate({
    inputRange: [0, 1], outputRange: [0, 200],
  });

  const filteredDemo = mode === 'reg-location'
    ? DEMO_TAGS.filter(d => d.id.startsWith('LOC'))
    : mode === 'reg-material'
    ? DEMO_TAGS.filter(d => !d.id.startsWith('LOC') && d.id !== 'CNC-07')
    : DEMO_TAGS;

  return (
    <View style={s.bg}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Top bar */}
        <View style={s.topBar}>
          <TouchableOpacity style={s.closeBtn} onPress={() => navigation.goBack()}>
            <Text style={s.closeTxt}>✕</Text>
          </TouchableOpacity>
          <View style={s.titleRow}>
            <Animated.View style={[s.pulseDot, { opacity: sweepY }]} />
            <Text style={s.titleTxt}>{t.scanningT}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Viewfinder */}
        <View style={s.viewfinderArea}>
          <View style={s.viewfinder}>
            {permission?.granted ? (
              <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                onBarcodeScanned={scanned ? undefined : onBarCodeScanned}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              />
            ) : (
              <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 13 }}>Camera permission needed</Text>
              </View>
            )}
            {/* Corner brackets */}
            <View style={[s.corner, s.tl]} /><View style={[s.corner, s.tr]} />
            <View style={[s.corner, s.bl]} /><View style={[s.corner, s.br]} />
            {/* Sweep line */}
            <Animated.View style={[s.sweep, { transform: [{ translateY: sweepTranslate }] }]} />
          </View>
          <Text style={s.hint}>{t.scanHint}</Text>
        </View>

        {/* Demo tags */}
        <View style={s.panel}>
          <Text style={s.demoLabel}>{t.tapDemo}</Text>
          <FlatList
            data={filteredDemo}
            keyExtractor={d => d.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 9 }} />}
            renderItem={({ item }) => {
              const ac = ACC[item.access as keyof typeof ACC];
              return (
                <TouchableOpacity style={s.demoRow} onPress={() => handleScan(item.id)}>
                  <View style={s.demoIcon}><Text style={{ color: '#fff', fontSize: 13 }}>◼</Text></View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.demoName} numberOfLines={1}>{item.name}</Text>
                    <Text style={s.demoId}>{item.id}</Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: ac.bg }]}>
                    <Text style={[s.badgeText, { color: ac.fg }]}>{ac.label}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  bg:            { flex: 1, backgroundColor: C.scanBg },
  topBar:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 6 },
  closeBtn:      { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center' },
  closeTxt:      { color: '#fff', fontSize: 16, fontWeight: '600' },
  titleRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pulseDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: C.orange },
  titleTxt:      { color: '#fff', fontSize: 15, fontWeight: '600' },
  viewfinderArea:{ flex: 1, alignItems: 'center', justifyContent: 'center' },
  viewfinder:    { width: 236, height: 236, position: 'relative', overflow: 'hidden' },
  corner:        { position: 'absolute', width: 36, height: 36, borderColor: C.orange, borderWidth: 3 },
  tl:            { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 6 },
  tr:            { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 6 },
  bl:            { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 6 },
  br:            { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 6 },
  sweep:         { position: 'absolute', left: '8%', right: '8%', height: 2, backgroundColor: C.orange, shadowColor: C.orange, shadowOpacity: 0.6, shadowRadius: 12 },
  hint:          { color: 'rgba(255,255,255,.55)', fontSize: 13, marginTop: 26, textAlign: 'center', maxWidth: 240, lineHeight: 19 },
  panel:         { backgroundColor: C.scanPanel, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.08)', padding: 16, paddingHorizontal: 18, paddingBottom: 30 },
  demoLabel:     { fontSize: 10, fontWeight: '700', letterSpacing: 1.44, textTransform: 'uppercase', color: C.orange, fontFamily: 'monospace', marginBottom: 11 },
  demoRow:       { backgroundColor: 'rgba(255,255,255,.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,.12)', borderRadius: 9, padding: 11, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  demoIcon:      { width: 30, height: 30, borderRadius: 6, backgroundColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center' },
  demoName:      { color: '#fff', fontSize: 13.5, fontWeight: '600' },
  demoId:        { color: 'rgba(255,255,255,.45)', fontSize: 10.5, fontFamily: 'monospace', marginTop: 1 },
  badge:         { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  badgeText:     { fontSize: 9.5, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: 'monospace' },
});
