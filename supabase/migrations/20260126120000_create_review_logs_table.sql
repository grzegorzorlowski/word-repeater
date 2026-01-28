-- migration: create_review_logs_table
-- purpose: create table review_logs to store user review entries
-- affected tables: review_logs
-- special considerations:
--   - dependent on enum type public.rating
--   - enable row level security for access control

-- create table if not exists public.review_logs (
create table if not exists public.review_logs (
    id uuid not null primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    flashcard_id uuid not null references public.flashcards(id) on delete cascade,
    rating public.rating not null,
    reviewed_at timestamptz not null default now()
);

-- create indexes to improve query performance
create index if not exists idx_review_logs_user_id_reviewed_at on public.review_logs (user_id, reviewed_at);
create index if not exists idx_review_logs_flashcard_id on public.review_logs (flashcard_id);

-- enable row level security
alter table public.review_logs enable row level security;

-- row level security policies

-- policy: authenticated users can select their own review logs
create policy select_review_logs_authenticated
    on public.review_logs
    for select
    to authenticated
    using (auth.uid() = user_id);

-- policy: authenticated users can insert review logs for themselves
create policy insert_review_logs_authenticated
    on public.review_logs
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- policy: authenticated users can update their own review logs if needed
create policy update_review_logs_authenticated
    on public.review_logs
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- policy: authenticated users can delete their own review logs if needed
create policy delete_review_logs_authenticated
    on public.review_logs
    for delete
    to authenticated
    using (auth.uid() = user_id);
