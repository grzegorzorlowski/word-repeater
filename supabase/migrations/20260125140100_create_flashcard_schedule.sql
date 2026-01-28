-- migration: create_flashcard_schedule
-- purpose: create flashcard_schedule table for spaced repetition system (srs) data
-- affected tables: flashcard_schedule
-- special considerations:
--   - one-to-one relationship with flashcards table
--   - manages sm-2 algorithm parameters per flashcard
--   - new cards identified by repetition_count = 0
--   - implements row-level security for user data isolation
--   - no soft delete needed (managed by flashcards table cascade)

-- create flashcard_schedule table
create table public.flashcard_schedule (
  flashcard_id uuid primary key references public.flashcards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  next_due timestamptz not null,
  interval_days integer not null,
  repetition_count integer not null default 0,
  ease_factor double precision not null
);

-- add comments to table and columns
comment on table public.flashcard_schedule is 'spaced repetition schedule data for flashcards using sm-2 algorithm';
comment on column public.flashcard_schedule.flashcard_id is 'primary key and foreign key to flashcards table (one-to-one relationship)';
comment on column public.flashcard_schedule.user_id is 'references the user who owns this schedule entry';
comment on column public.flashcard_schedule.next_due is 'timestamp (utc) when flashcard is next due for review';
comment on column public.flashcard_schedule.interval_days is 'current interval in days between reviews';
comment on column public.flashcard_schedule.repetition_count is 'number of successful repetitions (0 = new card)';
comment on column public.flashcard_schedule.ease_factor is 'sm-2 algorithm ease factor (typically starts at 2.5)';

-- create composite index on (user_id, next_due) for efficient queries
-- rationale: optimizes fetching due and overdue flashcards per user
create index idx_flashcard_schedule_user_next_due on public.flashcard_schedule(user_id, next_due);

-- create index on user_id for user-specific queries
-- rationale: supports filtering all schedules for a specific user
create index idx_flashcard_schedule_user_id on public.flashcard_schedule(user_id);

-- create partial index for new cards (repetition_count = 0)
-- rationale: optimizes queries that fetch new (unlearned) flashcards
create index idx_flashcard_schedule_new_cards on public.flashcard_schedule(user_id) where repetition_count = 0;

-- enable row level security
alter table public.flashcard_schedule enable row level security;

-- rls policy: allow authenticated users to select their own flashcard schedules
-- rationale: users should only access their own schedule data (db-plan section 4)
create policy "authenticated users can select own flashcard schedules"
  on public.flashcard_schedule
  for select
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: allow authenticated users to insert their own flashcard schedules
-- rationale: users can create schedules, but user_id must match their auth.uid()
create policy "authenticated users can insert own flashcard schedules"
  on public.flashcard_schedule
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- rls policy: allow authenticated users to update their own flashcard schedules
-- rationale: users can only modify their own schedule data (db-plan section 4)
create policy "authenticated users can update own flashcard schedules"
  on public.flashcard_schedule
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- rls policy: allow authenticated users to delete their own flashcard schedules
-- rationale: users can only delete their own schedule entries (db-plan section 4)
create policy "authenticated users can delete own flashcard schedules"
  on public.flashcard_schedule
  for delete
  to authenticated
  using (auth.uid() = user_id);
