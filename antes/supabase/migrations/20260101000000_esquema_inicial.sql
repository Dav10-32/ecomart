-- EcoMart (versión inicial, "para que funcione")
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text, email text, direccion text,
  rol text not null default 'cliente'
);
create table public.products (
  id uuid primary key default gen_random_uuid(),
  nombre text, descripcion text, categoria text, precio numeric,
  activo boolean not null default true, created_at timestamptz not null default now()
);
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id),
  total numeric, direccion_envio text, created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders   enable row level security;

create policy permitir_todo on public.profiles for all using (true) with check (true);
create policy permitir_todo on public.products for all using (true) with check (true);
create policy permitir_todo on public.orders   for all using (true) with check (true);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, nombre, email, rol)
  values (new.id, new.raw_user_meta_data ->> 'nombre', new.email,
          coalesce(new.raw_user_meta_data ->> 'rol', 'cliente'));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Privilegios por defecto de Supabase sobre tablas del esquema public
grant all on all tables in schema public to anon, authenticated;
