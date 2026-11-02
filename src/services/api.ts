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

async function fetchNoCache(url: string, options: RequestInit = {}): Promise<Response> {
  const separator = url.includes('?') ? '&' : '?';
  const urlWithCacheBuster = options.method && options.method !== 'GET' ? url : `${url}${separator}_t=${Date.now()}`;

  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');

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

    // Convert HTML or Cloud Run text error into a clean Indonesian message
    const trimmed = text.trim();
    if (trimmed.startsWith('The page') || trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || trimmed.startsWith('Error:')) {
      if (res.status === 404) {
        throw new Error('Layanan API tidak ditemukan (404). Pastikan server berjalan.');
      }
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        throw new Error('Server sedang memulai atau mengalami gangguan sementara. Silakan coba lagi.');
      }
      throw new Error(`Koneksi server terputus atau mengembalikan halaman teks (HTTP ${res.status}).`);
    }

    throw new Error(trimmed.slice(0, 120));
  }
}

export const api = {
  // Public & Voter
  async getConfig(): Promise<ElectionConfig | null> {
    const res = await fetchNoCache(`${BASE_URL}/config`);
    const data = await safeParseJson(res, { success: false, config: null });
    return data?.config || null;
  },

  async getCandidates(): Promise<Candidate[]> {
    const res = await fetchNoCache(`${BASE_URL}/candidates`);
    const data = await safeParseJson(res, { success: false, candidates: [] });
    return data?.candidates || [];
  },

  async voterLogin(nis: string, accessCode: string): Promise<VoterLoginResponse> {
    const res = await fetchNoCache(`${BASE_URL}/auth/voter-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nis, accessCode })
    });
    return safeParseJson<VoterLoginResponse>(res, { success: false, message: 'Gagal menghubungi server login pemilih.' });
  },

  async submitVote(nis: string, accessCode: string, candidateId: string): Promise<SubmitVoteResponse> {
    const res = await fetchNoCache(`${BASE_URL}/vote/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nis, accessCode, candidateId })
    });
    return safeParseJson<SubmitVoteResponse>(res, { success: false, message: 'Gagal mengirimkan suara ke server.' });
  },

  async getResults(adminToken?: string): Promise<(ElectionResults & { success: boolean; message?: string }) | null> {
    const headers: Record<string, string> = {};
    if (adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    }
    const res = await fetchNoCache(`${BASE_URL}/results`, { headers });
    return safeParseJson(res, null);
  },

  // Admin
  async adminLogin(username: string, password: string) {
    const res = await fetchNoCache(`${BASE_URL}/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return safeParseJson(res, { success: false, message: 'Gagal menghubungi server administrator.' });
  },

  async updateConfig(config: Partial<ElectionConfig>) {
    const res = await fetchNoCache(`${BASE_URL}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return safeParseJson(res, { success: false, message: 'Gagal memperbarui pengaturan.' });
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
