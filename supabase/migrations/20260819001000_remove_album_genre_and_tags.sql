-- Follow-up for projects that already applied 20260819000000_music_archive.sql.
-- These fields are presentation-only in the app and no longer need editorial input.

alter table public.albums
  drop column if exists genre,
  drop column if exists tags;
