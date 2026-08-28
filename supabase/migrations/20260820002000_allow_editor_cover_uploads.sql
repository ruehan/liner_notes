-- The album-covers bucket is public-read, but only registered editors may add
-- new files through the browser upload API.

drop policy if exists "editors can upload album covers" on storage.objects;

create policy "editors can upload album covers"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'album-covers'
    and (select public.is_editor())
  );
