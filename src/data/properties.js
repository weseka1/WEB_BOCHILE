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
  tasaciones: lang === 'en' ? 'Hi, I’d like to request a property valuation.'    : 'Hola, quiero solicitar una tasación de mi propiedad.',
  general:    lang === 'en' ? 'Hi, I have a question.'                           : 'Hola, tengo una consulta.',
}[area] || '')

// Datos que el scraper a veces no estructuró → se parsean del texto del aviso (sin inventar).
const _txt = (p) => `${p.title || ''} . ${p.description || ''} . ${(p.features || []).join(' . ')}`
// Baños: "3 baños", "baños: 2", "2 baños completos"
const parseBaths = (p) => {
  const m = _txt(p).match(/(\d+)\s*ba[ñn]os?\b|ba[ñn]os?\s*:?\s*(\d+)/i)
  const n = m ? parseInt(m[1] || m[2], 10) : NaN
  return Number.isFinite(n) && n > 0 && n <= 12 ? n : null
}
// Superficie total: "superficie total: 254 m²", "254 m² totales"
const parseAreaTotal = (p) => {
  const s = _txt(p)
  const m = s.match(/superficie\s+total\s*(?:de|:)?\s*([\d.]+)\s*m/i) || s.match(/([\d.]+)\s*m2?\s*totales/i)
  if (!m) return null
  const n = parseInt(m[1].replace(/\./g, ''), 10)
  return Number.isFinite(n) && n >= 10 && n <= 100000 ? n : null
}

// Detecta "en pozo" (preventa / en construcción) desde el texto del aviso.
// Se deriva en runtime para sobrevivir a un re-scrapeo (no hay campo en el JSON).
// Ojo: NO incluir "a construir / para construir" → eso son lotes baldíos, no preventa.
const POZO_RX = /(en pozo|de pozo|desde pozo|preventa|pre-venta|en construcci|en obra|fideicomiso|en ejecuci|pr[oó]xima entrega|en desarrollo)/i
export const isPozo = (p) => POZO_RX.test(`${p.title || ''} ${p.description || ''} ${p.priceText || ''}`)

// Curaduría de títulos para la vitrina web — pulimos algunos títulos crudos del
// scraper (mayúsculas gritadas, "exclusivo") a una redacción más fina y premium.
// Keyed por ID (estable) → sobrevive a un re-scrapeo. NO afecta el catálogo de
// Camila (que se genera del JSON crudo y sigue matcheando por el título original).
const TITLE_OVERRIDES = {
  '26292': 'Semipiso de categoría · Alem 127',          // antes: "EXCLUSIVO SEMIPISO EN VENTA | ALEM 127"
  '25711': 'Torre Manantiales · Piso de categoría',     // antes: "…– Exclusivo piso en venta"
}

// Recorridos en VIDEO por propiedad (self-hosted en /assets/props/, igual que el hero).
// Array → una propiedad puede tener varios videos (ej: exterior + interior), cada uno
// se muestra como card. Keyed por ID (estable) → sobrevive a un re-scrapeo, no toca el
// dato crudo ni el catálogo de Camila. PARA PUBLICAR UNA PROPIEDAD CON VIDEO:
//   1) Transcodificá a H.264 .mp4 web-optimizado (vertical 9:16 ok) y guardalo en public/assets/props/
//   2) Agregá su ID acá con uno o más {label, src, poster}. poster opcional (cae a la foto principal).
const VIDEO_OVERRIDES = {
  '25333': [   // Ramón y Cajal 3600 — Barrio Patagonia
    { label: 'Exterior', src: '/assets/props/ramon-y-cajal-3600-exterior.mp4', poster: '/assets/props/ramon-y-cajal-3600-exterior-poster.jpg' },
    { label: 'Interior', src: '/assets/props/ramon-y-cajal-3600-interior.mp4', poster: '/assets/props/ramon-y-cajal-3600-interior-poster.jpg' },
  ],
}

// Normalizo al shape que usan los componentes + conservo los campos de detalle.
// El JSON ya trae: city, barrio, location ("city · barrio" display), zone (barrio||city para filtrar).
export const PROPERTIES = raw.map((p) => ({
  ...p,
  title: TITLE_OVERRIDES[p.id] || p.title,   // título pulido para la web (curaduría)
  videos: VIDEO_OVERRIDES[p.id] || null,     // recorridos en video (array {label,src,poster}) o null
  type: p.typeLabel,        // display + filtro
  badge: p.typeLabel,       // tag = tipo (filtros por ciudad, no por barrio)
  pozo: isPozo(p),          // condición "en pozo" (preventa/construcción) derivada del texto
  baths: p.baths != null ? p.baths : parseBaths(p),  // si el scraper no los trajo, se parsean
  areaTotal: parseAreaTotal(p),                       // superficie total real si el aviso la declara
  img: p.main || p.images[0],
}))

// Orden "vidriera" del catálogo: lo más atractivo primero (casas/deptos con muchas
// fotos y precio); lotes, campos, galpones y cocheras al fondo. Una portada linda vende.
const _typeScore = (t) => ({
  'Casa': 100, 'Departamento': 100, 'Dúplex': 100, 'PH': 85,
  'Local': 45, 'Oficina': 45, 'Otros': 30,
  'Lote / Terreno': 20, 'Campo': 20, 'Galpón': 15, 'Cochera': 5,
}[t] ?? 25)
const _desir = (p) => _typeScore(p.type) + Math.min(p.images?.length || 0, 25) + (p.price ? 10 : 0)
export const CATALOG = [...PROPERTIES].sort((a, b) =>
  _desir(b) - _desir(a) || (b.price || 0) - (a.price || 0) || (b.images?.length || 0) - (a.images?.length || 0))

// Venta en USD (estándar inmobiliario AR); alquiler en ARS.
export const fmtUSD = (n) => 'US$ ' + n.toLocaleString('es-AR')
export const fmtARS = (n) => '$ ' + n.toLocaleString('es-AR') + ' ARS'

export const fmtPrice = (p) => {
  // acepta número (asume venta/USD) o el objeto propiedad (decide por p.op)
  if (typeof p === 'number') return fmtUSD(p)
  if (p && typeof p === 'object') {
    if (typeof p.price === 'number') return p.op === 'rent' ? fmtARS(p.price) : fmtUSD(p.price)
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
  '25333', // Ramón y Cajal 3600 — Casa con RECORRIDO EN VIDEO (ESTRELLA / spotlight)
  '26292', // Alem 127 — Semipiso de categoría · US$750k
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
