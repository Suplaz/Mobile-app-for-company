import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, Animated, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { T, COMPANY_DOMAIN } from '@/constants/data';
import { C } from '@/constants/colors';
import LangSwitcher from '@/components/LangSwitcher';

type Props = NativeStackScreenProps<RootStackParamList, 'Landing'>;

export default function LandingScreen({ navigation }: Props) {
  const { lang, setUser } = useStore();
  const t = T[lang];

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  // Animations
  const logoScale  = useRef(new Animated.Value(0.82)).current;
  const logoOpac   = useRef(new Animated.Value(0)).current;
  const sheetY     = useRef(new Animated.Value(26)).current;
  const sheetOpac  = useRef(new Animated.Value(0)).current;
  const taglineOpac = useRef(new Animated.Value(0)).current;
  const ring1Scale = useRef(new Animated.Value(0.85)).current;
  const ring1Opac  = useRef(new Animated.Value(0.55)).current;
  const ring2Scale = useRef(new Animated.Value(0.85)).current;
  const ring2Opac  = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoScale, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(logoOpac,  { toValue: 1, duration: 700, useNativeDriver: true }),
    ]).start();
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(sheetY,     { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(sheetOpac,  { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(taglineOpac,{ toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start();
    }, 280);
    // Pulse rings
    const pulse = (scale: Animated.Value, opac: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(scale, { toValue: 1.3, duration: 1820, useNativeDriver: true }),
            Animated.timing(opac,  { toValue: 0,   duration: 1820, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(scale, { toValue: 0.85, duration: 0, useNativeDriver: true }),
            Animated.timing(opac,  { toValue: 0.55, duration: 0, useNativeDriver: true }),
          ]),
        ])
      ).start();
    pulse(ring1Scale, ring1Opac, 0);
    pulse(ring2Scale, ring2Opac, 1300);
  }, []);

  async function handleSignIn() {
    setError('');
    const e = email.trim().toLowerCase();
    if (!e.endsWith(COMPANY_DOMAIN.toLowerCase()) || !password) {
      setError(t.wrongDomain);
      return;
    }
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: e, password });
    setLoading(false);
    if (authError) { setError(authError.message); return; }
    if (data.user) {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      setUser({ id: data.user.id, email: e, role: prof?.role ?? 'worker' });
      navigation.replace('Home');
    }
  }

  function handleGuest() {
    setUser(null);
    navigation.replace('Home');
  }

  return (
    <View style={s.bg}>
      <SafeAreaView style={s.safe}>
        {/* Language switcher */}
        <View style={s.langRow}>
          <LangSwitcher dark />
        </View>

        {/* Logo area */}
        <View style={s.logoArea}>
          <Animated.View style={[s.ring, { transform: [{ scale: ring1Scale }], opacity: ring1Opac }]} />
          <Animated.View style={[s.ring, s.ring2, { transform: [{ scale: ring2Scale }], opacity: ring2Opac }]} />
          <Animated.View style={[s.card, { transform: [{ scale: logoScale }], opacity: logoOpac }]}>
            <Image source={require('../../assets/tecnica-logo.png')} style={s.logo} resizeMode="contain" />
          </Animated.View>
        </View>

        <Animated.Text style={[s.tagline, { opacity: taglineOpac }]}>
          {t.tagline}
        </Animated.Text>

        {/* Bottom sheet */}
        <Animated.View style={[s.sheet, { transform: [{ translateY: sheetY }], opacity: sheetOpac }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={s.inputLabel}>{t.emailL}</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                placeholder="name@tecnicagroup.hu"
                placeholderTextColor="#B0B5B6"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />

              <Text style={[s.inputLabel, { marginTop: 16 }]}>{t.passwordL}</Text>
              <TextInput
                style={s.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#B0B5B6"
                secureTextEntry
              />

              {!!error && (
                <View style={s.errorRow}>
                  <Text style={s.errorText}>⚠ {error}</Text>
                </View>
              )}

              <TouchableOpacity style={s.signInBtn} onPress={handleSignIn} disabled={loading}>
                <Text style={s.signInLabel}>{loading ? '…' : t.signIn}</Text>
              </TouchableOpacity>

              <View style={s.divider}>
                <View style={s.divLine} />
                <Text style={s.divText}>{t.lOr?.toUpperCase()}</Text>
                <View style={s.divLine} />
              </View>

              <TouchableOpacity style={s.guestBtn} onPress={handleGuest}>
                <Text style={s.guestLabel}>{t.lGuest}</Text>
              </TouchableOpacity>

              <Text style={s.subtitle}>{t.lSubtitle}</Text>
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  bg:        { flex: 1, background: undefined },
  safe:      { flex: 1, backgroundColor: 'transparent' },
  langRow:   { position: 'absolute', top: 50, right: 18, zIndex: 6, flexDirection: 'row' },
  logoArea:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute', width: 152, height: 152, borderRadius: 76,
    borderWidth: 2, borderColor: 'rgba(237,107,6,.55)',
  },
  ring2:     {},
  card: {
    backgroundColor: '#fff', borderRadius: 18, padding: 22, paddingHorizontal: 28,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 54, shadowOffset: { width: 0, height: 20 },
  },
  logo:      { height: 44, width: 160 },
  tagline: {
    color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 3.2,
    textTransform: 'uppercase', fontFamily: 'monospace', textAlign: 'center',
    marginBottom: 28, paddingHorizontal: 20,
  },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 26, paddingHorizontal: 22, paddingBottom: 30,
    shadowColor: '#000', shadowOpacity: 0.24, shadowRadius: 44, shadowOffset: { width: 0, height: -12 },
  },
  inputLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase',
    color: C.textMuted, fontFamily: 'monospace', marginBottom: 7,
  },
  input: {
    width: '100%', padding: 13, paddingHorizontal: 14,
    borderWidth: 1, borderColor: '#D8D8D2', borderRadius: 9,
    fontSize: 15, color: C.textPrimary, backgroundColor: '#FAFAF8',
  },
  errorRow:  { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 7 },
  errorText: { color: C.red, fontSize: 12.5, flex: 1 },
  signInBtn: {
    marginTop: 20, backgroundColor: C.orange, borderRadius: 11,
    padding: 15, alignItems: 'center',
    shadowColor: C.orange, shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
  },
  signInLabel: { color: '#fff', fontSize: 15, fontWeight: '700' },
  divider:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 18 },
  divLine:   { flex: 1, height: 1, backgroundColor: '#ECECE6' },
  divText:   { fontSize: 10.5, color: '#A6ABAD', fontFamily: 'monospace', letterSpacing: 1 },
  guestBtn:  { borderWidth: 1.5, borderColor: '#D2D2CC', borderRadius: 11, padding: 14, alignItems: 'center', backgroundColor: '#fff' },
  guestLabel:{ color: '#3C4042', fontSize: 15, fontWeight: '700' },
  subtitle:  { marginTop: 15, fontSize: 11.5, color: '#9AA0A2', textAlign: 'center', lineHeight: 18 },
});
