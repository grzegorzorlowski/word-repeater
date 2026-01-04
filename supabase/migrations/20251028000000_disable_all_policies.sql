-- migration: disable_all_policies
-- purpose: disable row level security and drop all policies from flashcards and audit_logs tables
-- affected tables: flashcards, audit_logs
-- special considerations:
--   - this will allow unrestricted access to both tables
--   - ensure this is intentional for your use case

-- drop all policies from flashcards table
drop policy if exists "authenticated users can select own flashcards" on public.flashcards;
drop policy if exists "authenticated users can insert own flashcards" on public.flashcards;
drop policy if exists "authenticated users can update own flashcards" on public.flashcards;
drop policy if exists "authenticated users can delete own flashcards" on public.flashcards;

-- disable row level security on flashcards
alter table public.flashcards disable row level security;

-- drop all policies from audit_logs table
drop policy if exists "authenticated users can select own audit logs" on public.audit_logs;
drop policy if exists "service role can insert audit logs" on public.audit_logs;

-- disable row level security on audit_logs
alter table public.audit_logs disable row level security;

