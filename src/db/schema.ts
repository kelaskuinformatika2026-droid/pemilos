import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  role: text('role').default('voter'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const electionConfig = pgTable('election_config', {
  id: text('id').primaryKey(),
  schoolName: text('school_name').notNull(),
  appName: text('app_name').notNull(),
  slogan: text('slogan').notNull(),
  academicYear: text('academic_year').notNull(),
  electionTitle: text('election_title').notNull(),
  electionDate: text('election_date').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  status: text('status').notNull().default('active'),
  isResultsPublished: boolean('is_results_published').notNull().default(false),
  schoolLogo: text('school_logo'),
  osisLogo: text('osis_logo'),
  schoolBanner: text('school_banner'),
  committeeHead: text('committee_head'),
  wakasekKesiswaan: text('wakasek_kesiswaan'),
  pembinaOsis: text('pembina_osis'),
  ketuaOsis: text('ketua_osis'),
  ketuaPanitia: text('ketua_panitia'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const candidates = pgTable('candidates', {
  id: text('id').primaryKey(),
  number: text('number').notNull().unique(),
  chairmanName: text('chairman_name').notNull(),
  chairmanClass: text('chairman_class').notNull(),
  chairmanPhoto: text('chairman_photo'),
  viceChairmanName: text('vice_chairman_name').notNull(),
  viceChairmanClass: text('vice_chairman_class').notNull(),
  viceChairmanPhoto: text('vice_chairman_photo'),
  vision: text('vision').notNull(),
  mission: text('mission').notNull(), // JSON string array
  programs: text('programs').notNull(), // JSON string array
  motto: text('motto'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const voters = pgTable('voters', {
  id: text('id').primaryKey(),
  nis: text('nis').notNull().unique(),
  fullName: text('full_name').notNull(),
  className: text('class_name').notNull(),
  accessCode: text('access_code').notNull(),
  hasVoted: boolean('has_voted').notNull().default(false),
  votedAt: text('voted_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const anonymousVotes = pgTable('anonymous_votes', {
  id: text('id').primaryKey(),
  candidateId: text('candidate_id').notNull().references(() => candidates.id),
  candidateNumber: text('candidate_number').notNull(),
  timestamp: text('timestamp').notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  timestamp: text('timestamp').notNull(),
  actor: text('actor').notNull(),
  action: text('action').notNull(),
  details: text('details').notNull(),
});
