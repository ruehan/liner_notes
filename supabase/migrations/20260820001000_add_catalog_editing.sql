-- Editor-only retrieval and update operations for the in-app registration desk.

create or replace function public.replace_catalog_tracks(
  p_album_id uuid,
  p_tracks jsonb
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
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
  if p_tracks is null or jsonb_typeof(p_tracks) <> 'array' then
    raise exception 'Tracks must be an array.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_tracks) = 0 then
    raise exception 'At least one track is required.' using errcode = '22023';
  end if;

  delete from public.tracks where album_id = p_album_id;

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
      p_album_id,
      v_track_title,
      v_duration_seconds,
      coalesce(v_track ->> 'description', ''),
      v_youtube_video_id,
      v_youtube_start_seconds,
      v_youtube_end_seconds
    );
  end loop;
end;
$$;

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

  insert into public.artists (name)
  values (trim(p_artist_name))
  on conflict (name) do update set name = excluded.name
  returning id into v_artist_id;

  insert into public.albums (
    artist_id, title, label, year, description, cover_path, featured, sort_order
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

  perform public.replace_catalog_tracks(v_album_id, p_tracks);
  return v_album_id;
end;
$$;

create or replace function public.update_catalog_album(
  p_album_id uuid,
  p_artist_name text,
  p_title text,
  p_label text,
  p_year smallint,
  p_description text,
  p_cover_path text,
  p_featured boolean,
  p_sort_order integer,
  p_tracks jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_artist_id uuid;
  v_updated_id uuid;
begin
  if not public.is_editor() then
    raise exception 'Editor permission is required.' using errcode = '42501';
  end if;
  if p_album_id is null then
    raise exception 'Album ID is required.' using errcode = '22023';
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

  insert into public.artists (name)
  values (trim(p_artist_name))
  on conflict (name) do update set name = excluded.name
  returning id into v_artist_id;

  update public.albums
  set
    artist_id = v_artist_id,
    title = trim(p_title),
    label = coalesce(trim(p_label), ''),
    year = p_year,
    description = coalesce(p_description, ''),
    cover_path = nullif(trim(p_cover_path), ''),
    featured = coalesce(p_featured, true),
    sort_order = coalesce(p_sort_order, 0)
  where id = p_album_id
  returning id into v_updated_id;

  if v_updated_id is null then
    raise exception 'Album was not found.' using errcode = 'P0002';
  end if;

  perform public.replace_catalog_tracks(v_updated_id, p_tracks);
  return v_updated_id;
end;
$$;

create or replace function public.list_catalog_albums()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_albums jsonb;
begin
  if not public.is_editor() then
    raise exception 'Editor permission is required.' using errcode = '42501';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', album.id,
        'artistName', artist.name,
        'title', album.title,
        'label', album.label,
        'year', album.year,
        'description', album.description,
        'coverPath', album.cover_path,
        'featured', album.featured,
        'sortOrder', album.sort_order,
        'tracks', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'id', track.id,
              'title', track.title,
              'durationSeconds', track.duration_seconds,
              'description', track.description,
              'youtubeVideoId', track.youtube_video_id,
              'youtubeStartSeconds', track.youtube_start_seconds,
              'youtubeEndSeconds', track.youtube_end_seconds
            ) order by track.created_at asc
          )
          from public.tracks as track
          where track.album_id = album.id
        ), '[]'::jsonb)
      ) order by album.featured desc, album.sort_order asc, album.created_at desc
    ),
    '[]'::jsonb
  )
  into v_albums
  from public.albums as album
  join public.artists as artist on artist.id = album.artist_id;

  return v_albums;
end;
$$;

revoke all on function public.replace_catalog_tracks(uuid, jsonb) from public;
revoke all on function public.create_catalog_album(
  text, text, text, smallint, text, text, boolean, integer, jsonb
) from public;
revoke all on function public.update_catalog_album(
  uuid, text, text, text, smallint, text, text, boolean, integer, jsonb
) from public;
revoke all on function public.list_catalog_albums() from public;

grant execute on function public.create_catalog_album(
  text, text, text, smallint, text, text, boolean, integer, jsonb
) to authenticated;
grant execute on function public.update_catalog_album(
  uuid, text, text, text, smallint, text, text, boolean, integer, jsonb
) to authenticated;
grant execute on function public.list_catalog_albums() to authenticated;
