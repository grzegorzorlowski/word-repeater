-- migration: handle_soft_delete_flashcard_schedule
-- purpose: automatically remove flashcard_schedule entries when flashcard is soft deleted
-- affected tables: flashcard_schedule
-- special considerations:
--   - soft delete (setting deleted_at) on flashcards should remove corresponding schedule entry
--   - hard delete already handled via ON DELETE CASCADE foreign key constraint
--   - per db-plan: flashcard_schedule doesn't need soft delete, just removal

-- create function to handle soft delete of flashcards
-- rationale: when a flashcard is soft deleted (deleted_at is set), remove its schedule entry
create or replace function public.handle_flashcard_soft_delete()
returns trigger as $$
begin
  -- check if deleted_at was just set (soft delete occurred)
  if old.deleted_at is null and new.deleted_at is not null then
    -- remove the corresponding schedule entry
    -- note: we use hard delete on schedule as per db-plan section 5
    delete from public.flashcard_schedule
    where flashcard_id = new.id;
  end if;
  
  return new;
end;
$$ language plpgsql;

-- create trigger to handle soft delete
create trigger trigger_handle_flashcard_soft_delete
  after update on public.flashcards
  for each row
  when (old.deleted_at is null and new.deleted_at is not null)
  execute function public.handle_flashcard_soft_delete();

-- add comment to function
comment on function public.handle_flashcard_soft_delete is 'automatically removes flashcard_schedule entry when flashcard is soft deleted (deleted_at set); per db-plan, schedule table does not use soft delete';
