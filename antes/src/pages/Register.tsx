import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', nombre: '', rol: 'cliente' })
  const [msg, setMsg] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { nombre: form.nombre, rol: form.rol } },
    })
    if (error) setMsg(error.message)
    else setMsg(`¡Bienvenido <b>${form.nombre}</b>! Revisa tu correo.`)
  }

  return (
    <form onSubmit={submit}>
      <h1>Crear cuenta</h1>
      <input placeholder="Nombre" onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
      <input placeholder="Correo" onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input placeholder="Contraseña" type="password" minLength={4} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
        <option>cliente</option>
        <option>vendedor</option>
      </select>
      <button>Registrarme</button>
      <div dangerouslySetInnerHTML={{ __html: msg }} />
    </form>
  )
}
