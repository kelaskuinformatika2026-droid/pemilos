import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';
import { acquireLock, initDatabase, logAudit, readDatabase, saveDatabase } from './src/server/db.ts';
import { getSupabaseStatus, resetSupabaseData, runDirectPostgresMigration, saveSupabaseConfig, SUPABASE_ADD_COLUMNS_SQL, SUPABASE_SQL_SCRIPT, syncLocalDataToSupabase, testSupabaseConnection, writeVoteToSupabase } from './src/server/supabaseService.ts';
import { isCloudSqlConfigured, recordVoteInCloudSql, syncLocalDataToCloudSql } from './src/server/cloudSqlService.ts';
import { Candidate, ElectionConfig, ElectionResults, Voter } from './src/types/index.ts';
import { INITIAL_CANDIDATES, INITIAL_CONFIG, INITIAL_VOTERS } from './src/utils/defaultAssets.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Enable JSON parser with 25MB limit to allow base64 photo uploads up to 5MB easily
app.use(express.json({ limit: '25mb' }));
// Anti-caching middleware for all API routes to ensure edits reflect instantly
app.use('/api', (req: Request, res: Response, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Initialize persistent DB on launch
initDatabase();

// --- PUBLIC & VOTER API ---

// 1. Get election config & status
app.get('/api/config', (req: Request, res: Response) => {
  try {
    const db = readDatabase();
    res.json({
      success: true,
      config: db.config
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Get candidates list
app.get('/api/candidates', (req: Request, res: Response) => {
  try {
    const db = readDatabase();
    // Sort by candidate number
    const sorted = [...db.candidates].sort((a, b) => a.number.localeCompare(b.number));
    res.json({
      success: true,
      candidates: sorted
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Voter Login
app.post('/api/auth/voter-login', (req: Request, res: Response) => {
  try {
    const { nis, accessCode } = req.body;
    if (!nis || !accessCode) {
      return res.status(400).json({ success: false, message: 'NIS dan Kode Akses harus diisi!' });
    }

    const cleanNis = String(nis).trim();
    const cleanCode = String(accessCode).trim().toUpperCase();

    const db = readDatabase();
    const voter = db.voters.find(v => v.nis === cleanNis);

    if (!voter) {
      return res.status(404).json({
        success: false,
        message: 'NIS tidak ditemukan dalam DPT (Daftar Pemilih Tetap). Silakan hubungi Panitia Pemilihan OSIS.'
      });
    }

    if (voter.accessCode.toUpperCase() !== cleanCode) {
      return res.status(401).json({
        success: false,
        message: 'Kode Akses salah. Pastikan Anda memasukkan kode token dengan benar.'
      });
    }

    res.json({
      success: true,
      voter: {
        id: voter.id,
        nis: voter.nis,
        fullName: voter.fullName,
        className: voter.className,
        hasVoted: voter.hasVoted,
        votedAt: voter.votedAt
      },
      electionStatus: db.config.status
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Submit Vote (Atomic Transaction with Anonymous Secret Ballot)
app.post('/api/vote/submit', async (req: Request, res: Response) => {
  const releaseLock = await acquireLock();
  try {
    const { nis, accessCode, candidateId } = req.body;
    if (!nis || !accessCode || !candidateId) {
      releaseLock();
      return res.status(400).json({ success: false, message: 'Data pemilihan tidak lengkap!' });
    }

    const cleanNis = String(nis).trim();
    const cleanCode = String(accessCode).trim().toUpperCase();

    const db = readDatabase();

    // Verify election status
    if (db.config.status !== 'active') {
      releaseLock();
      const statusText = db.config.status === 'upcoming' ? 'Pemilihan belum dimulai' : 'Pemilihan telah ditutup';
      return res.status(403).json({ success: false, message: `Maaf, ${statusText}. Anda tidak dapat memberikan suara saat ini.` });
    }

    // Verify voter
    const voterIndex = db.voters.findIndex(v => v.nis === cleanNis && v.accessCode.toUpperCase() === cleanCode);
    if (voterIndex === -1) {
      releaseLock();
      return res.status(401).json({ success: false, message: 'Kredensial pemilih tidak valid!' });
    }

    const voter = db.voters[voterIndex];
    if (voter.hasVoted) {
      releaseLock();
      return res.status(409).json({
        success: false,
        message: 'Peringatan: Hak pilih untuk NIS ini sudah pernah digunakan sebelumnya!'
      });
    }

    // Verify candidate exists
    const candidate = db.candidates.find(c => c.id === candidateId);
    if (!candidate) {
      releaseLock();
      return res.status(404).json({ success: false, message: 'Kandidat yang dipilih tidak ditemukan!' });
    }

    // 1. Mark voter as voted (SEPARATED FROM BALLOT)
    db.voters[voterIndex].hasVoted = true;
    db.voters[voterIndex].votedAt = new Date().toISOString();

    // 2. Insert ANONYMOUS ballot (NO voter NIS or voter ID stored here)
    const anonymousVote = {
      id: 'vote-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      candidateId: candidate.id,
      candidateNumber: candidate.number,
      timestamp: new Date().toISOString()
    };
    db.votes.push(anonymousVote);

    // Save synchronously
    saveDatabase(db);

    // Sync vote to Supabase if connected
    writeVoteToSupabase(anonymousVote, voter.nis).catch((e) => console.error(e));

    // Sync vote to Cloud SQL PostgreSQL if connected
    recordVoteInCloudSql(anonymousVote, voter.nis).catch((e) => console.error(e));

    // Log anonymized audit entry
    logAudit(
      'PEMUNGUTAN_SUARA',
      'Siswa',
      `Satu suara sah diterima untuk Pasangan Calon No. ${candidate.number}. Hak suara kelas ${voter.className} tercatat digunakan.`
    );

    releaseLock();

    return res.json({
      success: true,
      message: 'Suara Anda berhasil disimpan ke dalam kotak suara digital secara aman dan rahasia.',
      timestamp: anonymousVote.timestamp
    });
  } catch (err: any) {
    releaseLock();
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Get Election Results
app.get('/api/results', (req: Request, res: Response) => {
  try {
    const db = readDatabase();
    const isAdmin = req.headers.authorization === 'Bearer admin-token-authorized';

    const totalVoters = db.voters.length;
    const totalVotesCast = db.votes.length;
    const totalPendingVoters = Math.max(0, totalVoters - totalVotesCast);
    const turnoutPercentage = totalVoters > 0 ? Number(((totalVotesCast / totalVoters) * 100).toFixed(1)) : 0;

    // Count tallies for each candidate
    const tallies = db.candidates.map(candidate => {
      const votesCount = db.votes.filter(v => v.candidateId === candidate.id || v.candidateNumber === candidate.number).length;
      const percentage = totalVotesCast > 0 ? Number(((votesCount / totalVotesCast) * 100).toFixed(1)) : 0;
      return {
        candidateId: candidate.id,
        candidateNumber: candidate.number,
        chairmanName: candidate.chairmanName,
        viceChairmanName: candidate.viceChairmanName,
        chairmanPhoto: candidate.chairmanPhoto,
        viceChairmanPhoto: candidate.viceChairmanPhoto,
        votesCount,
        percentage
      };
    }).sort((a, b) => b.votesCount - a.votesCount);

    // Check for ties in highest vote count
    let isTied = false;
    let leadingCandidate = null;

    if (tallies.length > 0 && totalVotesCast > 0) {
      const highestVotes = tallies[0].votesCount;
      const leaders = tallies.filter(t => t.votesCount === highestVotes);
      if (leaders.length > 1) {
        isTied = true;
      } else {
        leadingCandidate = {
          candidateNumber: leaders[0].candidateNumber,
          chairmanName: leaders[0].chairmanName,
          viceChairmanName: leaders[0].viceChairmanName,
          votesCount: leaders[0].votesCount
        };
      }
    }

    const resultsData: ElectionResults = {
      isPublished: db.config.isResultsPublished,
      totalVoters,
      totalVotesCast,
      totalPendingVoters,
      turnoutPercentage,
      candidateTallies: tallies,
      isTied,
      leadingCandidate
    };

    // If not published and request is not authenticated admin, do not disclose detailed votes
    if (!db.config.isResultsPublished && !isAdmin) {
      return res.json({
        success: true,
        isPublished: false,
        message: 'Hasil pemilihan belum dipublikasikan oleh Panitia KPU OSIS SMA Pasundan 8.',
        totalVoters,
        totalVotesCast,
        turnoutPercentage,
        candidateTallies: tallies.map(t => ({
          ...t,
          votesCount: -1, // Hidden
          percentage: 0   // Hidden
        })),
        isTied: false,
        leadingCandidate: null
      });
    }

    res.json({
      success: true,
      ...resultsData
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- ADMIN API ---

// Admin Login
app.post('/api/auth/admin-login', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const db = readDatabase();

    if (username === db.admin.username && password === db.admin.passwordHash) {
      logAudit('LOGIN_ADMIN', 'Administrator', 'Login administrator berhasil dari antarmuka web.');
      return res.json({
        success: true,
        token: 'admin-token-authorized',
        admin: {
          username: db.admin.username,
          name: db.admin.name,
          role: 'Super Administrator'
        }
      });
    }

    res.status(401).json({ success: false, message: 'Username atau password administrator salah!' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin change password
app.post('/api/admin/change-password', (req: Request, res: Response) => {
  try {
    const { oldPassword, newPassword, adminName } = req.body;
    const db = readDatabase();

    if (oldPassword !== db.admin.passwordHash) {
      return res.status(400).json({ success: false, message: 'Password lama salah!' });
    }
    if (!newPassword || newPassword.length < 5) {
      return res.status(400).json({ success: false, message: 'Password baru minimal 5 karakter!' });
    }

    db.admin.passwordHash = newPassword;
    if (adminName) db.admin.name = adminName;
    saveDatabase(db);
    logAudit('UBAH_PASSWORD_ADMIN', 'Administrator', 'Password akun administrator berhasil diperbarui.');

    res.json({ success: true, message: 'Password administrator berhasil diperbarui.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin Update Config (Status, Dates, Title, Logo, Banner)
app.put('/api/config', (req: Request, res: Response) => {
  try {
    const db = readDatabase();
    const updatedConfig: ElectionConfig = {
      ...db.config,
      ...req.body
    };
    db.config = updatedConfig;
    saveDatabase(db);
    logAudit('UPDATE_PENGATURAN', 'Administrator', `Pengaturan pemilihan diubah (Status: ${updatedConfig.status}, Publikasi: ${updatedConfig.isResultsPublished})`);

    res.json({ success: true, config: db.config, message: 'Pengaturan pemilihan berhasil diperbarui.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin Toggle Publish Results
app.post('/api/admin/toggle-publish', (req: Request, res: Response) => {
  try {
    const db = readDatabase();
    db.config.isResultsPublished = !db.config.isResultsPublished;
    saveDatabase(db);
    const actionDesc = db.config.isResultsPublished ? 'Hasil Pemilihan OSIS Dipublikasikan' : 'Publikasi Hasil Pemilihan Ditutup';
    logAudit('PUBLIKASI_HASIL', 'Administrator', actionDesc);

    res.json({
      success: true,
      isResultsPublished: db.config.isResultsPublished,
      message: db.config.isResultsPublished ? 'Hasil pemilihan kini dapat dilihat oleh seluruh siswa!' : 'Hasil pemilihan disembunyikan kembali.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Candidate CRUD
app.post('/api/candidates', (req: Request, res: Response) => {
  try {
    const db = readDatabase();
    const {
      number,
      chairmanName,
      chairmanClass,
      chairmanPhoto,
      viceChairmanName,
      viceChairmanClass,
      viceChairmanPhoto,
      vision,
      mission,
      programs,
      motto
    } = req.body;

    if (!number || !chairmanName || !viceChairmanName) {
      return res.status(400).json({ success: false, message: 'Nomor urut, Nama Ketua, dan Nama Wakil Ketua wajib diisi!' });
    }

    // Check duplicate number
    const formattedNumber = String(number).padStart(2, '0');
    if (db.candidates.some(c => c.number === formattedNumber)) {
      return res.status(400).json({ success: false, message: `Nomor urut ${formattedNumber} sudah digunakan pasangan lain!` });
    }

    const newCandidate: Candidate = {
      id: 'cand-' + Date.now(),
      number: formattedNumber,
      chairmanName,
      chairmanClass: chairmanClass || 'XI MIPA 1',
      chairmanPhoto: chairmanPhoto || '',
      viceChairmanName,
      viceChairmanClass: viceChairmanClass || 'XI IPS 1',
      viceChairmanPhoto: viceChairmanPhoto || '',
      vision: vision || '',
      mission: Array.isArray(mission) ? mission : (mission ? mission.split('\n').filter(Boolean) : []),
      programs: Array.isArray(programs) ? programs : (programs ? programs.split('\n').filter(Boolean) : []),
      motto: motto || 'Bersama Membangun Pasundan 8 Lebih Baik!'
    };

    db.candidates.push(newCandidate);
    saveDatabase(db);
    logAudit('TAMBAH_KANDIDAT', 'Administrator', `Pasangan Calon No. ${formattedNumber} (${chairmanName} & ${viceChairmanName}) berhasil ditambahkan.`);

    res.json({ success: true, candidate: newCandidate, message: 'Pasangan calon berhasil ditambahkan.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/candidates/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = readDatabase();
    const index = db.candidates.findIndex(c => c.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Data kandidat tidak ditemukan!' });
    }

    const existing = db.candidates[index];
    const updatedCandidate: Candidate = {
      ...existing,
      ...req.body,
      number: req.body.number ? String(req.body.number).padStart(2, '0') : existing.number,
      mission: Array.isArray(req.body.mission) ? req.body.mission : (typeof req.body.mission === 'string' ? req.body.mission.split('\n').filter(Boolean) : existing.mission),
      programs: Array.isArray(req.body.programs) ? req.body.programs : (typeof req.body.programs === 'string' ? req.body.programs.split('\n').filter(Boolean) : existing.programs)
    };

    db.candidates[index] = updatedCandidate;
    saveDatabase(db);
    logAudit('EDIT_KANDIDAT', 'Administrator', `Data Pasangan Calon No. ${updatedCandidate.number} (${updatedCandidate.chairmanName}) diperbarui.`);

    res.json({ success: true, candidate: updatedCandidate, message: 'Data kandidat berhasil diperbarui.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/candidates/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = readDatabase();
    const candidate = db.candidates.find(c => c.id === id);

    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Data kandidat tidak ditemukan!' });
    }

    db.candidates = db.candidates.filter(c => c.id !== id);
    saveDatabase(db);
    logAudit('HAPUS_KANDIDAT', 'Administrator', `Pasangan Calon No. ${candidate.number} (${candidate.chairmanName}) dihapus.`);

    res.json({ success: true, message: 'Kandidat berhasil dihapus.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Voters Management
app.get('/api/voters', (req: Request, res: Response) => {
  try {
    const db = readDatabase();
    const { search, className, status } = req.query;

    let filtered = [...db.voters];

    if (search && typeof search === 'string') {
      const s = search.toLowerCase();
      filtered = filtered.filter(v => v.nis.toLowerCase().includes(s) || v.fullName.toLowerCase().includes(s));
    }

    if (className && typeof className === 'string' && className !== 'all') {
      filtered = filtered.filter(v => v.className === className);
    }

    if (status && typeof status === 'string' && status !== 'all') {
      const hasVoted = status === 'voted';
      filtered = filtered.filter(v => v.hasVoted === hasVoted);
    }

    res.json({
      success: true,
      total: db.voters.length,
      filteredCount: filtered.length,
      voters: filtered
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/voters', (req: Request, res: Response) => {
  try {
    const db = readDatabase();
    const { nis, fullName, className, accessCode } = req.body;

    if (!nis || !fullName || !className) {
      return res.status(400).json({ success: false, message: 'NIS, Nama Lengkap, dan Kelas wajib diisi!' });
    }

    const cleanNis = String(nis).trim();
    if (db.voters.some(v => v.nis === cleanNis)) {
      return res.status(400).json({ success: false, message: `NIS ${cleanNis} sudah terdaftar dalam DPT!` });
    }

    const code = accessCode ? String(accessCode).trim().toUpperCase() : ('P8' + Math.random().toString(36).substring(2, 6).toUpperCase());

    const newVoter: Voter = {
      id: 'vtr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      nis: cleanNis,
      fullName: String(fullName).trim(),
      className: String(className).trim(),
      accessCode: code,
      hasVoted: false,
      votedAt: null
    };

    db.voters.push(newVoter);
    saveDatabase(db);
    logAudit('TAMBAH_PEMILIH', 'Administrator', `Pemilih baru terdaftar: ${newVoter.fullName} (${newVoter.nis} - ${newVoter.className})`);

    res.json({ success: true, voter: newVoter, message: 'Data siswa berhasil ditambahkan.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/voters/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = readDatabase();
    const index = db.voters.findIndex(v => v.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Data pemilih tidak ditemukan!' });
    }

    const { nis, fullName, className, accessCode } = req.body;
    const cleanNis = String(nis).trim();

    // Check duplicate NIS with other voters
    if (db.voters.some((v, i) => i !== index && v.nis === cleanNis)) {
      return res.status(400).json({ success: false, message: `NIS ${cleanNis} sudah digunakan siswa lain!` });
    }

    db.voters[index] = {
      ...db.voters[index],
      nis: cleanNis,
      fullName: String(fullName).trim(),
      className: String(className).trim(),
      accessCode: accessCode ? String(accessCode).trim().toUpperCase() : db.voters[index].accessCode
    };

    saveDatabase(db);
    logAudit('EDIT_PEMILIH', 'Administrator', `Data siswa diubah: ${db.voters[index].fullName} (${db.voters[index].nis})`);

    res.json({ success: true, voter: db.voters[index], message: 'Data siswa berhasil diperbarui.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/voters/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = readDatabase();
    const voter = db.voters.find(v => v.id === id);

    if (!voter) {
      return res.status(404).json({ success: false, message: 'Data siswa tidak ditemukan!' });
    }

    db.voters = db.voters.filter(v => v.id !== id);
    saveDatabase(db);
    logAudit('HAPUS_PEMILIH', 'Administrator', `Data siswa dihapus: ${voter.fullName} (${voter.nis})`);

    res.json({ success: true, message: 'Data siswa berhasil dihapus.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Import Voters from Excel (base64 or parsed array)
app.post('/api/voters/import-excel', (req: Request, res: Response) => {
  try {
    const { base64File, fileData } = req.body;
    const db = readDatabase();

    let rawRows: any[] = [];

    if (Array.isArray(fileData) && fileData.length > 0) {
      rawRows = fileData;
    } else if (base64File) {
      const buffer = Buffer.from(base64File.replace(/^data:.*?;base64,/, ''), 'base64');
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    } else {
      return res.status(400).json({ success: false, message: 'File Excel tidak ditemukan!' });
    }

    let importedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];
    const existingNisSet = new Set(db.voters.map(v => v.nis));
    const newlyAdded: Voter[] = [];

    rawRows.forEach((row, index) => {
      const rowNum = index + 2; // Accounting for 1-based index + header row

      // Flexible column headers matching Indonesian format
      const nis = String(row['NIS'] || row['nis'] || row['Nomor Induk'] || '').trim();
      const fullName = String(row['Nama Lengkap'] || row['Nama'] || row['nama'] || '').trim();
      const className = String(row['Kelas'] || row['kelas'] || '').trim();
      let accessCode = String(row['Kode Akses'] || row['Token'] || row['Password'] || '').trim().toUpperCase();

      if (!nis || !fullName || !className) {
        failedCount++;
        errors.push(`Baris ${rowNum}: Data tidak lengkap (NIS, Nama, atau Kelas kosong).`);
        return;
      }

      if (existingNisSet.has(nis)) {
        failedCount++;
        errors.push(`Baris ${rowNum}: NIS ${nis} (${fullName}) sudah ada dalam database (duplikat).`);
        return;
      }

      if (!accessCode) {
        // Auto-generate code
        accessCode = 'P8' + Math.random().toString(36).substring(2, 6).toUpperCase();
      }

      const newVoter: Voter = {
        id: 'vtr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6) + '-' + index,
        nis,
        fullName,
        className,
        accessCode,
        hasVoted: false,
        votedAt: null
      };

      existingNisSet.add(nis);
      db.voters.push(newVoter);
      newlyAdded.push(newVoter);
      importedCount++;
    });

    if (importedCount > 0) {
      saveDatabase(db);
      logAudit('IMPORT_EXCEL', 'Administrator', `Import Excel berhasil: ${importedCount} siswa ditambahkan, ${failedCount} gagal.`);
    }

    res.json({
      success: true,
      importedCount,
      failedCount,
      errors,
      sampleAdded: newlyAdded.slice(0, 5),
      message: `Impor selesai! ${importedCount} siswa berhasil ditambahkan, ${failedCount} data dilewati.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memproses file Excel: ' + err.message });
  }
});

// Download Excel Template for Voters
app.get('/api/template/voters', (req: Request, res: Response) => {
  try {
    const templateData = [
      {
        'NIS': '242510101',
        'Nama Lengkap': 'Ahmad Fauzan',
        'Kelas': 'X-1',
        'Kode Akses': 'P8K101',
        'Status': 'Belum Memilih'
      },
      {
        'NIS': '242510102',
        'Nama Lengkap': 'Bunga Citra Lestari',
        'Kelas': 'XI MIPA 2',
        'Kode Akses': 'P8K102',
        'Status': 'Belum Memilih'
      },
      {
        'NIS': '242510103',
        'Nama Lengkap': 'Dimas Anggara',
        'Kelas': 'XII IPS 1',
        'Kode Akses': 'P8K103',
        'Status': 'Belum Memilih'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template DPT');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="Template_DPT_Siswa_SMA_Pasundan_8.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Export Voters to Excel
app.get('/api/export/voters', (req: Request, res: Response) => {
  try {
    const db = readDatabase();
    const rows = db.voters.map((v, idx) => ({
      'No': idx + 1,
      'NIS': v.nis,
      'Nama Lengkap': v.fullName,
      'Kelas': v.className,
      'Kode Akses': v.accessCode,
      'Status Hak Suara': v.hasVoted ? 'Sudah Memilih' : 'Belum Memilih',
      'Waktu Memilih': v.votedAt ? new Date(v.votedAt).toLocaleString('id-ID') : '-'
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DPT Siswa');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="Daftar_Pemilih_Tetap_SMA_Pasundan_8.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Export Results to Excel
app.get('/api/export/results', (req: Request, res: Response) => {
  try {
    const db = readDatabase();
    const totalVotes = db.votes.length;

    const summaryRows = db.candidates.map(candidate => {
      const votesCount = db.votes.filter(v => v.candidateId === candidate.id || v.candidateNumber === candidate.number).length;
      const percentage = totalVotes > 0 ? ((votesCount / totalVotes) * 100).toFixed(2) + '%' : '0%';
      return {
        'No. Urut': candidate.number,
        'Calon Ketua OSIS': candidate.chairmanName,
        'Kelas Ketua': candidate.chairmanClass,
        'Calon Wakil Ketua OSIS': candidate.viceChairmanName,
        'Kelas Wakil': candidate.viceChairmanClass,
        'Perolehan Suara': votesCount,
        'Persentase': percentage
      };
    });

    const statsRows = [
      { 'Keterangan': 'Total DPT (Pemilih Terdaftar)', 'Jumlah': db.voters.length },
      { 'Keterangan': 'Total Suara Masuk (Sah)', 'Jumlah': totalVotes },
      { 'Keterangan': 'Jumlah Pemilih Belum Memilih', 'Jumlah': Math.max(0, db.voters.length - totalVotes) },
      { 'Keterangan': 'Tingkat Partisipasi', 'Jumlah': (db.voters.length > 0 ? ((totalVotes / db.voters.length) * 100).toFixed(2) : 0) + '%' },
      { 'Keterangan': 'Status Pemilihan', 'Jumlah': db.config.status === 'active' ? 'Sedang Berlangsung' : (db.config.status === 'closed' ? 'Sudah Ditutup' : 'Belum Dimulai') },
      { 'Keterangan': 'Waktu Ekspor', 'Jumlah': new Date().toLocaleString('id-ID') }
    ];

    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    const wsStats = XLSX.utils.json_to_sheet(statsRows);

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Perolehan Suara');
    XLSX.utils.book_append_sheet(wb, wsStats, 'Statistik Pemilihan');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="Hasil_Rekapitulasi_Pemilihan_OSIS_SMA_Pasundan_8.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Audit Logs
app.get('/api/admin/audit-logs', (req: Request, res: Response) => {
  try {
    const db = readDatabase();
    res.json({
      success: true,
      logs: db.auditLogs.slice(0, 100)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Backup Database State (Full JSON Snapshot)
app.get('/api/admin/backup-data', (req: Request, res: Response) => {
  try {
    const db = readDatabase();
    const backupSnapshot = {
      app: 'E-VOTING OSIS SMA PASUNDAN 8 BANDUNG',
      exportDate: new Date().toISOString(),
      config: db.config,
      candidates: db.candidates,
      voters: db.voters,
      votesCount: db.votes.length,
      votes: db.votes,
      auditLogs: db.auditLogs
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="backup-evoting-pasundan8-${new Date().toISOString().slice(0, 10)}.json"`);
    res.json(backupSnapshot);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Comprehensive Reset Data Endpoint
app.post('/api/admin/reset-data', async (req: Request, res: Response) => {
  try {
    const { adminPassword, confirmationText, type } = req.body;
    const db = readDatabase();

    // 1. Password Verification
    if (adminPassword !== db.admin.passwordHash) {
      return res.status(401).json({ success: false, message: 'Password administrator salah!' });
    }

    // 2. Safety Confirmation Word Verification
    if (String(confirmationText || '').trim().toUpperCase() !== 'RESET') {
      return res.status(400).json({ 
        success: false, 
        message: 'Kata konfirmasi salah. Harap ketik "RESET" dengan huruf kapital untuk mengonfirmasi tindakan.' 
      });
    }

    let actionLabel = '';
    let responseMessage = '';
    let supabaseResult: any = null;

    switch (type) {
      case 'votes':
        // Reset only voting ballots and voter participation
        db.votes = [];
        db.voters = db.voters.map(v => ({
          ...v,
          hasVoted: false,
          votedAt: null
        }));
        db.config.isResultsPublished = false;
        actionLabel = 'RESET_KOTAK_SUARA';
        responseMessage = 'Kotak suara berhasil dikosongkan. Seluruh pemilih (DPT) telah dipulihkan hak suaranya dan hasil pemilihan ditutup kembali.';
        supabaseResult = await resetSupabaseData('votes');
        break;

      case 'voters':
        // Reset voter roll (DPT) and associated votes
        const voterCountBefore = db.voters.length;
        db.voters = [];
        db.votes = [];
        db.config.isResultsPublished = false;
        actionLabel = 'RESET_DPT_SISWA';
        responseMessage = `Seluruh data pemilih tetap (${voterCountBefore} siswa) dan surat suara berhasil dihapus. Siap untuk import Excel baru.`;
        supabaseResult = await resetSupabaseData('voters');
        break;

      case 'candidates':
        // Reset candidate pairs and votes
        const candidateCountBefore = db.candidates.length;
        db.candidates = [];
        db.votes = [];
        db.config.isResultsPublished = false;
        db.voters = db.voters.map(v => ({
          ...v,
          hasVoted: false,
          votedAt: null
        }));
        actionLabel = 'RESET_PASANGAN_CALON';
        responseMessage = `Seluruh ${candidateCountBefore} pasangan calon dan surat suara berhasil dihapus. Anda dapat menambahkan calon baru.`;
        supabaseResult = await resetSupabaseData('candidates');
        break;

      case 'factory':
        // Factory reset: restore default SMA Pasundan 8 candidates and voters (fresh non-voted)
        db.candidates = JSON.parse(JSON.stringify(INITIAL_CANDIDATES));
        db.voters = INITIAL_VOTERS.map(v => ({
          ...v,
          hasVoted: false,
          votedAt: null
        }));
        db.votes = [];
        db.config = {
          ...INITIAL_CONFIG,
          status: 'active',
          isResultsPublished: false
        };
        actionLabel = 'RESET_SETELAN_PABRIK';
        responseMessage = 'Sistem berhasil dikembalikan ke Setelan Pabrik Demo SMA Pasundan 8 Bandung (3 paslon resmi, 25 DPT siswa, kotak suara bersih).';
        await resetSupabaseData('all');
        supabaseResult = await syncLocalDataToSupabase();
        break;

      case 'clear-all':
        // Clear everything for a brand new academic year from scratch
        db.candidates = [];
        db.voters = [];
        db.votes = [];
        db.config.isResultsPublished = false;
        db.config.status = 'upcoming';
        actionLabel = 'RESET_KOSONGKAN_TOTAL';
        responseMessage = 'Seluruh data pemilu (kandidat, pemilih DPT, dan suara) berhasil dikosongkan total untuk memulai pemilu baru.';
        supabaseResult = await resetSupabaseData('all');
        break;

      default:
        return res.status(400).json({ success: false, message: 'Jenis reset tidak valid!' });
    }

    saveDatabase(db);
    logAudit(actionLabel, 'Administrator', responseMessage);

    res.json({
      success: true,
      message: responseMessage,
      supabaseResult
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Reset Voting Data (Emergency / Backward Compatibility)
app.post('/api/admin/reset-votes', async (req: Request, res: Response) => {
  try {
    const { adminPassword } = req.body;
    const db = readDatabase();

    if (adminPassword !== db.admin.passwordHash) {
      return res.status(401).json({ success: false, message: 'Password administrator salah!' });
    }

    db.votes = [];
    db.voters = db.voters.map(v => ({
      ...v,
      hasVoted: false,
      votedAt: null
    }));
    db.config.isResultsPublished = false;

    saveDatabase(db);
    await resetSupabaseData('votes');
    logAudit('RESET_KOTAK_SUARA', 'Administrator', 'Kotak suara dan status hak pilih seluruh siswa berhasil direset ke nol.');

    res.json({
      success: true,
      message: 'Seluruh suara berhasil dikosongkan dan hak pilih siswa telah dipulihkan.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- SUPABASE INTEGRATION API ---
app.get('/api/supabase/status', (req: Request, res: Response) => {
  try {
    const status = getSupabaseStatus();
    res.json({ success: true, status });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/supabase/sql-script', (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      sql: SUPABASE_SQL_SCRIPT,
      patchSql: SUPABASE_ADD_COLUMNS_SQL
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/supabase/test', async (req: Request, res: Response) => {
  try {
    const { url, key } = req.body;
    if (!url || !key) {
      return res.status(400).json({ success: false, message: 'URL dan Key Supabase harus diisi!' });
    }
    const result = await testSupabaseConnection(url.trim(), key.trim());
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/supabase/save', async (req: Request, res: Response) => {
  try {
    const { url, key, dbUrl } = req.body;
    if (!url || !key) {
      return res.status(400).json({ success: false, message: 'URL dan Key Supabase harus diisi!' });
    }
    const result = await saveSupabaseConfig(url.trim(), key.trim(), dbUrl?.trim());
    logAudit('KONEKSI_SUPABASE', 'Administrator', `Konfigurasi Supabase diperbarui (${url.trim()}). Status: ${result.isConnected ? 'Terhubung' : 'Belum Ada Tabel'}`);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/supabase/migrate', async (req: Request, res: Response) => {
  try {
    const { dbUrl } = req.body;
    if (!dbUrl) {
      return res.status(400).json({
        success: false,
        message: 'URI PostgreSQL harus diisi! Contoh: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres'
      });
    }
    const result = await runDirectPostgresMigration(dbUrl.trim());
    logAudit('MIGRASI_SUPABASE', 'Administrator', 'Migrasi skema database dieksekusi langsung ke Supabase PostgreSQL.');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/supabase/sync', async (req: Request, res: Response) => {
  try {
    const result = await syncLocalDataToSupabase();
    logAudit('SYNC_SUPABASE', 'Administrator', 'Data pemilihan disinkronkan ke Supabase.');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/cloudsql/status', (req: Request, res: Response) => {
  try {
    const isConfigured = isCloudSqlConfigured();
    res.json({
      success: true,
      isConfigured,
      database: process.env.SQL_DB_NAME || null,
      region: 'asia-southeast1'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/cloudsql/sync', async (req: Request, res: Response) => {
  try {
    const result = await syncLocalDataToCloudSql();
    logAudit('SYNC_CLOUDSQL', 'Administrator', 'Data pemilihan disinkronkan ke Cloud SQL PostgreSQL.');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API 404 Handler - ensure all unmatched /api routes return JSON, never HTML
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Endpoint API ${req.method} ${req.path} tidak ditemukan.`
  });
});

// Global Error Handler for API routes - ensures JSON response on exceptions
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('[Express API Error]', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal pada server.'
  });
});

// Setup Vite middleware or serve static dist
async function setupServer() {
  // Sync data to Cloud SQL on startup if configured
  if (isCloudSqlConfigured()) {
    syncLocalDataToCloudSql()
      .then((res) => {
        if (res.success) {
          console.log('[Cloud SQL] Data automatically synchronized to PostgreSQL.');
        } else {
          console.warn('[Cloud SQL] Automatic sync notice:', res.message);
        }
      })
      .catch((err) => {
        console.error('[Cloud SQL] Error during automatic startup sync:', err);
      });
  }

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server E-Voting OSIS SMA Pasundan 8 Bandung berjalan di http://localhost:${PORT}`);
  });
}

setupServer();
