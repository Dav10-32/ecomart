import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
const base = readFileSync('../antes/supabase/migrations/20260101000000_esquema_inicial.sql', 'utf8')
const hard = readFileSync(process.env.HARD ?? '../despues/supabase/migrations/20260112000000_endurecer_rls.sql', 'utf8')

async function build(withHardening) {
  const db = new PGlite()
  await db.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth;
    create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth, public to anon, authenticated;`)
  await db.exec(base)
  const id = {}
  for (const [k, email, nombre] of [['ana', 'ana@mail.co', 'Ana'], ['beto', 'beto@mail.co', 'Beto']]) {
    id[k] = (await db.query(`insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id`, [email, JSON.stringify({ nombre })])).rows[0].id
  }
  await db.query(`update public.profiles set direccion = 'Calle 1 #2-3' where id = $1`, [id.beto])
  await db.query(`insert into public.orders (user_id, total, direccion_envio) values ($1, 100, 'Calle 1 #2-3'), ($2, 50, 'Carrera 9')`, [id.beto, id.ana])
  await db.query(`insert into public.products (nombre, descripcion, categoria, precio) values ('Taza', 'Bambú', 'Hogar', 20), ('Oculto', 'Borrador', 'Hogar', 5)`)
  await db.query(`update public.products set activo = false where nombre = 'Oculto'`)
  if (withHardening) await db.exec(hard)
  return { db, id }
}

async function as({ db }, uid, sql, p = []) {
  await db.exec(`set role ${uid ? 'authenticated' : 'anon'}`)
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [uid ?? ''])
  try { return { rows: (await db.query(sql, p)).rows } } catch (e) { return { error: e.message } } finally { await db.exec('reset role') }
}
const ok = (r) => !r.error && r.rows.length > 0 // el ataque "funcionó" si devuelve/afecta filas

async function run(env) {
  const { db, id } = env
  const A = []
  let r
  r = await as(env, null, `select email, direccion from public.profiles`); A.push(['A1 Anónimo lee emails y direcciones de todos los perfiles', ok(r)])
  r = await as(env, id.ana, `select total, direccion_envio from public.orders where user_id = $1`, [id.beto]); A.push(['A2 Ana lee el pedido (y dirección) de Beto', ok(r)])
  r = await as(env, id.ana, `select email from public.profiles where id = $1`, [id.beto]); A.push(['A3 Ana lee el perfil de Beto', ok(r)])
  r = await as(env, id.ana, `update public.profiles set rol = 'admin' where id = $1 returning id`, [id.ana]); A.push(['A4 Ana se asigna el rol admin', ok(r)])
  r = await as(env, id.ana, `insert into public.orders (user_id, total, direccion_envio) values ($1, 1, 'x') returning id`, [id.beto]); A.push(['A5 Ana crea un pedido a nombre de Beto', ok(r)])
  r = await as(env, id.ana, `delete from public.orders where user_id = $1 returning id`, [id.beto]); A.push(['A6 Ana borra el pedido de Beto', ok(r)])
  r = await as(env, null, `update public.products set precio = 0 returning id`); A.push(['A7 Anónimo cambia a $0 el precio de los productos', ok(r)])
  const evil = (await db.query(`insert into auth.users (email, raw_user_meta_data) values ('evil@mail.co', '{"nombre":"Eve","rol":"admin"}') returning id`)).rows[0].id
  A.push(['A8 Registro con metadata rol=admin obtiene perfil admin', (await db.query(`select rol from public.profiles where id = $1`, [evil])).rows[0].rol === 'admin'])

  const L = []
  const cat = await as(env, null, `select nombre from public.products`); L.push(['L1 Anónimo ve el catálogo activo', !cat.error && cat.rows.length >= 1 && !cat.rows.some((x) => x.nombre === 'Oculto' && env.hardened)])
  r = await as(env, id.ana, `select total from public.orders`); L.push(['L2 Ana ve su pedido', !r.error && r.rows.some((x) => Number(x.total) === 50)])
  r = await as(env, id.ana, `insert into public.orders (user_id, total, direccion_envio) values ($1, 30, 'Mi casa') returning id`, [id.ana]); L.push(['L3 Ana crea su propio pedido', ok(r)])
  r = await as(env, id.ana, `update public.profiles set direccion = 'Nueva 123' where id = $1 returning id`, [id.ana]); L.push(['L4 Ana edita su dirección', ok(r)])
  L.push(['L5 Registro normal crea perfil con rol cliente', (await db.query(`select rol from public.profiles where id = $1`, [(await db.query(`insert into auth.users (email, raw_user_meta_data) values ('nuevo@mail.co','{"nombre":"Nuevo"}') returning id`)).rows[0].id])).rows[0].rol === 'cliente'])
  return { A, L }
}

const before = await run({ ...(await build(false)), hardened: false })
const after = await run({ ...(await build(true)), hardened: true })
const pad = (s, n) => s.padEnd(n)
console.log(pad('ATAQUE', 62), 'ANTES        DESPUÉS')
before.A.forEach(([n, b], i) => console.log(pad(n, 62), b ? 'EXITOSO ❌   ' : 'bloqueado ✅ ', after.A[i][1] ? 'EXITOSO ❌' : 'bloqueado ✅'))
console.log('\n' + pad('FLUJO LEGÍTIMO', 62), 'ANTES        DESPUÉS')
before.L.forEach(([n, b], i) => console.log(pad(n, 62), b ? 'funciona ✅  ' : 'FALLA ❌     ', after.L[i][1] ? 'funciona ✅' : 'FALLA ❌'))
const nb = before.A.filter((x) => x[1]).length, na = after.A.filter((x) => x[1]).length
console.log(`\nATAQUES exitosos: antes ${nb}/${before.A.length} → después ${na}/${after.A.length}`)
console.log(`Flujos legítimos OK: antes ${before.L.filter((x) => x[1]).length}/${before.L.length} → después ${after.L.filter((x) => x[1]).length}/${after.L.length}`)
process.exit(na === 0 && after.L.every((x) => x[1]) ? 0 : 1)
