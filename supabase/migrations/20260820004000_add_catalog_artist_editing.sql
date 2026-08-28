-- Editor-only artist editing for the in-app registration desk.

create or replace function public.list_catalog_artists()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_artists jsonb;
begin
  if not public.is_editor() then
    raise exception 'Editor permission is required.' using errcode = '42501';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', artist.id,
        'name', artist.name,
        'albumCount', artist.album_count
      ) order by lower(artist.name), artist.created_at asc
    ),
    '[]'::jsonb
  )
  from (
    select
      artists.id,
      artists.name,
      artists.created_at,
      count(albums.id)::integer as album_count
    from public.artists
    left join public.albums on albums.artist_id = artists.id
    group by artists.id, artists.name, artists.created_at
  ) as artist
  into v_artists;

  return v_artists;
end;
$$;

create or replace function public.update_catalog_artist(
  p_artist_id uuid,
  p_name text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_artist_id uuid;
  v_name text;
begin
  if not public.is_editor() then
    raise exception 'Editor permission is required.' using errcode = '42501';
  end if;

  v_name := nullif(trim(p_name), '');
  if p_artist_id is null then
    raise exception 'Artist ID is required.' using errcode = '22023';
  end if;
  if v_name is null then
    raise exception 'Artist name is required.' using errcode = '22023';
  end if;
  if exists (
    select 1
    from public.artists
    where id <> p_artist_id and name = v_name
  ) then
    raise exception 'Artist name already exists.' using errcode = '23505';
  end if;

  update public.artists
  set name = v_name
  where id = p_artist_id
  returning id into v_artist_id;

  if v_artist_id is null then
    raise exception 'Artist was not found.' using errcode = 'P0002';
  end if;

  return v_artist_id;
end;
$$;

create or replace function public.delete_catalog_artist(p_artist_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_artist_id uuid;
begin
  if not public.is_editor() then
    raise exception 'Editor permission is required.' using errcode = '42501';
  end if;
  if p_artist_id is null then
    raise exception 'Artist ID is required.' using errcode = '22023';
  end if;
  if exists (select 1 from public.albums where artist_id = p_artist_id) then
    raise exception 'Artists with albums cannot be deleted.' using errcode = '23503';
  end if;

  delete from public.artists
  where id = p_artist_id
  returning id into v_artist_id;

  if v_artist_id is null then
    raise exception 'Artist was not found.' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.list_catalog_artists() from public;
revoke all on function public.update_catalog_artist(uuid, text) from public;
revoke all on function public.delete_catalog_artist(uuid) from public;
grant execute on function public.list_catalog_artists() to authenticated;
grant execute on function public.update_catalog_artist(uuid, text) to authenticated;
grant execute on function public.delete_catalog_artist(uuid) to authenticated;
