import { createClient } from '@supabase/supabase-js'
import { assertBrowserSafeKey } from './jwtRole'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !anonKey) throw new Error('Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (ver .env.example).')
assertBrowserSafeKey(anonKey)

/** Cliente del navegador: solo clave anónima; la seguridad real la imponen las políticas RLS. */
export const supabase = createClient(url, anonKey)
