-- Team 15: compare-and-set primitive.
--
-- Callers that need "flip this row only if it still looks like I read it"
-- can't use a read-then-putRecord pair without a TOCTOU race. Example:
-- Team 15's acknowledgeDealRequestAction reads a DealRequest, checks that
-- status == "submitted", then writes status == "acknowledged". Two admins
-- hitting the same request simultaneously can both pass the guard and
-- both write.
--
-- This RPC wraps the compare-and-set into a single UPDATE. Returns the
-- number of rows updated (0 = expected value did not match, 1 = success).
-- The JSONB equality check uses the `=` operator, which compares the
-- canonical representation — callers must pass the *exact* shape they
-- read (including optional fields), not a subset.

create or replace function public.secure_records_compare_and_set(
  p_bucket text,
  p_id text,
  p_expected jsonb,
  p_next jsonb
) returns integer
language plpgsql
as $$
declare
  v_count integer;
begin
  update public.secure_records
  set value = p_next,
      updated_at = now()
  where bucket = p_bucket
    and id = p_id
    and value = p_expected;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.secure_records_compare_and_set(text, text, jsonb, jsonb)
  from public;
revoke all on function public.secure_records_compare_and_set(text, text, jsonb, jsonb)
  from anon;
revoke all on function public.secure_records_compare_and_set(text, text, jsonb, jsonb)
  from authenticated;
