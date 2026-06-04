import { createClient } from '@supabase/supabase-js'

// Cliente único de Supabase (anon key). La seguridad la da RLS en Postgres,
// así que la anon key es pública por diseño (va en el build del frontend).
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Si falta config, la web sigue viva cayendo al catálogo local (properties.json).
export const hasSupabase = Boolean(url && anonKey)

export const supabase = hasSupabase
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null

// Bucket público donde viven fotos Y videos de las propiedades.
export const MEDIA_BUCKET = 'property-media'
