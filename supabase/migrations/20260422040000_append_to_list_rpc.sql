-- Team 15: atomic list-append primitive.
--
-- The notifications_by_user, threads_by_user and thread_reads buckets are
-- all "array tacked onto an id" — ie. secure_records.value is a JSON array
-- and callers want to push a new element. The existing read-modify-write
-- pattern (getRecord → array.push → putRecord) races under concurrent
-- writes and silently drops ids. This RPC lets appendToList() in
-- src/services/team-15-storage.ts perform the append in a single SQL
-- statement so concurrent calls can't clobber each other. Row-level locking
-- on the (bucket, id) primary key in the ON CONFLICT UPDATE path is what
-- makes it safe — Postgres serializes concurrent inserts to the same
-- conflict target.
--
-- Publicly callable by service-role only. The wrapping RLS on
-- secure_records already denies non-service-role access to the underlying
-- table, so the function is additionally `security invoker` by default
-- (we do NOT mark it definer) — a non-service-role caller would hit the
-- table policies and be refused.

create or replace function public.secure_records_append_to_list(
  p_bucket text,
  p_id text,
  p_value jsonb
) returns void
language plpgsql
as $$
begin
  insert into public.secure_records (bucket, id, value)
  values (p_bucket, p_id, jsonb_build_array(p_value))
  on conflict (bucket, id) do update
  set value = case
    when jsonb_typeof(public.secure_records.value) = 'array'
      then public.secure_records.value || jsonb_build_array(p_value)
    else jsonb_build_array(p_value)
  end,
  updated_at = now();
end;
$$;

revoke all on function public.secure_records_append_to_list(text, text, jsonb)
  from public;
revoke all on function public.secure_records_append_to_list(text, text, jsonb)
  from anon;
revoke all on function public.secure_records_append_to_list(text, text, jsonb)
  from authenticated;
