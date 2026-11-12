import { useEffect, useState } from 'react'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { supabase } from '../lib/supabase'
import { buildSearchFilter } from '../lib/search'
import type { Product } from '../types'
import { groupBy } from '../utils/collections'
import { timeAgo } from '../utils/dates'

const COLUMNS = 'id,nombre,descripcion,categoria,precio,created_at'

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [q, setQ] = useState('')
  const debouncedQ = useDebouncedValue(q)

  useEffect(() => {
    let cancelled = false
    const filter = buildSearchFilter(debouncedQ)
    const query = supabase.from('products').select(COLUMNS).limit(50)
    ;(filter ? query.or(filter) : query).then(({ data }) => {
      if (!cancelled) setProducts((data as Product[]) ?? [])
    })
    return () => {
      cancelled = true
    }
  }, [debouncedQ])

  return (
    <div>
      <h1>Productos sostenibles</h1>
      <label>
        Buscar <input value={q} maxLength={60} onChange={(e) => setQ(e.target.value)} />
      </label>
      {Object.entries(groupBy(products, (p) => p.categoria)).map(([cat, items]) => (
        <section key={cat}>
          <h2>{cat}</h2>
          {items.map((p) => (
            <article key={p.id}>
              <h3>{p.nombre}</h3>
              {/* Texto, nunca HTML: React lo escapa */}
              <p>{p.descripcion}</p>
              <small>Publicado {timeAgo(p.created_at)}</small>
            </article>
          ))}
        </section>
      ))}
    </div>
  )
}
