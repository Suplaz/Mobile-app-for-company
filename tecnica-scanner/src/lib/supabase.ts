import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Fill these from your Supabase project settings ─────────
// Project Settings → API → Project URL & anon public key
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── Helper: get current user profile ───────────────────────
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

// ─── Helper: get signed URL for a Storage file ───────────────
export async function getDocumentUrl(storagePath: string): Promise<string | null> {
  const { data } = await supabase.storage
    .from('documents')
    .createSignedUrl(storagePath, 3600); // 1 hour TTL
  return data?.signedUrl ?? null;
}

export async function getLancioUrl(storagePath: string): Promise<string | null> {
  const { data } = await supabase.storage
    .from('lancios')
    .createSignedUrl(storagePath, 3600);
  return data?.signedUrl ?? null;
}
