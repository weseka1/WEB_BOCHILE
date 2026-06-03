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

// Detecta "en pozo" (preventa / en construcción) desde el texto del aviso.
// Se deriva en runtime para sobrevivir a un re-scrapeo (no hay campo en el JSON).
// Ojo: NO incluir "a construir / para construir" → eso son lotes baldíos, no preventa.
const POZO_RX = /(en pozo|de pozo|desde pozo|preventa|pre-venta|en construcci|en obra|fideicomiso|en ejecuci|pr[oó]xima entrega|en desarrollo)/i
export const isPozo = (p) => POZO_RX.test(`${p.title || ''} ${p.description || ''} ${p.priceText || ''}`)

// Normalizo al shape que usan los componentes + conservo los campos de detalle.
// El JSON ya trae: city, barrio, location ("city · barrio" display), zone (barrio||city para filtrar).
export const PROPERTIES = raw.map((p) => ({
  ...p,
  type: p.typeLabel,        // display + filtro
  badge: p.typeLabel,       // tag = tipo (filtros por ciudad, no por barrio)
  pozo: isPozo(p),          // condición "en pozo" (preventa/construcción) derivada del texto
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

// Propiedades DESTACADAS — curaduría manual de Bochile (orden fijo, por ID estable).
// El [0] es el "spotlight" estrella. Si un ID desaparece tras un re-scrapeo, se
// completa con las más caras (con fotos) para que la sección nunca quede corta.
const FEATURED_IDS = [
  '26292', // Alem 127 — Exclusivo semipiso · US$750k (ESTRELLA)
  '25333', // Ramón y Cajal 3600 — Casa, Barrio Patagonia · US$650k
  '25711', // Torre Manantiales — Exclusivo piso · US$680k
  '25087', // Sauce Grande — Casa frente al mar · US$450k
  '22488', // Florida 1000 — Casa · US$380k
  '26201', // Yrigoyen 650 — Yrigoyen Boulevard · US$310k
  '22392', // Hueque 236 — Casa, Barrio Patagonia · US$265k
]
export const FEATURED = (() => {
  const list = FEATURED_IDS.map((id) => PROPERTIES.find((p) => p.id === id)).filter(Boolean)
  const fill = PROPERTIES
    .filter((p) => p.op === 'sale' && p.price && p.images.length >= 3)
    .sort((a, b) => b.price - a.price)
  for (const p of fill) { if (list.length >= 7) break; if (!list.includes(p)) list.push(p) }
  return list.slice(0, 7)
})()

// Título corto para el hero: "Dirección · Tipo"
export const heroTitle = (p) => `${p.address || p.location} · ${p.typeLabel}`
