-- Helpers para mantener sincronizados auth.users y public.users

begin;

-- Inserta/actualiza perfiles cuando se crea un usuario en Supabase Auth
create or replace function public.handle_new_auth_user()
returns trigger as $$
declare
  default_role text := coalesce(new.raw_user_meta_data->>'role', 'Mostrador');
  default_name text := coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
begin
  insert into public.users (id, email, name, role)
  values (new.id, new.email, default_name, default_role)
  on conflict (id) do update
  set email = excluded.email,
      name = coalesce(new.raw_user_meta_data->>'name', excluded.name),
      role = default_role,
      updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql security definer;

-- Elimina el perfil cuando se borra el usuario en Auth
create or replace function public.handle_delete_auth_user()
returns trigger as $$
begin
  delete from public.users where id = old.id;
  return old;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

drop trigger if exists on_auth_user_deleted on auth.users;
create trigger on_auth_user_deleted
after delete on auth.users
for each row execute function public.handle_delete_auth_user();

-- Job manual para sincronizar usuarios existentes
insert into public.users (id, email, name, role)
select
  au.id,
  au.email,
  coalesce(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)) as name,
  coalesce(au.raw_user_meta_data->>'role', 'Mostrador') as role
from auth.users au
on conflict (id) do nothing;

commit;

