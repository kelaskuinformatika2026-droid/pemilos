export type ElectionStatus = 'upcoming' | 'active' | 'closed';

export interface ElectionConfig {
  schoolName: string;
  appName: string;
  slogan: string;
  academicYear: string;
  electionTitle: string;
  electionDate: string;
  startTime: string;
  endTime: string;
  status: ElectionStatus;
  isResultsPublished: boolean;
  schoolLogo: string;
  osisLogo?: string;
  schoolBanner: string;
  announcementTitle: string;
  announcementBody: string;
  committeeHead: string; // Kepala Sekolah
  wakasekKesiswaan?: string; // Wakasek. Kesiswaan
  pembinaOsis: string; // Pembina OSIS
  ketuaOsis?: string; // Ketua OSIS
  ketuaPanitia: string; // Ketua Pemilu OSIS
}

export interface Candidate {
  id: string;
  number: string; // e.g. "01", "02", "03"
  chairmanName: string;
  chairmanClass: string;
  chairmanPhoto: string;
  viceChairmanName: string;
  viceChairmanClass: string;
  viceChairmanPhoto: string;
  vision: string;
  mission: string[];
  programs: string[];
  motto: string;
  colorTheme?: string;
}

export interface Voter {
  id: string;
  nis: string;
  fullName: string;
  className: string;
  accessCode: string;
  hasVoted: boolean;
  votedAt?: string | null;
}

export interface AnonymousVote {
  id: string;
  candidateId: string;
  candidateNumber: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
  ipAddress?: string;
}

export interface ElectionResults {
  isPublished: boolean;
  totalVoters: number;
  totalVotesCast: number;
  totalPendingVoters: number;
  turnoutPercentage: number;
  candidateTallies: {
    candidateId: string;
    candidateNumber: string;
    chairmanName: string;
    viceChairmanName: string;
    chairmanPhoto: string;
    viceChairmanPhoto: string;
    votesCount: number;
    percentage: number;
  }[];
  isTied: boolean;
  leadingCandidate?: {
    candidateNumber: string;
    chairmanName: string;
    viceChairmanName: string;
    votesCount: number;
  } | null;
}

export interface VoterSession {
  nis: string;
  fullName: string;
  className: string;
  hasVoted: boolean;
  token?: string;
}

export interface AdminSession {
  username: string;
  name: string;
  role: string;
  token: string;
}
