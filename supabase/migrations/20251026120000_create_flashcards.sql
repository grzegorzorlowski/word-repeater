-- migration: create_flashcards
-- purpose: create the flashcards table with user relationship and metadata support
-- affected tables: flashcards
-- special considerations: 
--   - includes soft delete functionality via deleted_at column
--   - uses jsonb for flexible metadata storage (tags, categories, multimedia)
--   - implements row-level security for user data isolation
--   - prepared for future full-text search capabilities

-- enable pgcrypto extension for gen_random_uuid() if not already enabled
-- note: pgcrypto is enabled by default in supabase projects
create extension if not exists "pgcrypto";

-- create flashcards table
create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- add comment to table
comment on table public.flashcards is 'stores user flashcards with content and flexible metadata';
comment on column public.flashcards.id is 'unique identifier for the flashcard';
comment on column public.flashcards.user_id is 'references the user who owns this flashcard';
comment on column public.flashcards.content is 'main flashcard content (question/answer)';
comment on column public.flashcards.metadata is 'flexible jsonb storage for tags, categories, multimedia references';
comment on column public.flashcards.created_at is 'timestamp when flashcard was created (utc)';
comment on column public.flashcards.updated_at is 'timestamp when flashcard was last updated (utc)';
comment on column public.flashcards.deleted_at is 'timestamp for soft delete (null means active)';

-- create index on user_id for improved join performance and user-specific queries
create index idx_flashcards_user_id on public.flashcards(user_id);

-- create composite index on user_id and created_at to support timeline queries
create index idx_flashcards_user_created on public.flashcards(user_id, created_at);

-- create partial index for active flashcards (where deleted_at is null)
-- this optimizes queries that filter out soft-deleted records
create index idx_flashcards_active on public.flashcards(user_id) where deleted_at is null;

-- prepare for future gin index on metadata for jsonb searches
-- uncomment when full-text search or complex metadata queries are needed:
-- create index idx_flashcards_metadata on public.flashcards using gin(metadata);

-- enable row level security
alter table public.flashcards enable row level security;

-- rls policy: allow authenticated users to select their own flashcards
-- rationale: users should only be able to view flashcards they own
create policy "authenticated users can select own flashcards"
  on public.flashcards
  for select
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: allow authenticated users to insert their own flashcards
-- rationale: users can create new flashcards, but user_id must match their auth.uid()
create policy "authenticated users can insert own flashcards"
  on public.flashcards
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- rls policy: allow authenticated users to update their own flashcards
-- rationale: users can modify their own flashcards only
create policy "authenticated users can update own flashcards"
  on public.flashcards
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- rls policy: allow authenticated users to delete their own flashcards
-- rationale: users can delete (hard or soft) their own flashcards only
create policy "authenticated users can delete own flashcards"
  on public.flashcards
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- create function to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- create trigger to automatically update updated_at on row updates
create trigger set_updated_at
  before update on public.flashcards
  for each row
  execute function public.handle_updated_at();

comment on function public.handle_updated_at is 'automatically updates the updated_at timestamp on row modification';

