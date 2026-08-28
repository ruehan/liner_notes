-- Authenticated editor-only album registration.
-- First create an Auth user in the Supabase dashboard, then insert that user's
-- UUID into public.editors (see supabase/README.md).

create table if not exists public.editors (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.editors enable row level security;
revoke all on table public.editors from anon, authenticated;

create or replace function public.is_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.editors
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_editor() from public;
grant execute on function public.is_editor() to authenticated;

create or replace function public.create_catalog_album(
  p_artist_name text,
  p_title text,
  p_label text,
  p_year smallint,
  p_description text,
  p_cover_path text,
  p_featured boolean,
  p_sort_order integer,
  p_tracks jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_artist_id uuid;
  v_album_id uuid;
  v_track jsonb;
  v_track_title text;
  v_duration_seconds integer;
  v_youtube_video_id text;
  v_youtube_start_seconds integer;
  v_youtube_end_seconds integer;
begin
  if not public.is_editor() then
    raise exception 'Editor permission is required.' using errcode = '42501';
  end if;

  if nullif(trim(p_artist_name), '') is null then
    raise exception 'Artist name is required.' using errcode = '22023';
  end if;
  if nullif(trim(p_title), '') is null then
    raise exception 'Album title is required.' using errcode = '22023';
  end if;
  if p_year is null or p_year not between 1900 and 2100 then
    raise exception 'Album year must be between 1900 and 2100.' using errcode = '22023';
  end if;
  if p_tracks is null or jsonb_typeof(p_tracks) <> 'array' then
    raise exception 'Tracks must be an array.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_tracks) = 0 then
    raise exception 'At least one track is required.' using errcode = '22023';
  end if;

  insert into public.artists (name)
  values (trim(p_artist_name))
  on conflict (name) do update set name = excluded.name
  returning id into v_artist_id;

  insert into public.albums (
    artist_id,
    title,
    label,
    year,
    description,
    cover_path,
    featured,
    sort_order
  )
  values (
    v_artist_id,
    trim(p_title),
    coalesce(trim(p_label), ''),
    p_year,
    coalesce(p_description, ''),
    nullif(trim(p_cover_path), ''),
    coalesce(p_featured, true),
    coalesce(p_sort_order, 0)
  )
  returning id into v_album_id;

  for v_track in select value from jsonb_array_elements(p_tracks)
  loop
    if jsonb_typeof(v_track) <> 'object' then
      raise exception 'Each track must be an object.' using errcode = '22023';
    end if;

    v_track_title := nullif(trim(v_track ->> 'title'), '');
    v_duration_seconds := (v_track ->> 'duration_seconds')::integer;
    v_youtube_video_id := nullif(trim(v_track ->> 'youtube_video_id'), '');
    v_youtube_start_seconds := nullif(v_track ->> 'youtube_start_seconds', '')::integer;
    v_youtube_end_seconds := nullif(v_track ->> 'youtube_end_seconds', '')::integer;

    if v_track_title is null then
      raise exception 'Track title is required.' using errcode = '22023';
    end if;
    if v_duration_seconds is null or v_duration_seconds <= 0 then
      raise exception 'Track duration must be greater than zero.' using errcode = '22023';
    end if;
    if v_youtube_start_seconds is not null and v_youtube_start_seconds < 0 then
      raise exception 'YouTube start seconds must be zero or greater.' using errcode = '22023';
    end if;
    if v_youtube_end_seconds is not null and (
      v_youtube_start_seconds is null or v_youtube_end_seconds <= v_youtube_start_seconds
    ) then
      raise exception 'YouTube end seconds must be greater than start seconds.' using errcode = '22023';
    end if;

    insert into public.tracks (
      album_id,
      title,
      duration_seconds,
      description,
      youtube_video_id,
      youtube_start_seconds,
      youtube_end_seconds
    )
    values (
      v_album_id,
      v_track_title,
      v_duration_seconds,
      coalesce(v_track ->> 'description', ''),
      v_youtube_video_id,
      v_youtube_start_seconds,
      v_youtube_end_seconds
    );
  end loop;

  return v_album_id;
end;
$$;

revoke all on function public.create_catalog_album(
  text, text, text, smallint, text, text, boolean, integer, jsonb
) from public;
grant execute on function public.create_catalog_album(
  text, text, text, smallint, text, text, boolean, integer, jsonb
) to authenticated;
