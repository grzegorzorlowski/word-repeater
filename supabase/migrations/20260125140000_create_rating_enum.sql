-- migration: create_rating_enum
-- purpose: create enum type for flashcard rating responses
-- affected tables: none (preparing for flashcard_schedule table)
-- special considerations:
--   - enum values represent sm-2 algorithm rating options
--   - values: again (forgot), hard (difficult), good (recalled with effort), easy (perfect recall)

-- create rating enum type
create type public.rating as enum ('again', 'hard', 'good', 'easy');

-- add comment to enum type
comment on type public.rating is 'flashcard rating responses for spaced repetition algorithm: again (forgot), hard (difficult), good (recalled with effort), easy (perfect recall)';
