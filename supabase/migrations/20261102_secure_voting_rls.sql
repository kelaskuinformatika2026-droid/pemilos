-- E-Voting OSIS SMA Pasundan 8 Bandung
-- Secure, additive migration. Does NOT truncate, delete, reset, or overwrite existing election data.
-- Run once in Supabase Dashboard > SQL Editor using the project owner role.
-- Back up the project before applying any schema migration.

begin;

-- Keep public read access limited to non-sensitive election display data.
alter table public.election_config enable row level security;
alter table public.candidates enable row level security;
alter table public.voters enable row level security;
alter table public.anonymous_votes enable row level security;
alter table public.audit_logs enable row level security;

-- Remove legacy policies that granted unrestricted access.
drop policy if exists "Full Access Candidates" on public.candidates;
drop policy if exists "Full Access Config" on public.election_config;
drop policy if exists "Full Access Voters" on public.voters;
drop policy if exists "Full Access Votes" on public.anonymous_votes;
drop policy if exists "Full Access Audit" on public.audit_logs;

-- Revoke direct access first; then grant only public read access to display tables.
revoke all on public.election_config, public.candidates, public.voters,
  public.anonymous_votes, public.audit_logs from anon, authenticated;

grant select on public.election_config, public.candidates to anon, authenticated;

drop policy if exists "Public can read election config" on public.election_config;
create policy "Public can read election config"
  on public.election_config for select to anon, authenticated using (true);

drop policy if exists "Public can read candidates" on public.candidates;
create policy "Public can read candidates"
  on public.candidates for select to anon, authenticated using (true);

-- Admin role registry. Populate it manually with the Auth UUID of each trusted admin.
create table if not exists public.admin_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'superadmin')),
  created_at timestamptz not null default now()
);
alter table public.admin_roles enable row level security;
revoke all on public.admin_roles from anon, authenticated;
grant select on public.admin_roles to authenticated;
drop policy if exists "Admins can read own role" on public.admin_roles;
create policy "Admins can read own role"
  on public.admin_roles for select to authenticated
  using (auth.uid() = user_id);

-- Safe voter login: credentials are checked inside the database; no voter table read is exposed.
create or replace function public.evoting_voter_login(p_nis text, p_access_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v public.voters%rowtype;
  election_status text;
begin
  if coalesce(trim(p_nis), '') = '' or coalesce(trim(p_access_code), '') = '' then
    return jsonb_build_object('success', false, 'message', 'NIS dan kode akses wajib diisi.');
  end if;

  select * into v
  from public.voters
  where trim(nis) = trim(p_nis)
  limit 1;

  if not found or upper(trim(v.access_code)) <> upper(trim(p_access_code)) then
    return jsonb_build_object('success', false, 'message', 'NIS atau kode akses tidak valid.');
  end if;

  select status into election_status
  from public.election_config
  order by updated_at desc nulls last
  limit 1;

  return jsonb_build_object(
    'success', true,
    'voter', jsonb_build_object(
      'id', v.id,
      'nis', v.nis,
      'fullName', v.full_name,
      'className', v.class_name,
      'hasVoted', v.has_voted,
      'votedAt', v.voted_at
    ),
    'electionStatus', coalesce(election_status, 'upcoming')
  );
end;
$$;

-- Atomic vote: the voter status update and anonymous ballot insert commit or roll back together.
-- No NIS or voter ID is written into anonymous_votes.
create or replace function public.evoting_cast_vote(
  p_nis text,
  p_access_code text,
  p_candidate_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v public.voters%rowtype;
  c public.candidates%rowtype;
  election_status text;
  vote_time timestamptz := now();
  vote_id text := 'vote-' || gen_random_uuid()::text;
begin
  if coalesce(trim(p_nis), '') = '' or coalesce(trim(p_access_code), '') = ''
     or coalesce(trim(p_candidate_id), '') = '' then
    return jsonb_build_object('success', false, 'message', 'Data pemilihan tidak lengkap.');
  end if;

  select status into election_status
  from public.election_config
  order by updated_at desc nulls last
  limit 1;

  if coalesce(election_status, 'upcoming') <> 'active' then
    return jsonb_build_object('success', false, 'message', 'Pemilihan belum aktif atau sudah ditutup.');
  end if;

  select * into c from public.candidates where id = p_candidate_id limit 1;
  if not found then
    return jsonb_build_object('success', false, 'message', 'Pasangan calon tidak ditemukan.');
  end if;

  -- Conditional UPDATE serializes concurrent attempts for the same NIS.
  update public.voters
    set has_voted = true, voted_at = vote_time::text
    where trim(nis) = trim(p_nis)
      and upper(trim(access_code)) = upper(trim(p_access_code))
      and has_voted = false
    returning * into v;

  if not found then
    select * into v from public.voters where trim(nis) = trim(p_nis) limit 1;
    if not found or upper(trim(v.access_code)) <> upper(trim(p_access_code)) then
      return jsonb_build_object('success', false, 'message', 'NIS atau kode akses tidak valid.');
    end if;
    return jsonb_build_object('success', false, 'message', 'Hak pilih untuk NIS ini sudah digunakan.');
  end if;

  insert into public.anonymous_votes (id, candidate_id, candidate_number, timestamp)
  values (vote_id, c.id, c.number, vote_time::text);

  return jsonb_build_object(
    'success', true,
    'message', 'Suara berhasil disimpan.',
    'timestamp', vote_time
  );
end;
$$;

-- Do not allow anonymous clients to call internal helper functions or read private tables.
revoke all on function public.evoting_voter_login(text, text) from public;
revoke all on function public.evoting_cast_vote(text, text, text) from public;
grant execute on function public.evoting_voter_login(text, text) to anon, authenticated;
grant execute on function public.evoting_cast_vote(text, text, text) to anon, authenticated;

notify pgrst, 'reload schema';
commit;

-- Post-migration checks (run separately after the transaction):
-- select tablename, rowsecurity from pg_tables
-- where schemaname = 'public'
-- and tablename in ('election_config','candidates','voters','anonymous_votes','audit_logs','admin_roles');
-- select proname from pg_proc join pg_namespace n on n.oid=pronamespace
-- where n.nspname='public' and proname in ('evoting_voter_login','evoting_cast_vote');
