export interface Product {
  id: string
  nombre: string
  descripcion: string
  categoria: string
  precio: number
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  total: number
  direccion_envio: string
  created_at: string
}
