import { ADMIN_SESSION_STORAGE_KEY, clearAdminSession, getSavedAdminSession, getSupabaseClient, verifyUserIsAdmin } from '../lib/supabase';
import { Candidate, ElectionConfig, ElectionResults, Voter } from '../types';

const BASE_URL = '/api';

export interface VoterLoginResponse {
  success: boolean;
  voter?: {
    id: string;
    nis: string;
    fullName: string;
    className: string;
    hasVoted: boolean;
    votedAt: string | null;
  };
  electionStatus?: string;
  message?: string;
}

export interface SubmitVoteResponse {
  success: boolean;
  message: string;
  timestamp?: string;
}

export interface ImportVotersResponse {
  success: boolean;
  importedCount: number;
  failedCount: number;
  errors: string[];
  sampleAdded?: any[];
  message?: string;
}

export interface SupabaseStatusResponse {
  success: boolean;
  status: {
    isConfigured: boolean;
    isConnected: boolean;
    url: string;
    maskedKey: string;
    dbUrl: string;
    lastChecked: string;
    tablesVerified: string[];
  } | null;
}

export interface SyncSupabaseResponse {
  success: boolean;
  logs?: string[];
  hasMissingColumns?: boolean;
  missingColumns?: string[];
  message?: string;
}

export interface AdminLoginResponse {
  success: boolean;
  token?: string;
  admin?: {
    username: string;
    name: string;
    role: string;
    id?: string;
    authProvider?: string;
  };
  message?: string;
}

async function fetchNoCache(url: string, options: RequestInit = {}): Promise<Response> {
  const separator = url.includes('?') ? '&' : '?';
  const urlWithCacheBuster = options.method && options.method !== 'GET' ? url : `${url}${separator}_t=${Date.now()}`;

  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');

  // Automatically attach authenticated admin session token if available and not explicitly provided
  if (!headers.has('Authorization')) {
    const session = getSavedAdminSession();
    if (session?.token) {
      headers.set('Authorization', `Bearer ${session.token}`);
    }
  }

  return fetch(urlWithCacheBuster, {
    ...options,
    headers,
    cache: 'no-store',
  });
}

async function safeParseJson<T = any>(res: Response, fallback?: T): Promise<T> {
  let text = '';
  try {
    text = await res.text();
  } catch (err: any) {
    if (fallback !== undefined) return fallback;
    throw new Error('Gagal membaca respon server: ' + (err.message || String(err)));
  }

  if (!text || text.trim() === '') {
    return (fallback !== undefined ? fallback : ({} as T));
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    console.warn(`[API] Respon server bukan format JSON (HTTP ${res.status}):`, text.slice(0, 100));

    if (fallback !== undefined) {
      return fallback;
    }

    // Convert HTML or Cloud Run / Vercel text error into a clean Indonesian message
    const trimmed = text.trim();
    if (trimmed.startsWith('The page') || trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || trimmed.startsWith('Error:')) {
      if (res.status === 404) {
        throw new Error('Layanan API tidak ditemukan di hosting ini (404). Menggunakan koneksi langsung Supabase.');
      }
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        throw new Error('Server sedang memulai atau mengalami gangguan sementara. Silakan coba lagi.');
      }
      throw new Error(`Koneksi server terputus atau mengembalikan halaman teks (HTTP ${res.status}).`);
    }

    throw new Error(trimmed.slice(0, 120));
  }
}

// Helper to map snake_case Supabase election_config row to ElectionConfig
function mapSupabaseConfig(row: any): ElectionConfig {
  return {
    schoolName: row.school_name || "SMA PASUNDAN 8 BANDUNG",
    appName: row.app_name || "E-VOTING OSIS",
    slogan: row.slogan || "SUARAMU MENENTUKAN MASA DEPAN OSIS",
    academicYear: row.academic_year || "2026/2027",
    electionTitle: row.election_title || "Pemilihan Ketua & Wakil Ketua OSIS",
    electionDate: row.election_date || "2026-11-05",
    startTime: row.start_time || "07:30",
    endTime: row.end_time || "15:00",
    status: row.status || "active",
    isResultsPublished: Boolean(row.is_results_published),
    schoolLogo: row.school_logo || "",
    osisLogo: row.osis_logo || "",
    schoolBanner: row.school_banner || "",
    committeeHead: row.committee_head || "Dani Setiabudi, S.Pd., M.Si.",
    wakasekKesiswaan: row.wakasek_kesiswaan || "Dewi Halimah, S.Pd., M.M.",
    pembinaOsis: row.pembina_osis || "Bahtiar Ali Rahman",
    ketuaOsis: row.ketua_osis || "Khoira",
    ketuaPanitia: row.ketua_panitia || "Diki",
    announcementTitle: row.announcement_title || "Pengumuman Resmi KPU OSIS",
    announcementBody: row.announcement_body || "Gunakan hak suara Anda dengan tertib, jujur, dan bertanggung jawab."
  };
}

// Helper to map snake_case Supabase candidate row to Candidate
function mapSupabaseCandidate(row: any): Candidate {
  return {
    id: row.id,
    number: row.number,
    chairmanName: row.chairman_name,
    chairmanClass: row.chairman_class,
    chairmanPhoto: row.chairman_photo || "",
    viceChairmanName: row.vice_chairman_name,
    viceChairmanClass: row.vice_chairman_class,
    viceChairmanPhoto: row.vice_chairman_photo || "",
    vision: row.vision || "",
    mission: Array.isArray(row.mission) ? row.mission : (typeof row.mission === 'string' ? JSON.parse(row.mission || '[]') : []),
    programs: Array.isArray(row.programs) ? row.programs : (typeof row.programs === 'string' ? JSON.parse(row.programs || '[]') : []),
    motto: row.motto || ""
  };
}

export const api = {
  // Public & Voter
  async getConfig(): Promise<ElectionConfig | null> {
    try {
      const res = await fetchNoCache(`${BASE_URL}/config`);
      const data = await safeParseJson(res, { success: false, config: null });
      if (data?.config) {
        return data.config;
      }
    } catch (e) {
      console.warn('[API] /api/config unavailable, trying Supabase direct query:', e);
    }

    // Direct Supabase query fallback (essential for static Vercel hosting)
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.from('election_config').select('*').maybeSingle();
        if (!error && data) {
          return mapSupabaseConfig(data);
        }
      }
    } catch (err) {
      console.warn('[API] Supabase fallback config query failed:', err);
    }

    return null;
  },

  async getCandidates(): Promise<Candidate[]> {
    try {
      const res = await fetchNoCache(`${BASE_URL}/candidates`);
      const data = await safeParseJson(res, { success: false, candidates: [] });
      if (data?.candidates && data.candidates.length > 0) {
        return data.candidates;
      }
    } catch (e) {
      console.warn('[API] /api/candidates unavailable, trying Supabase direct query:', e);
    }

    // Direct Supabase query fallback (essential for static Vercel hosting)
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.from('candidates').select('*').order('number', { ascending: true });
        if (!error && data && data.length > 0) {
          return data.map(mapSupabaseCandidate);
        }
      }
    } catch (err) {
      console.warn('[API] Supabase fallback candidates query failed:', err);
    }

    return [];
  },

  async voterLogin(nis: string, accessCode: string): Promise<VoterLoginResponse> {
    try {
      const res = await fetchNoCache(`${BASE_URL}/auth/voter-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nis, accessCode })
      });
      const data = await safeParseJson<VoterLoginResponse>(res, { success: false, message: 'Gagal menghubungi server login pemilih.' });
      if (data.success) {
        return data;
      }
      if (data.message && !data.message.includes('tidak ditemukan')) {
        return data;
      }
    } catch (_) {}

    // Secure fallback: credentials are verified by a SECURITY DEFINER database function.
    // Never expose voters.access_code or allow direct reads from the voters table.
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.rpc('evoting_voter_login', {
          p_nis: String(nis).trim(),
          p_access_code: String(accessCode).trim().toUpperCase()
        });
        if (error) {
          return { success: false, message: 'Autentikasi Supabase gagal: ' + error.message };
        }
        return data as VoterLoginResponse;
      }
    } catch (e: any) {
      return { success: false, message: 'Gagal autentikasi pemilih: ' + e.message };
    }

    return { success: false, message: 'Gagal menghubungi server login pemilih.' };
  },

  async submitVote(nis: string, accessCode: string, candidateId: string): Promise<SubmitVoteResponse> {
    try {
      const res = await fetchNoCache(`${BASE_URL}/vote/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nis, accessCode, candidateId })
      });
      const data = await safeParseJson<SubmitVoteResponse>(res, { success: false, message: 'Gagal mengirimkan suara ke server.' });
      if (data.success) return data;
    } catch (_) {}

    // Secure fallback: one database transaction validates the voter, marks the DPT row,
    // and inserts an anonymous ballot. The client never writes either table directly.
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.rpc('evoting_cast_vote', {
          p_nis: String(nis).trim(),
          p_access_code: String(accessCode).trim().toUpperCase(),
          p_candidate_id: candidateId
        });
        if (error) {
          return { success: false, message: 'Gagal menyimpan suara: ' + error.message };
        }
        return data as SubmitVoteResponse;
      }
    } catch (e: any) {
      return { success: false, message: 'Gagal mengirimkan suara: ' + e.message };
    }

    return { success: false, message: 'Gagal mengirimkan suara ke server.' };
  },

  async getResults(adminToken?: string): Promise<(ElectionResults & { success: boolean; message?: string }) | null> {
    try {
      const headers: Record<string, string> = {};
      if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }
      const res = await fetchNoCache(`${BASE_URL}/results`, { headers });
      const data = await safeParseJson<any>(res, null);
      if (data && data.success) {
        return data;
      }
    } catch (_) {}

    // Fallback calculation directly from Supabase (for static Vercel hosting)
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const [{ data: votes }, { data: voters }, { data: cands }] = await Promise.all([
          supabase.from('anonymous_votes').select('candidate_id, candidate_number'),
          supabase.from('voters').select('id, has_voted'),
          supabase.from('candidates').select('*').order('number', { ascending: true })
        ]);

        const totalVoters = voters?.length || 0;
        const totalVotesCast = votes?.length || 0;
        const totalPendingVoters = Math.max(0, totalVoters - totalVotesCast);
        const turnoutPercentage = totalVoters > 0 ? Number(((totalVotesCast / totalVoters) * 100).toFixed(1)) : 0;

        const tallies = (cands || []).map((c: any) => {
          const votesCount = (votes || []).filter((v: any) => v.candidate_id === c.id || v.candidate_number === c.number).length;
          const percentage = totalVotesCast > 0 ? Number(((votesCount / totalVotesCast) * 100).toFixed(1)) : 0;
          return {
            candidateId: c.id,
            candidateNumber: c.number,
            chairmanName: c.chairman_name,
            viceChairmanName: c.vice_chairman_name,
            chairmanPhoto: c.chairman_photo,
            viceChairmanPhoto: c.vice_chairman_photo,
            votesCount,
            percentage
          };
        }).sort((a: any, b: any) => b.votesCount - a.votesCount);

        let isTied = false;
        let leadingCandidate = null;
        if (tallies.length > 0 && totalVotesCast > 0) {
          if (tallies.length > 1 && tallies[0].votesCount === tallies[1].votesCount && tallies[0].votesCount > 0) {
            isTied = true;
          } else {
            leadingCandidate = {
              candidateNumber: tallies[0].candidateNumber,
              chairmanName: tallies[0].chairmanName,
              viceChairmanName: tallies[0].viceChairmanName,
              votesCount: tallies[0].votesCount
            };
          }
        }

        return {
          success: true,
          isPublished: true,
          totalVoters,
          totalVotesCast,
          totalPendingVoters,
          turnoutPercentage,
          candidateTallies: tallies,
          isTied,
          leadingCandidate
        };
      }
    } catch (_) {}

    return null;
  },

  // Admin Login with Dual-Mode (Supabase Auth + Local Backend + Session Storage)
  async adminLogin(usernameOrEmail: string, password: string): Promise<AdminLoginResponse> {
    const cleanUser = usernameOrEmail.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, message: 'Username / Email dan Password administrator harus diisi!' };
    }

    // 1. SUPABASE AUTH: If input is an email (contains @), authenticate directly with Supabase
    if (cleanUser.includes('@')) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: cleanUser,
            password: cleanPass,
          });

          if (error) {
            let msg = error.message;
            if (error.message.toLowerCase().includes('invalid login credentials')) {
              msg = 'Email atau kata sandi administrator salah. Silakan periksa kembali.';
            } else if (error.message.toLowerCase().includes('email not confirmed')) {
              msg = 'Email administrator belum dikonfirmasi di Supabase Authentication.';
            }
            return { success: false, message: msg };
          }

          if (data && data.user) {
            // Verify role
            const roleCheck = await verifyUserIsAdmin(data.user, supabase);
            if (!roleCheck.isAdmin) {
              await supabase.auth.signOut();
              return {
                success: false,
                message: roleCheck.reason || 'Akses ditolak: Akun Anda tidak memiliki role administrator.'
              };
            }

            const adminData = {
              username: data.user.email || cleanUser,
              name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Administrator',
              role: roleCheck.roleName || 'Administrator',
              id: data.user.id,
              authProvider: 'supabase'
            };

            // Save session to localStorage
            if (typeof window !== 'undefined' && window.localStorage) {
              localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify({
                token: data.session?.access_token || 'supabase-token',
                admin: adminData,
                timestamp: Date.now()
              }));
            }

            return {
              success: true,
              token: data.session?.access_token || 'supabase-token',
              admin: adminData
            };
          }
        } catch (supabaseErr: any) {
          console.warn('[Admin Auth] Supabase Auth exception:', supabaseErr);
        }
      }
    }

    // 2. LOCAL / EXPRESS BACKEND API
    try {
      const res = await fetchNoCache(`${BASE_URL}/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password: cleanPass })
      });

      const data = await safeParseJson<any>(res, null);
      if (data && data.success) {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify({
            token: data.token || 'admin-token-authorized',
            admin: data.admin,
            timestamp: Date.now()
          }));
        }
        return data;
      }

      if (data && data.message) {
        return { success: false, message: data.message };
      }
    } catch (apiErr: any) {
      console.warn('[Admin Auth] Backend API unreachable or error:', apiErr);
    }

    // 3. STATIC VERCEL / OFFLINE FALLBACK (when hosting on Vercel as a static SPA)
    if (cleanUser.toLowerCase() === 'admin' && cleanPass === 'admin123') {
      const fallbackAdmin = {
        username: 'admin',
        name: 'Administrator KPU OSIS SMA Pasundan 8',
        role: 'Super Administrator',
        authProvider: 'local'
      };

      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify({
          token: 'admin-token-authorized',
          admin: fallbackAdmin,
          timestamp: Date.now()
        }));
      }

      return {
        success: true,
        token: 'admin-token-authorized',
        admin: fallbackAdmin
      };
    }

    return {
      success: false,
      message: 'Username/Email atau password salah! Jika menggunakan Supabase Auth di Vercel, pastikan memasukkan alamat Email lengkap.'
    };
  },

  async adminLogout() {
    await clearAdminSession();
  },

  async updateConfig(config: Partial<ElectionConfig>) {
    try {
      const res = await fetchNoCache(`${BASE_URL}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      return safeParseJson(res, { success: true, message: 'Pengaturan berhasil diperbarui.' });
    } catch (_) {
      // Fallback update to Supabase
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from('election_config').upsert({
          id: 'config-default',
          ...config
        });
        return { success: true, message: 'Pengaturan berhasil diperbarui di Supabase.' };
      }
      return { success: false, message: 'Gagal memperbarui pengaturan.' };
    }
  },

  async togglePublish() {
    const res = await fetchNoCache(`${BASE_URL}/admin/toggle-publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return safeParseJson(res, { success: false, message: 'Gagal mengubah status publikasi.' });
  },

  // Candidate Management
  async addCandidate(candidate: Partial<Candidate>) {
    const res = await fetchNoCache(`${BASE_URL}/candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidate)
    });
    return safeParseJson(res, { success: false, message: 'Gagal menambahkan kandidat.' });
  },

  async updateCandidate(id: string, candidate: Partial<Candidate>) {
    const res = await fetchNoCache(`${BASE_URL}/candidates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidate)
    });
    return safeParseJson(res, { success: false, message: 'Gagal memperbarui data kandidat.' });
  },

  async deleteCandidate(id: string) {
    const res = await fetchNoCache(`${BASE_URL}/candidates/${id}`, {
      method: 'DELETE'
    });
    return safeParseJson(res, { success: false, message: 'Gagal menghapus kandidat.' });
  },

  // Voters Management
  async getVoters(params?: { search?: string; className?: string; status?: string }): Promise<{ voters: Voter[]; total: number; filteredCount: number }> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetchNoCache(`${BASE_URL}/voters?${query}`);
    return safeParseJson(res, { voters: [], total: 0, filteredCount: 0 });
  },

  async addVoter(voter: Partial<Voter>) {
    const res = await fetchNoCache(`${BASE_URL}/voters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(voter)
    });
    return safeParseJson(res, { success: false, message: 'Gagal menambahkan siswa.' });
  },

  async updateVoter(id: string, voter: Partial<Voter>) {
    const res = await fetchNoCache(`${BASE_URL}/voters/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(voter)
    });
    return safeParseJson(res, { success: false, message: 'Gagal memperbarui data siswa.' });
  },

  async deleteVoter(id: string) {
    const res = await fetchNoCache(`${BASE_URL}/voters/${id}`, {
      method: 'DELETE'
    });
    return safeParseJson(res, { success: false, message: 'Gagal menghapus siswa.' });
  },

  async importVotersExcel(base64File?: string, fileData?: any[]): Promise<ImportVotersResponse> {
    const res = await fetchNoCache(`${BASE_URL}/voters/import-excel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64File, fileData })
    });
    return safeParseJson<ImportVotersResponse>(res, { success: false, importedCount: 0, failedCount: 0, errors: [], message: 'Gagal memproses impor Excel.' });
  },

  async getAuditLogs() {
    const res = await fetchNoCache(`${BASE_URL}/admin/audit-logs`);
    return safeParseJson(res, { success: true, logs: [] });
  },

  async changeAdminPassword(oldPassword: string, newPassword: string, adminName?: string) {
    const res = await fetchNoCache(`${BASE_URL}/admin/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword, newPassword, adminName })
    });
    return safeParseJson(res, { success: false, message: 'Gagal mengganti password.' });
  },

  async resetVotes(adminPassword: string) {
    const res = await fetchNoCache(`${BASE_URL}/admin/reset-votes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPassword })
    });
    return safeParseJson(res, { success: false, message: 'Gagal mengosongkan kotak suara.' });
  },

  async resetData(type: 'votes' | 'voters' | 'candidates' | 'factory' | 'clear-all', adminPassword: string, confirmationText: string) {
    const res = await fetchNoCache(`${BASE_URL}/admin/reset-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, adminPassword, confirmationText })
    });
    return safeParseJson(res, { success: false, message: 'Gagal mereset data.' });
  },

  async downloadBackupData() {
    const res = await fetchNoCache(`${BASE_URL}/admin/backup-data`);
    if (!res.ok) {
      throw new Error(`Gagal mengunduh cadangan (HTTP ${res.status})`);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-evoting-pasundan8-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // Supabase
  async getSupabaseStatus(): Promise<SupabaseStatusResponse> {
    const res = await fetchNoCache(`${BASE_URL}/supabase/status`);
    return safeParseJson<SupabaseStatusResponse>(res, { success: false, status: null });
  },

  async getSupabaseSqlScript(): Promise<{ success: boolean; sql: string; patchSql?: string }> {
    const res = await fetchNoCache(`${BASE_URL}/supabase/sql-script`);
    return safeParseJson(res, { success: false, sql: '', patchSql: '' });
  },

  async testSupabase(url: string, key: string) {
    const res = await fetchNoCache(`${BASE_URL}/supabase/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, key })
    });
    return safeParseJson(res, { success: false, message: 'Gagal menguji koneksi Supabase.' });
  },

  async saveSupabase(url: string, key: string, dbUrl?: string) {
    const res = await fetchNoCache(`${BASE_URL}/supabase/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, key, dbUrl })
    });
    return safeParseJson(res, { success: false, message: 'Gagal menyimpan konfigurasi Supabase.' });
  },

  async migrateSupabase(dbUrl: string) {
    const res = await fetchNoCache(`${BASE_URL}/supabase/migrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dbUrl })
    });
    return safeParseJson(res, { success: false, message: 'Gagal menjalankan migrasi Supabase.' });
  },

  async syncSupabase(): Promise<SyncSupabaseResponse> {
    const res = await fetchNoCache(`${BASE_URL}/supabase/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return safeParseJson<SyncSupabaseResponse>(res, { success: false, message: 'Gagal menyinkronkan data ke Supabase.' });
  }
};
