import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AnonymousVote, AuditLog, Candidate, ElectionConfig, Voter } from '../types';
import { INITIAL_CANDIDATES, INITIAL_CONFIG, INITIAL_VOTERS } from '../utils/defaultAssets';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

export interface DatabaseSchema {
  config: ElectionConfig;
  candidates: Candidate[];
  voters: Voter[];
  votes: AnonymousVote[];
  auditLogs: AuditLog[];
  admin: {
    username: string;
    passwordHash: string; // Plain/SHA/Salted
    name: string;
  };
}

// In-memory mutex for safe atomic transactions
let isTransactionLocked = false;
const lockQueue: Array<() => void> = [];

export async function acquireLock(): Promise<() => void> {
  return new Promise((resolve) => {
    const tryAcquire = () => {
      if (!isTransactionLocked) {
        isTransactionLocked = true;
        resolve(() => {
          isTransactionLocked = false;
          if (lockQueue.length > 0) {
            const next = lockQueue.shift();
            if (next) next();
          }
        });
      } else {
        lockQueue.push(tryAcquire);
      }
    };
    tryAcquire();
  });
}

function getInitialVotes(): AnonymousVote[] {
  // Pre-seed matching the 15 voters who have already voted in demo
  return [
    { id: "vote-01", candidateId: "cand-01", candidateNumber: "01", timestamp: "2026-11-05T08:12:45.120Z" },
    { id: "vote-02", candidateId: "cand-01", candidateNumber: "01", timestamp: "2026-11-05T08:15:20.300Z" },
    { id: "vote-03", candidateId: "cand-02", candidateNumber: "02", timestamp: "2026-11-05T08:19:05.800Z" },
    { id: "vote-04", candidateId: "cand-01", candidateNumber: "01", timestamp: "2026-11-05T08:24:11.450Z" },
    { id: "vote-05", candidateId: "cand-02", candidateNumber: "02", timestamp: "2026-11-05T08:35:42.200Z" },
    { id: "vote-06", candidateId: "cand-02", candidateNumber: "02", timestamp: "2026-11-05T08:41:09.110Z" },
    { id: "vote-07", candidateId: "cand-01", candidateNumber: "01", timestamp: "2026-11-05T08:48:33.400Z" },
    { id: "vote-08", candidateId: "cand-02", candidateNumber: "02", timestamp: "2026-11-05T09:02:18.900Z" },
    { id: "vote-09", candidateId: "cand-01", candidateNumber: "01", timestamp: "2026-11-05T09:14:40.150Z" },
    { id: "vote-10", candidateId: "cand-02", candidateNumber: "02", timestamp: "2026-11-05T09:22:15.600Z" },
    { id: "vote-11", candidateId: "cand-02", candidateNumber: "02", timestamp: "2026-11-05T09:30:50.000Z" },
    { id: "vote-12", candidateId: "cand-01", candidateNumber: "01", timestamp: "2026-11-05T09:44:12.750Z" },
    { id: "vote-13", candidateId: "cand-01", candidateNumber: "01", timestamp: "2026-11-05T09:50:00.000Z" },
    { id: "vote-14", candidateId: "cand-02", candidateNumber: "02", timestamp: "2026-11-05T10:05:32.400Z" },
    { id: "vote-15", candidateId: "cand-01", candidateNumber: "01", timestamp: "2026-11-05T10:12:19.800Z" },
    { id: "vote-16", candidateId: "cand-02", candidateNumber: "02", timestamp: "2026-11-05T10:25:44.200Z" }
  ];
}

export function initDatabase(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData: DatabaseSchema = {
      config: INITIAL_CONFIG,
      candidates: INITIAL_CANDIDATES,
      voters: INITIAL_VOTERS,
      votes: getInitialVotes(),
      auditLogs: [
        {
          id: "log-001",
          timestamp: new Date().toISOString(),
          actor: "SISTEM",
          action: "INISIALISASI_SISTEM",
          details: "Sistem E-Voting OSIS SMA Pasundan 8 Bandung berhasil diinisialisasi."
        }
      ],
      admin: {
        username: "admin",
        passwordHash: "admin123", // Default administrative password
        name: "Administrator KPU OSIS SMA Pasundan 8"
      }
    };
    saveDatabase(initialData);
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read database file, restoring defaults", err);
    const initialData: DatabaseSchema = {
      config: INITIAL_CONFIG,
      candidates: INITIAL_CANDIDATES,
      voters: INITIAL_VOTERS,
      votes: getInitialVotes(),
      auditLogs: [],
      admin: {
        username: "admin",
        passwordHash: "admin123",
        name: "Administrator KPU OSIS SMA Pasundan 8"
      }
    };
    saveDatabase(initialData);
    return initialData;
  }
}

export function readDatabase(): DatabaseSchema {
  if (!fs.existsSync(DB_FILE)) {
    return initDatabase();
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return initDatabase();
  }
}

export function saveDatabase(data: DatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tempFile = DB_FILE + '.tmp';
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
}

export function logAudit(action: string, actor: string, details: string): void {
  try {
    const db = readDatabase();
    const newLog: AuditLog = {
      id: "log-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      actor,
      action,
      details
    };
    db.auditLogs.unshift(newLog);
    if (db.auditLogs.length > 500) {
      db.auditLogs = db.auditLogs.slice(0, 500);
    }
    saveDatabase(db);
  } catch (e) {
    console.error("Failed to log audit", e);
  }
}
