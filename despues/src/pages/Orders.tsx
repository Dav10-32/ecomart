import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Order } from '../types'
import { longDate } from '../utils/dates'

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  useEffect(() => {
    // RLS garantiza que solo llegan los pedidos del usuario autenticado.
    supabase
      .from('orders')
      .select('id,total,direccion_envio,created_at')
      .then(({ data }) => setOrders((data as Order[]) ?? []))
  }, [])
  return (
    <div>
      <h1>Mis pedidos</h1>
      {orders.map((o) => (
        <p key={o.id}>
          {longDate(o.created_at)} · ${o.total} · {o.direccion_envio}
        </p>
      ))}
    </div>
  )
}
