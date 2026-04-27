-- Persist the user's preferred title type (clean | rebuilt) on the profile so
-- it survives page reloads. Nullable, no default — null means "no preference"
-- and the /browse Match Mode bar treats it as "show both".
alter table public.profiles
  add column title_preference text;

alter table public.profiles
  add constraint profiles_title_preference_check
    check (title_preference is null or title_preference in ('clean', 'rebuilt'));
