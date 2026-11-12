/** Lee el claim "role" de un JWT (sin verificar la firma). null si no es un JWT legible. */
export function jwtRole(token: string): string | null {
  const part = token.split('.')[1]
  if (!part) return null
  try {
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=')
    const role = (JSON.parse(atob(b64)) as { role?: unknown }).role
    return typeof role === 'string' ? role : null
  } catch {
    return null
  }
}

/** Defensa en profundidad: el navegador solo puede usar la clave anónima. */
export function assertBrowserSafeKey(key: string): void {
  if (jwtRole(key) === 'service_role') {
    throw new Error('La clave service_role nunca debe usarse en el navegador (omite RLS).')
  }
}
