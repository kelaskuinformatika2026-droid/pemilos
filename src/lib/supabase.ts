import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(url?: string, key?: string): SupabaseClient | null {
  const finalUrl = url || (typeof process !== 'undefined' ? process.env?.SUPABASE_URL : undefined);
  const finalKey = key || (typeof process !== 'undefined' ? (process.env?.SUPABASE_SERVICE_ROLE_KEY || process.env?.SUPABASE_ANON_KEY) : undefined);

  if (!finalUrl || !finalKey) {
    return null;
  }

  if (!supabaseInstance || url || key) {
    supabaseInstance = createClient(finalUrl, finalKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
  }

  return supabaseInstance;
}
