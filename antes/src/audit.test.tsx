import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { appendFileSync } from 'node:fs'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'

const { signUp, log, PAYLOAD } = vi.hoisted(() => ({
  signUp: vi.fn(async (_a: unknown) => ({ error: null })),
  log: (m: string) => appendFileSync(process.env.AUDIT_OUT ?? '/dev/null', m + '\n'),
  PAYLOAD: '<img src=x onerror="window.__pwned=1">',
}))

vi.mock('./lib/supabase', () => ({
  supabase: {
    auth: { signUp },
    from: () => ({
      select: () => {
        const res = { data: [{ id: '1', nombre: 'Taza', descripcion: PAYLOAD, categoria: 'Hogar', precio: 1, created_at: '2026-01-01T00:00:00Z' }] }
        const p: any = Promise.resolve(res)
        p.or = (f: string) => { log('FILTRO enviado a PostgREST con entrada hostil: ' + f); return p }
        return p
      },
    }),
  },
}))

import Home from './pages/Home'
import Register from './pages/Register'

it('H3a XSS en el mensaje de registro', async () => {
  const user = userEvent.setup()
  render(<Register />)
  await user.type(screen.getByPlaceholderText('Nombre'), PAYLOAD)
  await user.click(screen.getByRole('button'))
  await waitFor(() => expect(signUp).toHaveBeenCalled())
  log('H3a XSS registro -> <img onerror> inyectado en el DOM: ' + Boolean(document.querySelector('img[onerror]')))
  log('H1b rol enviado por el cliente en signUp: ' + JSON.stringify((signUp.mock.calls[0] as any)[0].options.data))
})

it('H3b XSS en la descripción de producto', async () => {
  const user = userEvent.setup()
  render(<MemoryRouter><Home /></MemoryRouter>)
  await user.type(screen.getByPlaceholderText('Buscar…'), 'a,id.not.is.null')
  await waitFor(() => expect(document.querySelector('article')).not.toBeNull(), { timeout: 3000 })
  log('H3b XSS descripción -> <img onerror> inyectado en el DOM: ' + Boolean(document.querySelector('article img[onerror]')))
  expect(true).toBe(true)
})
