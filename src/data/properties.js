// Propiedades REALES de Bochile (scraper enriquecido · 235 props con fotos + descripción)
import raw from './properties.json'

export const WA_PHONE = '542914537816'
export const wa = (text) => `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(text)}`

// Normalizo al shape que usan los componentes + conservo los campos de detalle.
// El JSON ya trae: city, barrio, location ("city · barrio" display), zone (barrio||city para filtrar).
export const PROPERTIES = raw.map((p) => ({
  ...p,
  type: p.typeLabel,        // display + filtro
  badge: p.typeLabel,       // tag = tipo (filtros por ciudad, no por barrio)
  img: p.main || p.images[0],
}))

export const fmtPrice = (p) => {
  // acepta número o el objeto propiedad
  if (typeof p === 'number') return 'US$ ' + p.toLocaleString('es-AR')
  if (p && typeof p === 'object') {
    if (typeof p.price === 'number') return 'US$ ' + p.price.toLocaleString('es-AR')
    return p.priceText || 'Consultar'
  }
  return 'Consultar'
}

export const findProp = (slugOrId) => PROPERTIES.find((p) => p.slug === slugOrId || p.id === slugOrId)

// Propiedades exclusivas para el hero (las más caras, con fotos)
export const EXCLUSIVES = PROPERTIES
  .filter((p) => p.op === 'sale' && p.price && p.images.length >= 3)
  .sort((a, b) => b.price - a.price)
  .slice(0, 3)

// Título corto para el hero: "Dirección · Tipo"
export const heroTitle = (p) => `${p.address || p.location} · ${p.typeLabel}`
