-- EcoMart: endurecimiento de seguridad (se aplica sobre el esquema inicial)

-- 1. Fuera las políticas "permitir todo"
drop policy permitir_todo on public.profiles;
drop policy permitir_todo on public.products;
drop policy permitir_todo on public.orders;

-- 2. Privilegios mínimos (RLS decide filas; GRANT decide operaciones y columnas)
revoke all on public.profiles, public.products, public.orders from anon, authenticated;
grant select on public.products to anon, authenticated;            -- catálogo público (solo lectura)
grant select on public.profiles to authenticated;
grant update (nombre, direccion) on public.profiles to authenticated; -- nunca "rol"
grant select, insert on public.orders to authenticated;            -- sin editar ni borrar

-- 3. Políticas por dueño
create policy products_select on public.products for select to anon, authenticated using (activo);
create policy profiles_select_propio on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy profiles_update_propio on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy orders_select_propio on public.orders for select to authenticated
  using (user_id = (select auth.uid()));
create policy orders_insert_propio on public.orders for insert to authenticated
  with check (user_id = (select auth.uid()));

-- 4. El rol ya no lo decide el cliente: el trigger ignora los metadatos
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, nombre, email, rol)
  values (new.id, left(btrim(coalesce(new.raw_user_meta_data ->> 'nombre', '')), 80), new.email, 'cliente');
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 5. Restricciones de integridad
alter table public.profiles add constraint profiles_rol_valido check (rol in ('cliente', 'vendedor', 'admin'));
alter table public.orders add constraint orders_total_no_negativo check (total >= 0);
alter table public.orders alter column user_id set not null;
