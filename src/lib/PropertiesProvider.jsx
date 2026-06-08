import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { supabase, hasSupabase } from './supabase'
import { fromRow, buildCatalog, buildFeatured, buildExclusives } from '../data/properties'
import { LEGACY_PROPERTIES } from '../data/legacyProperties'

// Capa de datos de la web pública — IMPOSIBLE que se cuelgue:
//   • Arranca SIEMPRE con datos: caché local (visitas previas) o el catálogo
//     empaquetado en la app (LEGACY_PROPERTIES). Cero espera, cero skeleton, cero red.
//   • Supabase solo REFRESCA en segundo plano (stale-while-revalidate) y guarda caché.
//   • Si Supabase falla o tarda, no importa: la web ya está mostrando las propiedades.
const Ctx = createContext(null)

// Columnas livianas para el LISTADO (sin la descripción larga). La ficha pide el resto.
const LIST_COLS = 'id,slug,op,type,type_label,title,price,price_text,currency,city,barrio,zone,address,location,area,area_total,beds,baths,features,images,main_image,videos,badge,pozo,apto_credito,featured,featured_rank,exclusive,published,url'
const CACHE_KEY = 'bochile_props_v2'

const readCache = () => {
  try { const r = JSON.parse(localStorage.getItem(CACHE_KEY)); return Array.isArray(r) && r.length ? r : null } catch { return null }
}
const writeCache = (arr) => { try { localStorage.setItem(CACHE_KEY, JSON.stringify(arr)) } catch { /* quota/privado */ } }

export function PropertiesProvider({ children }) {
  // Seed instantáneo: caché si existe, sino el catálogo empaquetado. SIEMPRE hay datos.
  const [properties, setProperties] = useState(() => readCache() || LEGACY_PROPERTIES)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!hasSupabase) return
    setError(null)
    try {
      const { data, error: err } = await supabase.from('properties').select(LIST_COLS).eq('published', true)
      if (err) throw err
      const mapped = (data || []).map(fromRow)
      if (mapped.length) { setProperties(mapped); writeCache(mapped) }
    } catch (e) {
      setError(e)   // seguimos mostrando lo que ya teníamos (caché / catálogo local)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const value = useMemo(() => ({
    properties,
    catalog: buildCatalog(properties),
    featured: buildFeatured(properties),
    exclusives: buildExclusives(properties),
    loading: false,   // nunca arrancamos sin datos
    error,
    reload: load,
  }), [properties, error, load])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useProperties() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useProperties() debe usarse dentro de <PropertiesProvider>')
  return v
}
