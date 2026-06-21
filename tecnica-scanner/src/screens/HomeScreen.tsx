import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useStore } from '@/store/useStore';
import { T } from '@/constants/data';
import { C, TONES } from '@/constants/colors';
import LangSwitcher from '@/components/LangSwitcher';
import Toast from '@/components/Toast';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { lang, user, setUser, recentIds } = useStore();
  const t = T[lang];
  const isAuth = !!user;

  return (
    <View style={{ flex: 1, backgroundColor: C.bgWarm }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={s.header}>
            <Image source={require('../../assets/tecnica-logo.png')} style={s.logo} resizeMode="contain" />
            <LangSwitcher />
          </View>

          {/* Auth card */}
          <View style={s.section}>
            <View style={s.card}>
              {isAuth ? (
                <View style={s.authRow}>
                  <View style={s.greenDot} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.authHint}>{t.signedInAs}</Text>
                    <Text style={s.authEmail} numberOfLines={1}>{user.email}</Text>
                  </View>
                  <TouchableOpacity style={s.smallBtn} onPress={() => { setUser(null); navigation.replace('Landing'); }}>
                    <Text style={s.smallBtnText}>{t.signOut}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={s.authRow}>
                  <View style={s.lockBox}>
                    <Text style={{ fontSize: 14 }}>🔒</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.guestTitle}>{t.guest}</Text>
                    <Text style={s.guestSub}>{t.guestSub}</Text>
                  </View>
                  <TouchableOpacity style={s.signInBtn} onPress={() => navigation.navigate('Login', {})}>
                    <Text style={s.signInBtnText}>{t.signIn}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Scan CTA */}
          <View style={[s.section, { paddingTop: 4 }]}>
            <TouchableOpacity style={s.scanBtn} onPress={() => navigation.navigate('Scanning', {})}>
              <View style={s.scanIcon}>
                <Text style={{ fontSize: 26 }}>⬛</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.scanTitle}>{t.scan}</Text>
                <Text style={s.scanHint}>{t.scanHint}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Auth-gated menu */}
          {isAuth && (
            <View style={s.section}>
              {[
                { key: 'reg',    bg: C.orange,    title: t.regEntry,   sub: t.regEntrySub,   onPress: () => navigation.navigate('Register') },
                { key: 'admin',  bg: C.charcoal,  title: t.createTag,  sub: t.adminSub ?? '', onPress: () => navigation.navigate('Admin') },
                { key: 'lanci',  bg: C.blueDark,  title: t.lanciEntry, sub: t.lanciEntrySub, onPress: () => navigation.navigate('Lancios') },
                { key: 'batch',  bg: C.slate,     title: t.batchEntry, sub: t.batchEntrySub, onPress: () => navigation.navigate('Batch') },
              ].map((item, i) => (
                <TouchableOpacity key={item.key} style={[s.menuRow, i > 0 && { marginTop: 10 }]} onPress={item.onPress}>
                  <View style={[s.menuIcon, { backgroundColor: item.bg }]}>
                    <Text style={{ color: '#fff', fontSize: 18 }}>▶</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.menuTitle}>{item.title}</Text>
                    <Text style={s.menuSub}>{item.sub}</Text>
                  </View>
                  <Text style={s.chevron}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Recent scans */}
          <View style={[s.section, { paddingBottom: 30 }]}>
            <Text style={s.sectionLabel}>{t.recent}</Text>
            {recentIds.length === 0 ? (
              <View style={s.emptyBox}>
                <Text style={s.emptyText}>{t.noRecent}</Text>
              </View>
            ) : (
              recentIds.map((id) => (
                <TouchableOpacity
                  key={id}
                  style={s.recentRow}
                  onPress={() => navigation.navigate('Result', { assetId: id })}
                >
                  <View style={[s.dot, { backgroundColor: C.blueInfo }]} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.recentName} numberOfLines={1}>{id}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

        </ScrollView>
      </SafeAreaView>
      <Toast />
    </View>
  );
}

const s = StyleSheet.create({
  header:      { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: C.border, paddingTop: 16, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo:        { height: 30, width: 120 },
  section:     { paddingHorizontal: 20, paddingTop: 18 },
  card:        { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, paddingHorizontal: 14 },
  authRow:     { flexDirection: 'row', alignItems: 'center', gap: 11 },
  greenDot:    { width: 9, height: 9, borderRadius: 5, backgroundColor: C.green },
  authHint:    { fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: C.textMuted, fontFamily: 'monospace' },
  authEmail:   { fontSize: 14, color: C.textPrimary },
  smallBtn:    { borderWidth: 1, borderColor: '#D8D8D2', backgroundColor: '#fff', borderRadius: 7, paddingHorizontal: 12, paddingVertical: 7 },
  smallBtnText:{ fontSize: 12, fontWeight: '600', color: C.slate },
  lockBox:     { width: 30, height: 30, borderRadius: 7, backgroundColor: '#F0F0EC', alignItems: 'center', justifyContent: 'center' },
  guestTitle:  { fontSize: 14, fontWeight: '600', color: C.textPrimary },
  guestSub:    { fontSize: 11.5, color: C.textMuted },
  signInBtn:   { backgroundColor: C.blueDark, borderRadius: 7, paddingHorizontal: 13, paddingVertical: 8 },
  signInBtnText:{ fontSize: 12, fontWeight: '600', color: '#fff' },
  scanBtn:     { backgroundColor: C.orange, borderRadius: 14, padding: 22, flexDirection: 'row', alignItems: 'center', gap: 16, shadowColor: C.orange, shadowOpacity: 0.34, shadowRadius: 22, shadowOffset: { width: 0, height: 8 } },
  scanIcon:    { width: 50, height: 50, borderRadius: 11, backgroundColor: 'rgba(255,255,255,.18)', alignItems: 'center', justifyContent: 'center' },
  scanTitle:   { fontSize: 19, fontWeight: '700', color: '#fff' },
  scanHint:    { fontSize: 12.5, color: 'rgba(255,255,255,.9)', marginTop: 2, lineHeight: 17 },
  menuRow:     { backgroundColor: '#fff', borderWidth: 1, borderColor: '#D8D8D2', borderRadius: 12, padding: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 13 },
  menuIcon:    { width: 38, height: 38, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  menuTitle:   { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  menuSub:     { fontSize: 12, color: C.textMuted, marginTop: 1 },
  chevron:     { fontSize: 22, color: '#C8C8C2' },
  sectionLabel:{ fontSize: 11, fontWeight: '700', letterSpacing: 1.44, textTransform: 'uppercase', color: C.textMuted, fontFamily: 'monospace' },
  emptyBox:    { marginTop: 11, borderWidth: 1, borderColor: '#D2D2CC', borderStyle: 'dashed', borderRadius: 10, padding: 26, alignItems: 'center' },
  emptyText:   { fontSize: 13, color: '#9AA0A2', textAlign: 'center', lineHeight: 19 },
  recentRow:   { marginTop: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 13, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot:         { width: 9, height: 9, borderRadius: 5 },
  recentName:  { fontSize: 14.5, fontWeight: '600', color: C.textPrimary },
});
