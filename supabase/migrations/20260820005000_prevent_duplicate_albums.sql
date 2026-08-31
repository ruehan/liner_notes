-- Prevent duplicate catalogue records with the same artist, title, and release year.

do $$
begin
  if exists (
    select 1
    from public.albums
    group by artist_id, lower(btrim(title)), year
    having count(*) > 1
  ) then
    raise exception
      'Resolve duplicate albums with the same artist, title, and year before applying this migration.';
  end if;
end;
$$;

create unique index if not exists albums_artist_title_year_unique_idx
  on public.albums (artist_id, lower(btrim(title)), year);
