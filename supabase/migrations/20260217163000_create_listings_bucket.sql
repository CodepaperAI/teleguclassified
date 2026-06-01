-- 1. Create the bucket
insert into storage.buckets (id, name, public)
values ('listings', 'listings', true)
on conflict (id) do nothing;

-- 2. Select policy (Public)
drop policy if exists "Listings Public Read" on storage.objects;
create policy "Listings Public Read"
on storage.objects for select
using ( bucket_id = 'listings' );

-- 3. Insert policy (Authenticated users can upload to their own user_id folder)
drop policy if exists "Listings Auth Upload" on storage.objects;
create policy "Listings Auth Upload"
on storage.objects for insert
to authenticated
with check (
    bucket_id = 'listings' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Update policy (Owner only)
drop policy if exists "Listings Owner Update" on storage.objects;
create policy "Listings Owner Update"
on storage.objects for update
to authenticated
using (
    bucket_id = 'listings' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Delete policy (Owner only)
drop policy if exists "Listings Owner Delete" on storage.objects;
create policy "Listings Owner Delete"
on storage.objects for delete
to authenticated
using (
    bucket_id = 'listings' AND
    auth.uid()::text = (storage.foldername(name))[1]
);
