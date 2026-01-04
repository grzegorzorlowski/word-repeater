-- migration: add_source_and_status_columns
-- purpose: add source and status columns to flashcards table to support AI-generated flashcards workflow
-- affected tables: flashcards
-- special considerations:
--   - source column tracks origin: 'manual' or 'ai_generated'
--   - status column tracks lifecycle: 'pending', 'active', 'archived'
--   - defaults ensure backward compatibility with existing data

-- add source column (where the flashcard came from)
alter table public.flashcards
  add column source text not null default 'manual'
  check (source in ('manual', 'ai_generated'));

-- add status column (lifecycle state of the flashcard)
alter table public.flashcards
  add column status text not null default 'active'
  check (status in ('pending', 'active', 'archived'));

-- add comments
comment on column public.flashcards.source is 'origin of flashcard: manual (user-created) or ai_generated';
comment on column public.flashcards.status is 'lifecycle status: pending (awaiting review), active (in use), archived (inactive)';

-- create index on status for filtering queries
create index idx_flashcards_status on public.flashcards(user_id, status) where deleted_at is null;

-- create composite index for AI-generated pending flashcards (common query pattern)
create index idx_flashcards_ai_pending on public.flashcards(user_id, source, status) 
  where source = 'ai_generated' and status = 'pending' and deleted_at is null;

-- update existing flashcards to have 'manual' source and 'active' status (already defaults)
-- note: this is implicit due to default values, but documenting intent


