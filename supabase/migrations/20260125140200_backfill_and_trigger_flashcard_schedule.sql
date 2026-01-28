-- migration: backfill_and_trigger_flashcard_schedule
-- purpose: backfill existing flashcards with initial schedule entries and create trigger for auto-initialization
-- affected tables: flashcard_schedule
-- special considerations:
--   - backfills existing flashcards that don't have schedule entries
--   - creates trigger to auto-initialize schedule when new flashcard is created
--   - uses default initial values: ease_factor=2.5, interval_days=0, repetition_count=0, next_due=now()
--   - ensures one-to-one relationship between flashcards and flashcard_schedule is maintained

-- backfill: create initial schedule entries for existing flashcards that don't have one
-- note: this handles migration from existing data where flashcards exist without schedules
insert into public.flashcard_schedule (
  flashcard_id,
  user_id,
  next_due,
  interval_days,
  repetition_count,
  ease_factor
)
select 
  f.id as flashcard_id,
  f.user_id,
  now() as next_due,                    -- new cards are immediately available
  0 as interval_days,                   -- no interval yet (new card)
  0 as repetition_count,                -- 0 indicates new/unlearned card
  2.5 as ease_factor                    -- default ease factor for sm-2 algorithm
from public.flashcards f
left join public.flashcard_schedule fs on f.id = fs.flashcard_id
where 
  fs.flashcard_id is null               -- only insert if schedule doesn't exist
  and f.deleted_at is null;             -- only for active flashcards

-- add comment about backfill
comment on table public.flashcard_schedule is 'spaced repetition schedule data for flashcards using sm-2 algorithm; auto-initialized via trigger when flashcard is created';

-- create function to automatically initialize schedule when flashcard is created
create or replace function public.initialize_flashcard_schedule()
returns trigger as $$
begin
  -- create initial schedule entry for the new flashcard
  insert into public.flashcard_schedule (
    flashcard_id,
    user_id,
    next_due,
    interval_days,
    repetition_count,
    ease_factor
  ) values (
    new.id,                             -- flashcard id from the inserted row
    new.user_id,                        -- same user as flashcard owner
    now(),                              -- immediately available for review
    0,                                  -- no interval (new card)
    0,                                  -- zero repetitions (new/unlearned)
    2.5                                 -- default sm-2 ease factor
  );
  
  return new;
end;
$$ language plpgsql;

-- create trigger to auto-initialize schedule after flashcard insert
create trigger trigger_initialize_flashcard_schedule
  after insert on public.flashcards
  for each row
  execute function public.initialize_flashcard_schedule();

-- add comment to function
comment on function public.initialize_flashcard_schedule is 'automatically creates initial schedule entry when a new flashcard is inserted (ease_factor=2.5, repetition_count=0, next_due=now)';
