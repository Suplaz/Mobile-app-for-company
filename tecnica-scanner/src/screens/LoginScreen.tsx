import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { T, COMPANY_DOMAIN } from '@/constants/data';
import { C } from '@/constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { lang, setUser } = useStore();
  const t = T[lang];

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSignIn() {
    setError('');
    const e = email.trim().toLowerCase();
    if (!e.endsWith(COMPANY_DOMAIN.toLowerCase()) || !password) {
      setError(t.wrongDomain); return;
    }
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: e, password });
    setLoading(false);
    if (authError) { setError(authError.message); return; }
    if (data.user) {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      setUser({ id: data.user.id, email: e, role: prof?.role ?? 'worker' });
      navigation.goBack();
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bgWarm }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={s.hdr}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backTxt}>‹ {t.back}</Text>
          </TouchableOpacity>
          <Text style={s.title}>{t.loginTitle}</Text>
          <Text style={s.sub}>{t.loginSub}</Text>
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={s.body}>
            <View style={s.card}>
              <Text style={s.label}>{t.emailL}</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                placeholder="name@tecnicagroup.hu"
                placeholderTextColor="#B0B5B6"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text style={[s.label, { marginTop: 16 }]}>{t.passwordL}</Text>
              <TextInput
                style={s.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#B0B5B6"
                secureTextEntry
              />
              {!!error && <Text style={s.error}>⚠ {error}</Text>}
              <TouchableOpacity style={s.btn} onPress={handleSignIn} disabled={loading}>
                <Text style={s.btnTxt}>{loading ? '…' : t.signIn}</Text>
              </TouchableOpacity>
            </View>
            <View style={s.note}>
              <Text style={s.noteTxt}>ℹ  {t.loginNote}</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  hdr:     { backgroundColor: C.charcoal, paddingHorizontal: 20, paddingBottom: 22 },
  backBtn: { backgroundColor: 'rgba(255,255,255,.14)', alignSelf: 'flex-start', paddingHorizontal: 13, paddingVertical: 8, borderRadius: 8, marginTop: 8 },
  backTxt: { color: '#fff', fontSize: 13, fontWeight: '600' },
  title:   { fontSize: 23, fontWeight: '700', color: '#fff', marginTop: 16 },
  sub:     { fontSize: 13, color: 'rgba(255,255,255,.65)', marginTop: 5 },
  body:    { padding: 20, gap: 14 },
  card:    { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 18, paddingHorizontal: 16 },
  label:   { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: C.textMuted, fontFamily: 'monospace', marginBottom: 7 },
  input:   { borderWidth: 1, borderColor: '#D8D8D2', borderRadius: 9, padding: 13, paddingHorizontal: 14, fontSize: 15, color: C.textPrimary, backgroundColor: '#FAFAF8' },
  error:   { color: C.red, fontSize: 12.5, marginTop: 12 },
  btn:     { marginTop: 20, backgroundColor: C.orange, borderRadius: 10, padding: 14, alignItems: 'center', shadowColor: C.orange, shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  btnTxt:  { color: '#fff', fontSize: 15, fontWeight: '700' },
  note:    { backgroundColor: C.blueLight, borderRadius: 10, padding: 13, paddingHorizontal: 14, flexDirection: 'row', gap: 7 },
  noteTxt: { fontSize: 12, color: C.blueInfo, lineHeight: 18, flex: 1 },
});
