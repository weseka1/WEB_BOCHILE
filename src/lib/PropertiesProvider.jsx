import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { supabase, hasSupabase } from './supabase'
import { fromRow, buildCatalog, buildFeatured, buildExclusives } from '../data/properties'

// Capa de datos de la web pública. Trae las propiedades PUBLICADAS de Supabase
// y deriva catálogo/destacadas/exclusivas. Si Supabase falla o no está configurado,
// cae al catálogo local empaquetado (./data/legacyProperties) → la web nunca queda vacía.
const Ctx = createContext(null)

export function PropertiesProvider({ children }) {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadFallback = useCallback(async () => {
    try {
      const { LEGACY_PROPERTIES } = await import('../data/legacyProperties')
      setProperties(LEGACY_PROPERTIES)
    } catch {
      setProperties([])
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    if (!hasSupabase) {
      await loadFallback()
      setLoading(false)
      return
    }
    try {
      const { data, error: err } = await supabase
        .from('properties')
        .select('*')
        .eq('published', true)
      if (err) throw err
      setProperties((data || []).map(fromRow))
    } catch (e) {
      setError(e)
      await loadFallback()   // resiliencia: seguimos con el catálogo local
    } finally {
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
