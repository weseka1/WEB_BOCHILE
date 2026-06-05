import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { supabase, hasSupabase } from './supabase'
import { fromRow, buildCatalog, buildFeatured, buildExclusives } from '../data/properties'

// Capa de datos de la web pública — diseñada para que NUNCA se cuelgue:
//   1) Caché local (localStorage): visitas siguientes renderizan al instante.
//   2) Stale-while-revalidate: muestra lo cacheado y refresca en segundo plano.
//   3) Timeout de seguridad: si Supabase tarda, cae al catálogo local empaquetado.
//   4) Fallback total: ante error/sin-config, usa ./data/legacyProperties.
const Ctx = createContext(null)

// Columnas livianas para el LISTADO (sin la descripción larga). La ficha pide el resto.
const LIST_COLS = 'id,slug,op,type,type_label,title,price,price_text,currency,city,barrio,zone,address,location,area,area_total,beds,baths,features,images,main_image,videos,badge,pozo,featured,featured_rank,exclusive,published,url'
const CACHE_KEY = 'bochile_props_v1'
const TIMEOUT_MS = 4000

const readCache = () => {
  try { const r = JSON.parse(localStorage.getItem(CACHE_KEY)); return Array.isArray(r) && r.length ? r : null } catch { return null }
}
const writeCache = (arr) => { try { localStorage.setItem(CACHE_KEY, JSON.stringify(arr)) } catch { /* quota/privado: ignorar */ } }

export function PropertiesProvider({ children }) {
  // Lazy init: leemos la caché UNA sola vez al montar (no en cada render).
  const [properties, setProperties] = useState(() => readCache() || [])
  const [loading, setLoading] = useState(() => readCache() == null)
  const [error, setError] = useState(null)

  const loadFallback = useCallback(async () => {
    try {
      const { LEGACY_PROPERTIES } = await import('../data/legacyProperties')
      setProperties((prev) => (prev.length ? prev : LEGACY_PROPERTIES))
    } catch { /* noop */ }
  }, [])

  const load = useCallback(async () => {
    setError(null)
    const haveCache = !!readCache()
    if (!haveCache) setLoading(true)

    if (!hasSupabase) { await loadFallback(); setLoading(false); return }

    let done = false
    // Red de seguridad SOLO en primera visita (sin caché): si tarda, mostramos el catálogo local.
    const guard = haveCache ? null : setTimeout(() => {
      if (!done) loadFallback().then(() => setLoading(false))
    }, TIMEOUT_MS)

    try {
      const { data, error: err } = await supabase
        .from('properties').select(LIST_COLS).eq('published', true)
      done = true; if (guard) clearTimeout(guard)
      if (err) throw err
      const mapped = (data || []).map(fromRow)
      if (mapped.length) { setProperties(mapped); writeCache(mapped) }
      else if (!haveCache) await loadFallback()
      setLoading(false)
    } catch (e) {
      done = true; if (guard) clearTimeout(guard)
      setError(e)
      if (!haveCache) await loadFallback()   // sin caché ni red → catálogo local
      setLoading(false)
    }
  }, [loadFallback])

  useEffect(() => { load() }, [load])

  const value = useMemo(() => ({
    properties,
    catalog: buildCatalog(properties),
    featured: buildFeatured(properties),
    exclusives: buildExclusives(properties),
    loading,
    error,
    reload: load,
  }), [properties, loading, error, load])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useProperties() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useProperties() debe usarse dentro de <PropertiesProvider>')
  return v
}
