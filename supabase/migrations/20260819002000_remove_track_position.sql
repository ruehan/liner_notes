-- Follow-up for projects that already applied 20260819000000_music_archive.sql.
-- Track order is the insertion order (created_at), so editors do not need to
-- maintain a separate position value.

alter table public.tracks
  drop column if exists position;

create index if not exists tracks_album_created_at_idx
  on public.tracks (album_id, created_at);
