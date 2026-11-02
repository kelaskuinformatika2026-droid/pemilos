-- E-Voting OSIS SMA Pasundan 8 Bandung
-- Correct the vote ID type and avoid linking the anonymous ballot timestamp
-- to the voter's identity timestamp.
-- Additive function-only migration: existing voter, candidate, config, and vote
-- rows are not deleted or rewritten.
--
-- Review and back up the Supabase project before applying this migration.
-- Apply through Supabase SQL Editor only after reviewing the PR.

begin;

create or replace function public.evoting_cast_vote(
  p_nis text,
  p_access_code text,
  p_candidate_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v public.voters%rowtype;
  c public.candidates%rowtype;
  election_status text;
  vote_time timestamptz := pg_catalog.now();
  vote_id uuid := pg_catalog.gen_random_uuid();
begin
  if coalesce(pg_catalog.btrim(p_nis), '') = ''
     or coalesce(pg_catalog.btrim(p_access_code), '') = ''
     or coalesce(pg_catalog.btrim(p_candidate_id), '') = '' then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'message', 'Data pemilihan tidak lengkap.'
    );
  end if;

  -- Lock the active configuration row so an administrator cannot close
  -- the election midway through this vote transaction.
  select ec.status
    into election_status
  from public.election_config as ec
  order by ec.updated_at desc nulls last
  limit 1
  for share;

  if coalesce(election_status, 'upcoming') <> 'active' then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'message', 'Pemilihan belum aktif atau sudah ditutup.'
    );
  end if;

  select *
    into c
  from public.candidates as candidate
  where candidate.id = p_candidate_id
  limit 1;

  if not found then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'message', 'Pasangan calon tidak ditemukan.'
    );
  end if;

  -- This conditional update is the one-voter-one-vote guard. PostgreSQL
  -- serializes concurrent updates to the same voter row.
  update public.voters as voter
  set has_voted = true,
      voted_at = vote_time
  where pg_catalog.btrim(voter.nis) = pg_catalog.btrim(p_nis)
    and pg_catalog.upper(pg_catalog.btrim(voter.access_code))
        = pg_catalog.upper(pg_catalog.btrim(p_access_code))
    and voter.has_voted = false
  returning voter.* into v;

  if not found then
    select *
      into v
    from public.voters as voter
    where pg_catalog.btrim(voter.nis) = pg_catalog.btrim(p_nis)
    limit 1;

    if not found
       or pg_catalog.upper(pg_catalog.btrim(v.access_code))
          <> pg_catalog.upper(pg_catalog.btrim(p_access_code)) then
      return pg_catalog.jsonb_build_object(
        'success', false,
        'message', 'NIS atau kode akses tidak valid.'
      );
    end if;

    return pg_catalog.jsonb_build_object(
      'success', false,
      'message', 'Hak pilih untuk NIS ini sudah digunakan.'
    );
  end if;

  -- The anonymous ballot receives a UUID, matching anonymous_votes.id.
  -- Its timestamp is NULL so it cannot be correlated with voters.voted_at.
  insert into public.anonymous_votes (
    id,
    candidate_id,
    candidate_number,
    "timestamp"
  )
  values (
    vote_id,
    c.id,
    c.number,
    null
  );

  return pg_catalog.jsonb_build_object(
    'success', true,
    'message', 'Suara berhasil disimpan.',
    'timestamp', vote_time
  );
end;
$function$;

-- Keep the existing browser RPC flow working, but remove the implicit
-- PUBLIC grant. The exposed SECURITY DEFINER RPC still requires a separate
-- rate-limit and credential-hardening follow-up before a live election.
revoke all on function public.evoting_cast_vote(text, text, text) from public;
grant execute on function public.evoting_cast_vote(text, text, text)
  to anon, authenticated;

notify pgrst, 'reload schema';

commit;
