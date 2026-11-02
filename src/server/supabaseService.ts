import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Client } from 'pg';
import { readDatabase, saveDatabase } from './db.ts';

export interface SupabaseConfigState {
  url: string;
  key: string;
  isConnected: boolean;
  lastChecked?: string;
  tablesVerified?: string[];
  dbUrl?: string;
}

export function normalizeSupabaseUrl(url?: string): string {
  if (!url) return '';
  return url.trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
}

export const SUPABASE_SQL_SCRIPT = `-- ================================================================
-- SKRIP SQL LENGKAP E-VOTING OSIS SMA PASUNDAN 8 BANDUNG
-- Jalankan skrip ini di menu SQL Editor di Supabase Dashboard Anda
-- Dashboard Supabase -> Project Anda -> Menu SQL Editor -> New Query -> Run
-- ================================================================

-- 1. Buat Tabel Konfigurasi Pemilihan
CREATE TABLE IF NOT EXISTS public.election_config (
    id TEXT PRIMARY KEY,
    school_name TEXT NOT NULL,
    app_name TEXT NOT NULL,
    slogan TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    election_title TEXT NOT NULL,
    election_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    is_results_published BOOLEAN NOT NULL DEFAULT false,
    school_logo TEXT,
    osis_logo TEXT,
    school_banner TEXT,
    committee_head TEXT,
    wakasek_kesiswaan TEXT,
    pembina_osis TEXT,
    ketua_osis TEXT,
    ketua_panitia TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tambahkan kolom penandatangan berita acara jika tabel sudah ada sebelumnya:
ALTER TABLE IF EXISTS public.election_config ADD COLUMN IF NOT EXISTS school_logo TEXT;
ALTER TABLE IF EXISTS public.election_config ADD COLUMN IF NOT EXISTS osis_logo TEXT;
ALTER TABLE IF EXISTS public.election_config ADD COLUMN IF NOT EXISTS school_banner TEXT;
ALTER TABLE IF EXISTS public.election_config ADD COLUMN IF NOT EXISTS committee_head TEXT;
ALTER TABLE IF EXISTS public.election_config ADD COLUMN IF NOT EXISTS wakasek_kesiswaan TEXT;
ALTER TABLE IF EXISTS public.election_config ADD COLUMN IF NOT EXISTS pembina_osis TEXT;
ALTER TABLE IF EXISTS public.election_config ADD COLUMN IF NOT EXISTS ketua_osis TEXT;
ALTER TABLE IF EXISTS public.election_config ADD COLUMN IF NOT EXISTS ketua_panitia TEXT;
ALTER TABLE IF EXISTS public.election_config ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Buat Tabel Pasangan Calon Ketua & Wakil Ketua OSIS
CREATE TABLE IF NOT EXISTS public.candidates (
    id TEXT PRIMARY KEY,
    number TEXT NOT NULL UNIQUE,
    chairman_name TEXT NOT NULL,
    chairman_class TEXT NOT NULL,
    chairman_photo TEXT,
    vice_chairman_name TEXT NOT NULL,
    vice_chairman_class TEXT NOT NULL,
    vice_chairman_photo TEXT,
    vision TEXT NOT NULL,
    mission JSONB NOT NULL DEFAULT '[]'::jsonb,
    programs JSONB NOT NULL DEFAULT '[]'::jsonb,
    motto TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Buat Tabel Pemilih Tetap (DPT Siswa)
CREATE TABLE IF NOT EXISTS public.voters (
    id TEXT PRIMARY KEY,
    nis TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    class_name TEXT NOT NULL,
    access_code TEXT NOT NULL,
    has_voted BOOLEAN NOT NULL DEFAULT false,
    voted_at TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Buat Tabel Surat Suara Anonim (Asas Luber Jurdil - Rahasia)
CREATE TABLE IF NOT EXISTS public.anonymous_votes (
    id TEXT PRIMARY KEY,
    candidate_id TEXT NOT NULL,
    candidate_number TEXT NOT NULL,
    timestamp TEXT NOT NULL
);

-- 5. Buat Tabel Audit Aktivitas Pemilihan
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL
);

-- 6. Nonaktifkan Row Level Security (RLS) agar API Key Supabase (anon / service_role) dapat membaca & menulis data
ALTER TABLE public.election_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.voters DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymous_votes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;

-- 7. Berikan Hak Akses Penuh ke Role Supabase
GRANT ALL ON TABLE public.election_config TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.candidates TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.voters TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.anonymous_votes TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.audit_logs TO postgres, anon, authenticated, service_role;

-- 8. Kebijakan Cadangan (Policies) jika RLS aktif di lingkungan Cloud
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'candidates') THEN
    DROP POLICY IF EXISTS "Full Access Candidates" ON public.candidates;
    CREATE POLICY "Full Access Candidates" ON public.candidates FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'election_config') THEN
    DROP POLICY IF EXISTS "Full Access Config" ON public.election_config;
    CREATE POLICY "Full Access Config" ON public.election_config FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'voters') THEN
    DROP POLICY IF EXISTS "Full Access Voters" ON public.voters;
    CREATE POLICY "Full Access Voters" ON public.voters FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'anonymous_votes') THEN
    DROP POLICY IF EXISTS "Full Access Votes" ON public.anonymous_votes;
    CREATE POLICY "Full Access Votes" ON public.anonymous_votes FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_logs') THEN
    DROP POLICY IF EXISTS "Full Access Audit" ON public.audit_logs;
    CREATE POLICY "Full Access Audit" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 9. Refresh PostgREST schema cache seketika
NOTIFY pgrst, 'reload schema';
`;

export const SUPABASE_ADD_COLUMNS_SQL = `-- ================================================================
-- SKRIP TAMBAH KOLOM BERITA ACARA KE SUPABASE
-- Jalankan skrip ini jika muncul pesan kolom hilang di schema cache:
-- Menu Supabase -> SQL Editor -> New query -> Tempel (Paste) -> Run
-- ================================================================

ALTER TABLE IF EXISTS public.election_config ADD COLUMN IF NOT EXISTS committee_head TEXT;
ALTER TABLE IF EXISTS public.election_config ADD COLUMN IF NOT EXISTS wakasek_kesiswaan TEXT;
ALTER TABLE IF EXISTS public.election_config ADD COLUMN IF NOT EXISTS pembina_osis TEXT;
ALTER TABLE IF EXISTS public.election_config ADD COLUMN IF NOT EXISTS ketua_osis TEXT;
ALTER TABLE IF EXISTS public.election_config ADD COLUMN IF NOT EXISTS ketua_panitia TEXT;
ALTER TABLE IF EXISTS public.election_config ADD COLUMN IF NOT EXISTS school_logo TEXT;
ALTER TABLE IF EXISTS public.election_config ADD COLUMN IF NOT EXISTS osis_logo TEXT;
ALTER TABLE IF EXISTS public.election_config ADD COLUMN IF NOT EXISTS school_banner TEXT;
ALTER TABLE IF EXISTS public.election_config ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Reload PostgREST schema cache seketika agar langsung dikenali API Supabase
NOTIFY pgrst, 'reload schema';
`;

// In-memory active client
let activeSupabaseClient: SupabaseClient | null = null;

export function getActiveSupabaseClient(): SupabaseClient | null {
  if (activeSupabaseClient) return activeSupabaseClient;

  // Check database storage or env vars
  const db = readDatabase() as any;
  const rawUrl = db.supabase?.url || process.env.SUPABASE_URL;
  const url = normalizeSupabaseUrl(rawUrl);
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || db.supabase?.key || process.env.SUPABASE_ANON_KEY;

  if (url && key) {
    activeSupabaseClient = createClient(url, key, {
      auth: { persistSession: false }
    });
  }
  return activeSupabaseClient;
}

export async function testSupabaseConnection(rawUrl: string, key: string) {
  try {
    const url = normalizeSupabaseUrl(rawUrl);
    if (!url) {
      return {
        success: false,
        isConnected: false,
        verifiedTables: [],
        missingTables: [],
        message: 'URL Supabase tidak boleh kosong.'
      };
    }

    const client = createClient(url, key, { auth: { persistSession: false } });
    
    // Check key tables
    const tableChecks = await Promise.allSettled([
      client.from('candidates').select('id').limit(1),
      client.from('voters').select('id').limit(1),
      client.from('election_config').select('id').limit(1),
      client.from('anonymous_votes').select('id').limit(1),
      client.from('audit_logs').select('id').limit(1)
    ]);

    const verifiedTables: string[] = [];
    const missingTables: { table: string; error?: string; code?: string }[] = [];
    const tables = ['candidates', 'voters', 'election_config', 'anonymous_votes', 'audit_logs'];

    tableChecks.forEach((res, idx) => {
      const tableName = tables[idx];
      if (res.status === 'fulfilled' && !res.value.error) {
        verifiedTables.push(tableName);
      } else {
        const errorMsg = res.status === 'fulfilled' ? res.value.error?.message : (res.reason?.message || 'Error query');
        const errorCode = res.status === 'fulfilled' ? res.value.error?.code : undefined;
        missingTables.push({ table: tableName, error: errorMsg, code: errorCode });
      }
    });

    const isConnected = verifiedTables.length > 0;

    let message = '';
    if (isConnected) {
      if (verifiedTables.length === tables.length) {
        message = `Koneksi Supabase Sukses Sempurna! Seluruh ${verifiedTables.length} tabel e-voting (${verifiedTables.join(', ')}) telah terdeteksi dan aktif.`;
      } else {
        message = `Koneksi Supabase berhasil! Terdeteksi ${verifiedTables.length} tabel (${verifiedTables.join(', ')}). Ada ${missingTables.length} tabel yang belum ditemukan (${missingTables.map(m => m.table).join(', ')}).`;
      }
    } else {
      const sampleErr = missingTables[0]?.error ? ` (Keterangan: ${missingTables[0].error})` : '';
      message = `Koneksi ke Project URL Supabase berhasil dihubungi, namun tabel-tabel e-voting belum ditemukan di database Anda${sampleErr}. Silakan jalankan Skrip SQL yang disediakan di bawah ini pada menu SQL Editor Supabase, atau gunakan opsi Auto-Migrasi PostgreSQL URI.`;
    }

    return {
      success: isConnected,
      isConnected,
      normalizedUrl: url,
      verifiedTables,
      missingTables,
      message
    };
  } catch (err: any) {
    return {
      success: false,
      isConnected: false,
      verifiedTables: [],
      missingTables: [],
      message: 'Gagal terhubung ke Supabase: ' + (err.message || String(err))
    };
  }
}

// Direct migration via PostgreSQL URI
export async function runDirectPostgresMigration(dbUrl: string) {
  if (!dbUrl || (!dbUrl.startsWith('postgres://') && !dbUrl.startsWith('postgresql://'))) {
    throw new Error('URI PostgreSQL tidak valid. Format: postgresql://postgres:[password]@[host]:[port]/postgres');
  }

  const client = new Client({
    connectionString: dbUrl.trim(),
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    // Run the migration SQL
    await client.query(SUPABASE_SQL_SCRIPT);
    
    // Check tables in public schema
    const checkRes = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('candidates', 'voters', 'election_config', 'anonymous_votes', 'audit_logs')
    `);
    
    const createdTables = checkRes.rows.map(r => r.table_name);
    await client.end();

    return {
      success: true,
      tablesCreated: createdTables,
      message: `Migrasi SQL langsung ke Supabase berhasil! ${createdTables.length} tabel berhasil dibuat & dikonfigurasi (${createdTables.join(', ')}).`
    };
  } catch (err: any) {
    try { await client.end(); } catch (_) {}
    throw new Error(`Gagal mengeksekusi migrasi ke PostgreSQL Supabase: ${err.message || String(err)}`);
  }
}

export async function saveSupabaseConfig(rawUrl: string, key: string, dbUrl?: string) {
  const url = normalizeSupabaseUrl(rawUrl);
  const testRes = await testSupabaseConnection(url, key);
  const db = readDatabase() as any;

  db.supabase = {
    url,
    key,
    dbUrl: dbUrl || db.supabase?.dbUrl || '',
    isConnected: testRes.isConnected,
    lastChecked: new Date().toISOString(),
    tablesVerified: testRes.verifiedTables
  };

  saveDatabase(db);

  if (testRes.isConnected) {
    activeSupabaseClient = createClient(url, key, { auth: { persistSession: false } });
  }

  return testRes;
}

export function getSupabaseStatus() {
  const db = readDatabase() as any;
  const rawUrl = db.supabase?.url || process.env.SUPABASE_URL || '';
  const url = normalizeSupabaseUrl(rawUrl);
  const key = db.supabase?.key || process.env.SUPABASE_ANON_KEY || '';
  const dbUrl = db.supabase?.dbUrl || '';
  const maskedKey = key ? `${key.substring(0, 12)}...${key.substring(key.length - 6)}` : '';

  const isConnected = Boolean(db.supabase?.isConnected || (url && key && db.supabase?.tablesVerified?.length > 0));
  const verifiedTables = db.supabase?.tablesVerified && db.supabase.tablesVerified.length > 0
    ? db.supabase.tablesVerified
    : (isConnected ? ['candidates', 'voters', 'election_config', 'anonymous_votes', 'audit_logs'] : []);

  return {
    isConfigured: Boolean(url && key),
    isConnected,
    url: url || '',
    maskedKey,
    dbUrl,
    lastChecked: db.supabase?.lastChecked || new Date().toISOString(),
    tablesVerified: verifiedTables
  };
}

// Push local data to Supabase
export async function syncLocalDataToSupabase() {
  const client = getActiveSupabaseClient();
  if (!client) {
    throw new Error('Supabase belum terhubung. Konfigurasi URL dan API Key terlebih dahulu.');
  }

  const db = readDatabase();
  const logs: string[] = [];

  // 1. Config (with adaptive schema-cache missing-column handling)
  const cfg = db.config;
  const configPayload: Record<string, any> = {
    id: 'config-default',
    school_name: cfg.schoolName,
    app_name: cfg.appName,
    slogan: cfg.slogan,
    academic_year: cfg.academicYear,
    election_title: cfg.electionTitle,
    election_date: cfg.electionDate,
    start_time: cfg.startTime,
    end_time: cfg.endTime,
    status: cfg.status,
    is_results_published: cfg.isResultsPublished,
    school_logo: cfg.schoolLogo,
    osis_logo: cfg.osisLogo,
    school_banner: cfg.schoolBanner,
    committee_head: cfg.committeeHead,
    wakasek_kesiswaan: cfg.wakasekKesiswaan || null,
    pembina_osis: cfg.pembinaOsis,
    ketua_osis: cfg.ketuaOsis || null,
    ketua_panitia: cfg.ketuaPanitia
  };

  const missingConfigCols: string[] = [];
  for (let attempt = 0; attempt < 8; attempt++) {
    const { error: cfgErr } = await client.from('election_config').upsert(configPayload);
    if (!cfgErr) {
      if (missingConfigCols.length > 0) {
        logs.push(`Pengaturan pemilihan berhasil disinkronkan ke Supabase. Catatan: Kolom [${missingConfigCols.join(', ')}] belum ada di Supabase sehingga dilewati.`);
      } else {
        logs.push('Pengaturan pemilihan berhasil disinkronkan ke Supabase.');
      }
      break;
    }

    // Check if error is due to a missing column in Supabase schema cache
    const match = cfgErr.message.match(/Could not find the '([a-zA-Z0-9_]+)' column/);
    if (match && match[1] && match[1] in configPayload) {
      const missingCol = match[1];
      missingConfigCols.push(missingCol);
      delete configPayload[missingCol];
      continue; // Retry without the missing column
    }

    logs.push(`Gagal sync config: ${cfgErr.message}`);
    break;
  }

  // 2. Candidates
  let cands = db.candidates.map(c => ({
    id: c.id,
    number: c.number,
    chairman_name: c.chairmanName,
    chairman_class: c.chairmanClass,
    chairman_photo: c.chairmanPhoto,
    vice_chairman_name: c.viceChairmanName,
    vice_chairman_class: c.viceChairmanClass,
    vice_chairman_photo: c.viceChairmanPhoto,
    vision: c.vision,
    mission: c.mission,
    programs: c.programs,
    motto: c.motto
  }));

  const missingCandCols: string[] = [];
  for (let attempt = 0; attempt < 6; attempt++) {
    const { error: candErr } = await client.from('candidates').upsert(cands);
    if (!candErr) {
      if (missingCandCols.length > 0) {
        logs.push(`${cands.length} pasangan calon berhasil disinkronkan ke Supabase (Kolom [${missingCandCols.join(', ')}] dilewati).`);
      } else {
        logs.push(`${cands.length} pasangan calon berhasil disinkronkan ke Supabase.`);
      }

      // Reconcile and prune any removed candidates from Supabase
      try {
        const currentCandIds = db.candidates.map(c => c.id);
        const { data: remoteCands } = await client.from('candidates').select('id');
        if (remoteCands && remoteCands.length > 0) {
          const toDelete = remoteCands.filter(rc => !currentCandIds.includes(rc.id));
          for (const rem of toDelete) {
            await client.from('candidates').delete().eq('id', rem.id);
            logs.push(`Supabase: Paslon lama (${rem.id}) berhasil dibersihkan dari database.`);
          }
        }
      } catch (pruneErr: any) {
        console.warn('Prune Supabase candidates notice:', pruneErr?.message);
      }
      break;
    }

    const match = candErr.message.match(/Could not find the '([a-zA-Z0-9_]+)' column/);
    if (match && match[1]) {
      const missingCol = match[1];
      missingCandCols.push(missingCol);
      cands = cands.map(c => {
        const copy = { ...c } as Record<string, any>;
        delete copy[missingCol];
        return copy as any;
      });
      continue;
    }

    logs.push(`Gagal sync kandidat: ${candErr.message}`);
    break;
  }

  // 3. Voters
  let vtrs = db.voters.map(v => ({
    id: v.id,
    nis: v.nis,
    full_name: v.fullName,
    class_name: v.className,
    access_code: v.accessCode,
    has_voted: v.hasVoted,
    voted_at: v.votedAt
  }));

  const missingVtrCols: string[] = [];
  for (let attempt = 0; attempt < 6; attempt++) {
    const { error: vtrErr } = await client.from('voters').upsert(vtrs);
    if (!vtrErr) {
      if (missingVtrCols.length > 0) {
        logs.push(`${vtrs.length} data pemilih (DPT) berhasil disinkronkan ke Supabase (Kolom [${missingVtrCols.join(', ')}] dilewati).`);
      } else {
        logs.push(`${vtrs.length} data pemilih (DPT) berhasil disinkronkan ke Supabase.`);
      }
      break;
    }

    const match = vtrErr.message.match(/Could not find the '([a-zA-Z0-9_]+)' column/);
    if (match && match[1]) {
      const missingCol = match[1];
      missingVtrCols.push(missingCol);
      vtrs = vtrs.map(v => {
        const copy = { ...v } as Record<string, any>;
        delete copy[missingCol];
        return copy as any;
      });
      continue;
    }

    logs.push(`Gagal sync DPT siswa: ${vtrErr.message}`);
    break;
  }

  const allMissingCols = [...new Set([...missingConfigCols, ...missingCandCols, ...missingVtrCols])];

  return { 
    success: true, 
    logs, 
    hasMissingColumns: allMissingCols.length > 0,
    missingColumns: allMissingCols
  };
}

// Write vote into Supabase atomically if client is connected
export async function writeVoteToSupabase(vote: { id: string; candidateId: string; candidateNumber: string; timestamp: string }, voterNis: string) {
  const client = getActiveSupabaseClient();
  if (!client) return;

  try {
    // 1. Insert anonymous vote
    await client.from('anonymous_votes').insert({
      id: vote.id,
      candidate_id: vote.candidateId,
      candidate_number: vote.candidateNumber,
      timestamp: vote.timestamp
    });

    // 2. Update voter status
    await client.from('voters').update({
      has_voted: true,
      voted_at: vote.timestamp
    }).eq('nis', voterNis);
  } catch (e) {
    console.error('Failed to sync vote to Supabase:', e);
  }
}

// Reset data in Supabase if client is active
export async function resetSupabaseData(type: 'votes' | 'voters' | 'candidates' | 'all') {
  const client = getActiveSupabaseClient();
  if (!client) {
    return { synced: false, message: 'Supabase belum terhubung atau belum dikonfigurasi.' };
  }

  const logs: string[] = [];
  try {
    // 1. Reset Votes / Ballot box
    if (type === 'votes' || type === 'all' || type === 'voters' || type === 'candidates') {
      const { error: vErr } = await client.from('anonymous_votes').delete().not('id', 'is', null);
      if (vErr) {
        logs.push(`Supabase: Gagal mengosongkan kotak suara (${vErr.message})`);
      } else {
        logs.push('Supabase: Tabel anonymous_votes berhasil dikosongkan.');
      }
    }

    if (type === 'votes') {
      const { error: resetVotersErr } = await client.from('voters').update({
        has_voted: false,
        voted_at: null
      }).not('id', 'is', null);

      if (resetVotersErr) {
        logs.push(`Supabase: Gagal mereset status pemilih (${resetVotersErr.message})`);
      } else {
        logs.push('Supabase: Seluruh status has_voted pemilih direset ke false.');
      }

      await client.from('election_config').update({ is_results_published: false }).not('id', 'is', null);
    }

    if (type === 'voters' || type === 'all') {
      const { error: delVotersErr } = await client.from('voters').delete().not('id', 'is', null);
      if (delVotersErr) {
        logs.push(`Supabase: Gagal menghapus tabel voters (${delVotersErr.message})`);
      } else {
        logs.push('Supabase: Tabel voters berhasil dikosongkan.');
      }
    }

    if (type === 'candidates' || type === 'all') {
      const { error: delCandErr } = await client.from('candidates').delete().not('id', 'is', null);
      if (delCandErr) {
        logs.push(`Supabase: Gagal menghapus tabel candidates (${delCandErr.message})`);
      } else {
        logs.push('Supabase: Tabel candidates berhasil dikosongkan.');
      }
    }

    return { synced: true, logs };
  } catch (err: any) {
    return { synced: false, error: err.message, logs };
  }
}
