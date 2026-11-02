import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

// Default configured credentials from project configuration
const DEFAULT_SUPABASE_URL = 'https://jxuombefpwjgvndbqmlj.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4dW9tYmVmcHdqZ3ZuZGJxbWxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzNjAyNjYsImV4cCI6MjEwODkzNjI2Nn0.Pq_f0QYWOdd8qhqFPxdiIh9DK4MVWBdJB1KMInSf9hY';

export const ADMIN_SESSION_STORAGE_KEY = 'evoting_admin_session_v1';

export function getSupabaseCredentials() {
  const envUrl = typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env.VITE_SUPABASE_URL as string) : undefined;
  const envKey = typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env.VITE_SUPABASE_ANON_KEY as string) : undefined;

  let localUrl = '';
  let localKey = '';
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localUrl = localStorage.getItem('supabase_custom_url') || '';
      localKey = localStorage.getItem('supabase_custom_key') || '';
    } catch (_) {}
  }

  const url = (envUrl || localUrl || DEFAULT_SUPABASE_URL).trim();
  const key = (envKey || localKey || DEFAULT_SUPABASE_ANON_KEY).trim();

  return { url, key };
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(customUrl?: string, customKey?: string): SupabaseClient | null {
  const { url, key } = getSupabaseCredentials();
  const finalUrl = (customUrl || url).trim();
  const finalKey = (customKey || key).trim();

  if (!finalUrl || !finalKey) {
    return null;
  }

  if (!supabaseInstance || customUrl || customKey) {
    supabaseInstance = createClient(finalUrl, finalKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'evoting_supabase_auth_token',
      }
    });
  }

  return supabaseInstance;
}

/**
 * Checks whether the authenticated user has an administrator role.
 * Validates metadata (app_metadata / user_metadata) or admin email patterns.
 */
export async function verifyUserIsAdmin(
  user: User,
  client: SupabaseClient
): Promise<{ isAdmin: boolean; roleName: string; reason?: string }> {
  if (!user) {
    return { isAdmin: false, roleName: 'guest', reason: 'User tidak ditemukan.' };
  }

  // 1. Check user metadata or app metadata
  const appRole = user.app_metadata?.role || user.user_metadata?.role;
  if (appRole === 'admin' || appRole === 'administrator' || appRole === 'superadmin') {
    return { isAdmin: true, roleName: String(appRole) };
  }

  // 2. Check if a role table exists in public schema (admin_roles)
  try {
    const { data: roleRow, error: roleErr } = await client
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!roleErr && roleRow && (roleRow.role === 'admin' || roleRow.role === 'superadmin')) {
      return { isAdmin: true, roleName: roleRow.role };
    }
  } catch (_) {
    // Table may not exist yet, proceed to next checks
  }

  // Check users table for uid match
  try {
    const { data: userRow, error: userErr } = await client
      .from('users')
      .select('role')
      .eq('uid', user.id)
      .maybeSingle();

    if (!userErr && userRow && (userRow.role === 'admin' || userRow.role === 'superadmin')) {
      return { isAdmin: true, roleName: userRow.role };
    }
  } catch (_) {
    // users table check
  }

  // 3. Fallback: Check if user email is recognized administrator
  const email = (user.email || '').toLowerCase();
  if (email.startsWith('admin') || email.includes('admin') || email === 'bahtiar.ar07@gmail.com') {
    return { isAdmin: true, roleName: 'Administrator' };
  }

  return { 
    isAdmin: false, 
    roleName: 'user', 
    reason: 'Akses ditolak: Akun Anda terdaftar tetapi belum memiliki hak akses Administrator (Role: Admin).' 
  };
}

/**
 * Retrieve saved admin session from localStorage if available
 */
export function getSavedAdminSession(): { token: string; admin: any } | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (session && session.token && session.admin) {
      return session;
    }
  } catch (_) {}
  return null;
}

/**
 * Clear saved admin session
 */
export async function clearAdminSession(): Promise<void> {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    } catch (_) {}
  }
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.auth.signOut();
    } catch (_) {}
  }
}
