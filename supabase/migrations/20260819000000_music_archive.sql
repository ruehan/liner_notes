-- Public, read-only catalogue for the Liner Notes home wall.
-- Apply in the Supabase SQL editor or with `supabase db push`.

create table public.artists (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.albums (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists (id) on delete restrict,
  title text not null,
  label text not null default '',
  year smallint not null check (year between 1900 and 2100),
  description text not null default '',
  cover_path text,
  featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index albums_featured_sort_order_idx
  on public.albums (featured, sort_order);

create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums (id) on delete cascade,
  title text not null,
  duration_seconds integer not null check (duration_seconds > 0),
  description text not null default '',
  youtube_video_id text,
  youtube_start_seconds integer check (youtube_start_seconds >= 0),
  youtube_end_seconds integer check (
    youtube_end_seconds is null
    or (youtube_start_seconds is not null and youtube_end_seconds > youtube_start_seconds)
  ),
  created_at timestamptz not null default now()
);

create index tracks_album_created_at_idx on public.tracks (album_id, created_at);

alter table public.artists enable row level security;
alter table public.albums enable row level security;
alter table public.tracks enable row level security;

grant select on public.artists, public.albums, public.tracks to anon, authenticated;

create policy "public can read artists with featured albums"
  on public.artists for select to anon, authenticated
  using (
    exists (
      select 1
      from public.albums
      where albums.artist_id = artists.id and albums.featured
    )
  );

create policy "public can read featured albums"
  on public.albums for select to anon, authenticated
  using (featured);

create policy "public can read tracks from featured albums"
  on public.tracks for select to anon, authenticated
  using (
    exists (
      select 1
      from public.albums
      where albums.id = tracks.album_id and albums.featured
    )
  );

-- Covers are optional. Upload them into this public bucket using the dashboard
-- (or trusted server tooling); the browser only receives a read-only key.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'album-covers',
  'album-covers',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "public can read album covers"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'album-covers');
