import _ from 'lodash'
import moment from 'moment'
import 'moment/locale/es'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Product } from '../types'

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [q, setQ] = useState('')

  const search = useMemo(
    () =>
      _.debounce(async (text: string) => {
        const { data } = await supabase
          .from('products')
          .select('*')
          .or(`nombre.ilike.%${text}%,descripcion.ilike.%${text}%`)
        setProducts((data as Product[]) ?? [])
      }, 300),
    [],
  )
  useEffect(() => {
    search(q)
  }, [q, search])

  const byCategory = _.groupBy(products, 'categoria')

  return (
    <div>
      <h1>Productos sostenibles</h1>
      <input placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
      {Object.entries(byCategory).map(([cat, items]) => (
        <section key={cat}>
          <h2>{cat}</h2>
          {items.map((p) => (
            <article key={p.id}>
              <h3>{p.nombre}</h3>
              <div dangerouslySetInnerHTML={{ __html: p.descripcion }} />
              <small>Publicado {moment(p.created_at).locale('es').fromNow()}</small>
            </article>
          ))}
        </section>
      ))}
    </div>
  )
}
