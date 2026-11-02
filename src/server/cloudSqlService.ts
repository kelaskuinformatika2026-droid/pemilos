import { eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import {
  anonymousVotes,
  auditLogs,
  candidates as candidatesTable,
  electionConfig as electionConfigTable,
  voters as votersTable,
} from '../db/schema.ts';
import { AnonymousVote, Candidate, ElectionConfig, Voter } from '../types/index.ts';
import { readDatabase } from './db.ts';

export function isCloudSqlConfigured(): boolean {
  return Boolean(
    process.env.SQL_HOST &&
    process.env.SQL_DB_NAME &&
    process.env.SQL_USER &&
    process.env.SQL_PASSWORD
  );
}

export async function syncLocalDataToCloudSql(): Promise<{ success: boolean; message: string }> {
  if (!isCloudSqlConfigured()) {
    return { success: false, message: 'Cloud SQL environment variables are not set.' };
  }

  try {
    const localDb = readDatabase();

    // 1. Sync Election Config
    if (localDb.config) {
      const cfg = localDb.config;
      await db
        .insert(electionConfigTable)
        .values({
          id: 'config-main',
          schoolName: cfg.schoolName || '',
          appName: cfg.appName || '',
          slogan: cfg.slogan || '',
          academicYear: cfg.academicYear || '',
          electionTitle: cfg.electionTitle || '',
          electionDate: cfg.electionDate || '',
          startTime: cfg.startTime || '',
          endTime: cfg.endTime || '',
          status: cfg.status || 'active',
          isResultsPublished: Boolean(cfg.isResultsPublished),
          schoolLogo: cfg.schoolLogo || '',
          osisLogo: cfg.osisLogo || '',
          schoolBanner: cfg.schoolBanner || '',
          committeeHead: cfg.committeeHead || '',
          wakasekKesiswaan: cfg.wakasekKesiswaan || '',
          pembinaOsis: cfg.pembinaOsis || '',
          ketuaOsis: cfg.ketuaOsis || '',
          ketuaPanitia: cfg.ketuaPanitia || '',
        })
        .onConflictDoUpdate({
          target: electionConfigTable.id,
          set: {
            schoolName: cfg.schoolName || '',
            appName: cfg.appName || '',
            slogan: cfg.slogan || '',
            academicYear: cfg.academicYear || '',
            electionTitle: cfg.electionTitle || '',
            electionDate: cfg.electionDate || '',
            startTime: cfg.startTime || '',
            endTime: cfg.endTime || '',
            status: cfg.status || 'active',
            isResultsPublished: Boolean(cfg.isResultsPublished),
            schoolLogo: cfg.schoolLogo || '',
            osisLogo: cfg.osisLogo || '',
            schoolBanner: cfg.schoolBanner || '',
            committeeHead: cfg.committeeHead || '',
            wakasekKesiswaan: cfg.wakasekKesiswaan || '',
            pembinaOsis: cfg.pembinaOsis || '',
            ketuaOsis: cfg.ketuaOsis || '',
            ketuaPanitia: cfg.ketuaPanitia || '',
          },
        });
    }

    // 2. Sync Candidates
    if (localDb.candidates && localDb.candidates.length > 0) {
      for (const cand of localDb.candidates) {
        await db
          .insert(candidatesTable)
          .values({
            id: cand.id,
            number: cand.number,
            chairmanName: cand.chairmanName,
            chairmanClass: cand.chairmanClass,
            chairmanPhoto: cand.chairmanPhoto || '',
            viceChairmanName: cand.viceChairmanName,
            viceChairmanClass: cand.viceChairmanClass,
            viceChairmanPhoto: cand.viceChairmanPhoto || '',
            vision: cand.vision,
            mission: JSON.stringify(cand.mission || []),
            programs: JSON.stringify(cand.programs || []),
            motto: cand.motto || '',
          })
          .onConflictDoUpdate({
            target: candidatesTable.number,
            set: {
              chairmanName: cand.chairmanName,
              chairmanClass: cand.chairmanClass,
              chairmanPhoto: cand.chairmanPhoto || '',
              viceChairmanName: cand.viceChairmanName,
              viceChairmanClass: cand.viceChairmanClass,
              viceChairmanPhoto: cand.viceChairmanPhoto || '',
              vision: cand.vision,
              mission: JSON.stringify(cand.mission || []),
              programs: JSON.stringify(cand.programs || []),
              motto: cand.motto || '',
            },
          });
      }
    }

    // 3. Sync Voters
    if (localDb.voters && localDb.voters.length > 0) {
      for (const vtr of localDb.voters) {
        await db
          .insert(votersTable)
          .values({
            id: vtr.id,
            nis: vtr.nis,
            fullName: vtr.fullName,
            className: vtr.className,
            accessCode: vtr.accessCode,
            hasVoted: vtr.hasVoted,
            votedAt: vtr.votedAt || null,
          })
          .onConflictDoUpdate({
            target: votersTable.nis,
            set: {
              fullName: vtr.fullName,
              className: vtr.className,
              accessCode: vtr.accessCode,
              hasVoted: vtr.hasVoted,
              votedAt: vtr.votedAt || null,
            },
          });
      }
    }

    // 4. Sync Anonymous Votes
    if (localDb.votes && localDb.votes.length > 0) {
      for (const vt of localDb.votes) {
        await db
          .insert(anonymousVotes)
          .values({
            id: vt.id,
            candidateId: vt.candidateId,
            candidateNumber: vt.candidateNumber,
            timestamp: vt.timestamp,
          })
          .onConflictDoNothing();
      }
    }

    return {
      success: true,
      message: 'Berhasil menyinkronkan data pemilu ke Cloud SQL PostgreSQL.',
    };
  } catch (error: any) {
    console.error('Gagal menyinkronkan data ke Cloud SQL:', error);
    return {
      success: false,
      message: 'Gagal menyinkronkan ke Cloud SQL: ' + (error.message || String(error)),
    };
  }
}

export async function recordVoteInCloudSql(
  anonymousVote: AnonymousVote,
  voterNis: string
): Promise<void> {
  if (!isCloudSqlConfigured()) return;

  try {
    // Insert anonymous ballot
    await db.insert(anonymousVotes).values({
      id: anonymousVote.id,
      candidateId: anonymousVote.candidateId,
      candidateNumber: anonymousVote.candidateNumber,
      timestamp: anonymousVote.timestamp,
    });

    // Mark voter as voted
    await db
      .update(votersTable)
      .set({
        hasVoted: true,
        votedAt: anonymousVote.timestamp,
      })
      .where(eq(votersTable.nis, voterNis));
  } catch (err) {
    console.error('Error recording vote in Cloud SQL:', err);
  }
}
