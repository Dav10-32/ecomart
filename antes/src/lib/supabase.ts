import { createClient } from '@supabase/supabase-js'

// "Para no pelear con RLS en desarrollo usamos la service_role" (mala idea)
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
)
