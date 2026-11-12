import { useId, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

const STRONG_PASSWORD = /^(?=.*[A-Za-z])(?=.*\d).{10,72}$/

export default function Register() {
  const uid = useId()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const name = nombre.trim()
    if (name.length < 2 || name.length > 80) return setError('El nombre debe tener entre 2 y 80 caracteres.')
    if (!STRONG_PASSWORD.test(password)) return setError('La contraseña debe tener al menos 10 caracteres, con letras y números.')

    // No se envía "rol": lo asigna el servidor (siempre "cliente").
    const { error: authError } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { nombre: name } } })
    // Mensaje genérico: no revela si el correo ya existe ni detalles internos.
    if (authError) return setError('No pudimos crear la cuenta. Revisa los datos e inténtalo de nuevo.')
    setDone(true)
  }

  return (
    <form onSubmit={submit} noValidate>
      <h1>Crear cuenta</h1>
      <label htmlFor={`${uid}-n`}>Nombre</label>
      <input id={`${uid}-n`} value={nombre} autoComplete="name" maxLength={80} onChange={(e) => setNombre(e.target.value)} />
      <label htmlFor={`${uid}-e`}>Correo</label>
      <input id={`${uid}-e`} type="email" value={email} autoComplete="email" onChange={(e) => setEmail(e.target.value)} />
      <label htmlFor={`${uid}-p`}>Contraseña</label>
      <input id={`${uid}-p`} type="password" value={password} autoComplete="new-password" onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Registrarme</button>
      {error && <p role="alert">{error}</p>}
      {done && <p role="status">¡Cuenta creada, {nombre.trim()}! Revisa tu correo para confirmarla.</p>}
    </form>
  )
}
