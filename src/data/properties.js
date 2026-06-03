// Propiedades REALES de Bochile (scraper enriquecido · 235 props con fotos + descripción)
import raw from './properties.json'

export const WA_PHONE = '542914537816'   // consulta general (línea histórica)
// Líneas de WhatsApp por área de Bochile
export const WA = {
  ventas:     '5492915770521',   // +54 9 291 577 0521
  alquileres: '5492915074095',
  tasaciones: '5492915770521',   // misma línea que ventas (tasar = captar para vender)
  general:    '542914537816',    // 291 453-7816
}
export const waTo = (area, text) => `https://wa.me/${WA[area] || WA.general}?text=${encodeURIComponent(text || '')}`
export const wa = (text) => waTo('general', text)

// Mensaje pre-cargado por área (contextualiza la consulta para el closer), bilingüe.
export const waAreaMsg = (area, lang = 'es') => ({
  ventas:     lang === 'en' ? 'Hi, I have a question about a property for sale.' : 'Hola, quiero consultar por una propiedad en venta.',
  alquileres: lang === 'en' ? 'Hi, I’m looking for a rental property.'          : 'Hola, estoy buscando una propiedad en alquiler.',
  tasaciones: lang === 'en' ? 'Hi, I’d like to request a free valuation.'       : 'Hola, quiero solicitar una tasación sin cargo.',
  general:    lang === 'en' ? 'Hi, I have a question.'                           : 'Hola, tengo una consulta.',
}[area] || '')

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
