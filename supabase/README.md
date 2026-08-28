# Supabase catalogue setup

1. In the Supabase dashboard, open **SQL Editor** and run the migrations in
   filename order. Existing projects only need to run migrations they have not
   already applied, including
   [`20260820000000_add_catalog_editors.sql`](./migrations/20260820000000_add_catalog_editors.sql)
   for the in-app registration desk and
   [`20260820001000_add_catalog_editing.sql`](./migrations/20260820001000_add_catalog_editing.sql)
   to edit existing records, and
   [`20260820002000_allow_editor_cover_uploads.sql`](./migrations/20260820002000_allow_editor_cover_uploads.sql)
   to upload cover images from the registration desk, and
   [`20260820003000_add_catalog_artist_management.sql`](./migrations/20260820003000_add_catalog_artist_management.sql)
   to add and select artists from the registration desk, and
   [`20260820004000_add_catalog_artist_editing.sql`](./migrations/20260820004000_add_catalog_artist_editing.sql)
   to edit artist names and safely remove unused artists.
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

Set `tracks.youtube_video_id` to a YouTube video ID or a standard YouTube URL
(`watch`, `youtu.be`, `shorts`, `embed`, or `live`) to enable playback in the
album detail sheet. URLs are converted to video IDs before reaching the player.
`youtube_start_seconds` and
`youtube_end_seconds` are optional clip boundaries in seconds. The
`react-youtube` player only loads after a visitor chooses an album or track to
play, and explains unavailable or embed-blocked videos in the UI. Do not add a
service-role key to `.env.local`.

## Editor registration desk

The **add** button in the top-right corner opens the album registration desk.
It is intentionally limited to editor accounts: create an email/password user
in **Authentication → Users**, then run this once in SQL Editor with that
user's UUID:

```sql
insert into public.editors (user_id)
values ('AUTH_USER_UUID')
on conflict (user_id) do nothing;
```

Sign in with that account in the app to register an artist first, then select
one of the registered artists while creating an album and its tracks. The artist
manager also shows each artist's album count, supports renaming, and only allows
deleting artists with no connected albums. The same screen lists every stored
album for an editor; select one to update its metadata and tracklist. Updating
replaces the album's track rows atomically, so do not add other tables that
reference `tracks.id` without changing the update function.
Editors can also drag in or select a JPG, PNG, or WebP cover image up to 5MB;
the image is uploaded to `album-covers` with a new filename and its Storage
path is connected to the form automatically. Existing cover files are never
overwritten or deleted automatically.
The editor policy does not grant anonymous write access; do not add an
unauthenticated insert policy to these tables.
