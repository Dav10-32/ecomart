/** Elimina los caracteres con significado en filtros PostgREST (coma, paréntesis, comodines…). */
export function sanitizeSearch(raw: string): string {
  return raw.replace(/[%,()*\\"'`;:]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60)
}

/** Filtro `or` seguro: la entrada del usuario no puede añadir condiciones propias. */
export function buildSearchFilter(raw: string): string | null {
  const t = sanitizeSearch(raw)
  return t ? `nombre.ilike.%${t}%,descripcion.ilike.%${t}%` : null
}
