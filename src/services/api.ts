import { Candidate, ElectionConfig, ElectionResults, Voter } from '../types';

const BASE_URL = '/api';

async function fetchNoCache(url: string, options: RequestInit = {}): Promise<Response> {
  const separator = url.includes('?') ? '&' : '?';
  const urlWithCacheBuster = options.method && options.method !== 'GET' ? url : `${url}${separator}_t=${Date.now()}`;

  const headers = new Headers(options.headers || {});
  headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');

  return fetch(urlWithCacheBuster, {
    ...options,
    headers,
    cache: 'no-store',
  });
}

export const api = {
  // Public & Voter
  async getConfig(): Promise<ElectionConfig> {
    const res = await fetchNoCache(`${BASE_URL}/config`);
    const data = await res.json();
    return data.config;
  },

  async getCandidates(): Promise<Candidate[]> {
    const res = await fetchNoCache(`${BASE_URL}/candidates`);
    const data = await res.json();
    return data.candidates || [];
  },

  async voterLogin(nis: string, accessCode: string) {
    const res = await fetchNoCache(`${BASE_URL}/auth/voter-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nis, accessCode })
    });
    return res.json();
  },

  async submitVote(nis: string, accessCode: string, candidateId: string) {
    const res = await fetchNoCache(`${BASE_URL}/vote/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nis, accessCode, candidateId })
    });
    return res.json();
  },

  async getResults(adminToken?: string): Promise<ElectionResults & { success: boolean; message?: string }> {
    const headers: Record<string, string> = {};
    if (adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    }
    const res = await fetchNoCache(`${BASE_URL}/results`, { headers });
    return res.json();
  },

  // Admin
  async adminLogin(username: string, password: string) {
    const res = await fetchNoCache(`${BASE_URL}/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return res.json();
  },

  async updateConfig(config: Partial<ElectionConfig>) {
    const res = await fetchNoCache(`${BASE_URL}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return res.json();
  },

  async togglePublish() {
    const res = await fetchNoCache(`${BASE_URL}/admin/toggle-publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return res.json();
  },

  // Candidate Management
  async addCandidate(candidate: Partial<Candidate>) {
    const res = await fetchNoCache(`${BASE_URL}/candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidate)
    });
    return res.json();
  },

  async updateCandidate(id: string, candidate: Partial<Candidate>) {
    const res = await fetchNoCache(`${BASE_URL}/candidates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidate)
    });
    return res.json();
  },

  async deleteCandidate(id: string) {
    const res = await fetchNoCache(`${BASE_URL}/candidates/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Voters Management
  async getVoters(params?: { search?: string; className?: string; status?: string }): Promise<{ voters: Voter[]; total: number; filteredCount: number }> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetchNoCache(`${BASE_URL}/voters?${query}`);
    return res.json();
  },

  async addVoter(voter: Partial<Voter>) {
    const res = await fetchNoCache(`${BASE_URL}/voters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(voter)
    });
    return res.json();
  },

  async updateVoter(id: string, voter: Partial<Voter>) {
    const res = await fetchNoCache(`${BASE_URL}/voters/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(voter)
    });
    return res.json();
  },

  async deleteVoter(id: string) {
    const res = await fetchNoCache(`${BASE_URL}/voters/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  async importVotersExcel(base64File?: string, fileData?: any[]) {
    const res = await fetchNoCache(`${BASE_URL}/voters/import-excel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64File, fileData })
    });
    return res.json();
  },

  async getAuditLogs() {
    const res = await fetchNoCache(`${BASE_URL}/admin/audit-logs`);
    return res.json();
  },

  async changeAdminPassword(oldPassword: string, newPassword: string, adminName?: string) {
    const res = await fetchNoCache(`${BASE_URL}/admin/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword, newPassword, adminName })
    });
    return res.json();
  },

  async resetVotes(adminPassword: string) {
    const res = await fetchNoCache(`${BASE_URL}/admin/reset-votes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPassword })
    });
    return res.json();
  },

  async resetData(type: 'votes' | 'voters' | 'candidates' | 'factory' | 'clear-all', adminPassword: string, confirmationText: string) {
    const res = await fetchNoCache(`${BASE_URL}/admin/reset-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, adminPassword, confirmationText })
    });
    return res.json();
  },

  async downloadBackupData() {
    const res = await fetchNoCache(`${BASE_URL}/admin/backup-data`);
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
  async getSupabaseStatus() {
    const res = await fetchNoCache(`${BASE_URL}/supabase/status`);
    return res.json();
  },

  async getSupabaseSqlScript(): Promise<{ success: boolean; sql: string; patchSql?: string }> {
    const res = await fetchNoCache(`${BASE_URL}/supabase/sql-script`);
    return res.json();
  },

  async testSupabase(url: string, key: string) {
    const res = await fetchNoCache(`${BASE_URL}/supabase/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, key })
    });
    return res.json();
  },

  async saveSupabase(url: string, key: string, dbUrl?: string) {
    const res = await fetchNoCache(`${BASE_URL}/supabase/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, key, dbUrl })
    });
    return res.json();
  },

  async migrateSupabase(dbUrl: string) {
    const res = await fetchNoCache(`${BASE_URL}/supabase/migrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dbUrl })
    });
    return res.json();
  },

  async syncSupabase() {
    const res = await fetchNoCache(`${BASE_URL}/supabase/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return res.json();
  }
};
