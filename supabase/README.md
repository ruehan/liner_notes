# Supabase catalogue setup

1. In the Supabase dashboard, open **SQL Editor** and run the migrations in
   filename order. Projects that have already run the first migration only
   need to run
   [`20260819001000_remove_album_genre_and_tags.sql`](./migrations/20260819001000_remove_album_genre_and_tags.sql).
2. Add artists, albums, and tracks. Albums require `artist_id`, `title`,
   `label`, `year`, and `description`; `genre` and `tags` are not database
   fields. The wall assigns its visual filter colour automatically. Mark
   exactly twelve albums with
   `featured = true` and give them an ascending `sort_order`.
3. In `albums.cover_path`, use either a complete image URL or an object path
   from the optional `album-covers` bucket (for example
   `covers/blue-hour.webp`).
   For each track, enter only `album_id`, `title`, and `duration_seconds`.
   Tracks are displayed in creation order, so no separate `position` value is
   needed. `description` and the YouTube fields remain optional.
4. Put the project URL and browser-safe publishable key in `.env.local`, based
   on `.env.example`, then restart the Vite dev server. Existing
   `NEXT_PUBLIC_SUPABASE_*` variables are also accepted; unprefixed
   `SUPABASE_*` values, including service-role and database credentials, stay
   private and are never read by the browser.

The home wall shows up to twelve featured database albums only. Generated
albums and old tile favourites are never shown. An album can be saved before
its tracks are entered; its detail view will show an empty tracklist until
those rows are added. If credentials, database tables, or permissions are
unavailable, the wall has no album cards rather than showing placeholder data.

`tracks.youtube_video_id`, `youtube_start_seconds`, and
`youtube_end_seconds` are reserved for the forthcoming YouTube player. Store a
YouTube video ID, not a full URL. Do not add a service-role key to `.env.local`.
