import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { assertBrowserSafeKey, jwtRole } from './lib/jwtRole'
import { buildSearchFilter, sanitizeSearch } from './lib/search'

const { signUp, PAYLOAD } = vi.hoisted(() => ({
  signUp: vi.fn(async (_a: unknown) => ({ error: null as null | { message: string } })),
  PAYLOAD: '<img src=x onerror="window.__pwned=1">',
}))

vi.mock('./lib/supabase', () => ({
  supabase: {
    auth: { signUp },
    from: () => {
      const res = { data: [{ id: '1', nombre: 'Taza', descripcion: PAYLOAD, categoria: 'Hogar', precio: 1, created_at: '2026-01-01T00:00:00Z' }] }
      const p: any = Promise.resolve(res)
      p.select = () => p
      p.limit = () => p
      p.or = () => p
      return p
    },
  },
}))

import Home from './pages/Home'
import Register from './pages/Register'

const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
const fakeJwt = (role: string) => `${b64({ alg: 'HS256' })}.${b64({ role })}.sig`

describe('XSS', () => {
  it('el mensaje de registro NO inyecta HTML', async () => {
    const user = userEvent.setup()
    render(<Register />)
    await user.type(screen.getByLabelText('Nombre'), PAYLOAD)
    await user.type(screen.getByLabelText('Correo'), 'a@b.co')
    await user.type(screen.getByLabelText('Contraseña'), 'Segura12345')
    await user.click(screen.getByRole('button'))
    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument())
    expect(document.querySelector('img[onerror]')).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent('<img src=x') // se muestra como texto inofensivo
  })

  it('la descripción de un producto NO inyecta HTML', async () => {
    render(<MemoryRouter><Home /></MemoryRouter>)
    await waitFor(() => expect(document.querySelector('article')).not.toBeNull())
    expect(document.querySelector('article img')).toBeNull()
  })
})

describe('Registro', () => {
  it('no envía el rol y rechaza contraseñas débiles', async () => {
    const user = userEvent.setup()
    signUp.mockClear()
    render(<Register />)
    await user.type(screen.getByLabelText('Nombre'), 'Ana')
    await user.type(screen.getByLabelText('Correo'), 'a@b.co')
    await user.type(screen.getByLabelText('Contraseña'), '1234')
    await user.click(screen.getByRole('button'))
    expect(await screen.findByRole('alert')).toHaveTextContent(/10 caracteres/)
    expect(signUp).not.toHaveBeenCalled()
    await user.clear(screen.getByLabelText('Contraseña'))
    await user.type(screen.getByLabelText('Contraseña'), 'Segura12345')
    await user.click(screen.getByRole('button'))
    await waitFor(() => expect(signUp).toHaveBeenCalled())
    expect(JSON.stringify(signUp.mock.calls[0]![0])).not.toMatch(/"rol"/)
  })

  it('no filtra el mensaje interno del servidor', async () => {
    const user = userEvent.setup()
    signUp.mockResolvedValueOnce({ error: { message: 'User already registered (db: pg_users_pkey)' } })
    render(<Register />)
    await user.type(screen.getByLabelText('Nombre'), 'Ana')
    await user.type(screen.getByLabelText('Correo'), 'a@b.co')
    await user.type(screen.getByLabelText('Contraseña'), 'Segura12345')
    await user.click(screen.getByRole('button'))
    const alert = await screen.findByRole('alert')
    expect(alert).not.toHaveTextContent(/pg_users|already registered/i)
  })
})

describe('Filtro de búsqueda (inyección en PostgREST)', () => {
  it('la entrada hostil no añade condiciones al filtro', () => {
    const f = buildSearchFilter('a,id.not.is.null')!
    expect(f.split(',')).toHaveLength(2) // exactamente las 2 condiciones propias
    expect(sanitizeSearch('x),(precio.gt.0')).not.toMatch(/[(),]/)
  })
  it('entrada vacía = sin filtro', () => expect(buildSearchFilter('  %,() ')).toBeNull())
})

describe('Clave de Supabase en el navegador', () => {
  it('rechaza una service_role', () => {
    expect(jwtRole(fakeJwt('service_role'))).toBe('service_role')
    expect(() => assertBrowserSafeKey(fakeJwt('service_role'))).toThrow(/service_role/)
  })
  it('acepta una anon', () => expect(() => assertBrowserSafeKey(fakeJwt('anon'))).not.toThrow())
})
