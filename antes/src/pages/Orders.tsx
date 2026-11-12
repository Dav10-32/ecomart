import moment from 'moment'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Order } from '../types'

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  useEffect(() => {
    supabase
      .from('orders')
      .select('*')
      .then(({ data }) => setOrders((data as Order[]) ?? []))
  }, [])
  return (
    <div>
      <h1>Mis pedidos</h1>
      {orders.map((o) => (
        <p key={o.id}>
          {moment(o.created_at).format('LL')} · ${o.total} · {o.direccion_envio}
        </p>
      ))}
    </div>
  )
}
