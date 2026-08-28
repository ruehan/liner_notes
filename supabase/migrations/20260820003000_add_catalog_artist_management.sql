-- Editor-only artist management for the in-app registration desk.

create or replace function public.create_catalog_artist(p_name text)
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
  if v_name is null then
    raise exception 'Artist name is required.' using errcode = '22023';
  end if;

  insert into public.artists (name)
  values (v_name)
  on conflict (name) do update set name = excluded.name
  returning id into v_artist_id;

  return v_artist_id;
end;
$$;

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
      jsonb_build_object('id', artist.id, 'name', artist.name)
      order by lower(artist.name), artist.created_at asc
    ),
    '[]'::jsonb
  )
  from public.artists as artist
  into v_artists;

  return v_artists;
end;
$$;

revoke all on function public.create_catalog_artist(text) from public;
revoke all on function public.list_catalog_artists() from public;
grant execute on function public.create_catalog_artist(text) to authenticated;
grant execute on function public.list_catalog_artists() to authenticated;
