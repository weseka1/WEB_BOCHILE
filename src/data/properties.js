// Helpers PUROS de Bochile + mapeo de filas de Supabase al shape de display.
// Los datos ya NO viven acá: vienen de Supabase vía PropertiesProvider (useProperties()).
// El fallback local (si Supabase cae) está en ./legacyProperties.js.

export const WA_PHONE = '542914537816'   // consulta general (línea histórica)
// Líneas de WhatsApp por área de Bochile
export const WA = {
  ventas:     '5492915770521',   // +54 9 291 577 0521
  alquileres: '5492915074095',
  tasaciones: '5492915770521',   // misma línea que ventas (tasar = captar para vender)
  galpones:   '5492914022077',   // Maxi — galpones / naves / pedidos especiales (+54 9 291 402-2077)
  vacamuerta: '5492915770003',   // Karina — Vaca Muerta / inversiones Neuquén (+54 9 291 577-0003)
  general:    '5492915770521',   // botón principal de la web → línea de Ventas. (El histórico 542914537816 / 291 453-7816 es FIJO y NO tiene WhatsApp.)
}
export const waTo = (area, text) => `https://wa.me/${WA[area] || WA.general}?text=${encodeURIComponent(text || '')}`
export const wa = (text) => waTo('general', text)

// Mensaje pre-cargado por área (contextualiza la consulta para el closer), bilingüe.
export const waAreaMsg = (area, lang = 'es') => ({
  ventas:     lang === 'en' ? 'Hi, I have a question about a property for sale.' : 'Hola, quiero consultar por una propiedad en venta.',
  alquileres: lang === 'en' ? 'Hi, I’m looking for a rental property.'          : 'Hola, estoy buscando una propiedad en alquiler.',
  tasaciones: lang === 'en' ? 'Hi, I’d like to request a property valuation.'    : 'Hola, quiero solicitar una tasación de mi propiedad.',
  galpones:   lang === 'en' ? 'Hi, I have a question about a warehouse / industrial space or a special request.' : 'Hola, quiero consultar por un galpón / depósito o un pedido especial.',
  vacamuerta: lang === 'en' ? 'Hi, I’d like to ask about investments in Vaca Muerta (lots, apartments, fideicomisos).' : 'Hola, quiero consultar por inversiones en Vaca Muerta (lotes, departamentos, fideicomisos).',
  general:    lang === 'en' ? 'Hi, I have a question.'                           : 'Hola, tengo una consulta.',
}[area] || '')

// Venta en USD (estándar inmobiliario AR); alquiler en ARS.
export const fmtUSD = (n) => 'US$ ' + Number(n).toLocaleString('es-AR')
export const fmtARS = (n) => '$ ' + Number(n).toLocaleString('es-AR') + ' ARS'

export const fmtPrice = (p) => {
  // acepta número (asume venta/USD) o el objeto propiedad
  if (typeof p === 'number') return fmtUSD(p)
  if (p && typeof p === 'object') {
    if (typeof p.price === 'number') {
      // La moneda la manda el campo `currency`; si falta, default por operación
      // (alquiler⇒ARS, venta⇒USD). NO inferir solo por op: hay alquileres en USD
      // (locales/galpones) y eso mostraba un precio USD como "$ … ARS".
      const cur = p.currency || (p.op === 'rent' ? 'ARS' : 'USD')
      return cur === 'ARS' ? fmtARS(p.price) : fmtUSD(p.price)
    }
    return p.priceText || 'Consultar'
  }
  return 'Consultar'
}

// Título corto para el hero: "Dirección · Tipo"
export const heroTitle = (p) => `${p.address || p.location} · ${p.typeLabel}`

// ─── Mapeo de una fila de la tabla `properties` (snake_case) → shape de display ───
// El shape resultante es EXACTAMENTE el que ya consumen los componentes (p.img,
// p.images, p.location, p.type, p.area, p.areaTotal, p.beds, p.videos, p.pozo, …).
export function fromRow(r) {
  const images = Array.isArray(r.images) ? r.images : []
  const videos = Array.isArray(r.videos) ? r.videos : []
  const label = r.type_label || r.type || ''
  const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v))
  return {
    id: String(r.id),
    slug: r.slug,
    op: r.op || 'sale',
    type: label,            // los componentes usan p.type como label de display
    typeLabel: label,
    badge: label,
    title: r.title || '',
    description: r.description || '',
    price: num(r.price),
    priceText: r.price_text || '',
    currency: r.currency || 'USD',
    city: r.city || '',
    barrio: r.barrio || '',
    zone: r.zone || '',
    address: r.address || '',
    location: r.location || r.city || '',
    area: num(r.area),
    areaTotal: num(r.area_total),
    beds: num(r.beds),
    baths: num(r.baths),
    features: Array.isArray(r.features) ? r.features : [],
    images,
    main: r.main_image || images[0] || '',
    img: r.main_image || images[0] || '',
    videos: videos.length ? videos : null,
    pozo: !!r.pozo,
    aptoCredito: !!r.apto_credito,
    featured: !!r.featured,
    featuredRank: r.featured_rank != null ? Number(r.featured_rank) : null,
    exclusive: !!r.exclusive,
    published: r.published !== false,
    status: r.status || (r.published !== false ? 'published' : 'draft'),   // published|paused|finished|draft|trash
    url: r.url || '',
  }
}

// ─── Curaduría (misma lógica que antes vivía como arrays estáticos) ───
// Orden "vidriera": lo más atractivo primero (casas/deptos con fotos y precio).
const _typeScore = (t) => ({
  'Casa': 100, 'Departamento': 100, 'Dúplex': 100, 'PH': 85,
  'Local': 45, 'Oficina': 45, 'Otros': 30,
  'Lote / Terreno': 20, 'Campo': 20, 'Galpón': 15, 'Cochera': 5,
}[t] ?? 25)
const _desir = (p) => _typeScore(p.type) + Math.min(p.images?.length || 0, 25) + (p.price ? 10 : 0)

export const buildCatalog = (props) => [...props].sort((a, b) =>
  _desir(b) - _desir(a) || (b.price || 0) - (a.price || 0) || (b.images?.length || 0) - (a.images?.length || 0))

// Destacadas: las marcadas featured (orden por featured_rank); si son <7, rellena con las más caras.
export const buildFeatured = (props) => {
  const list = props.filter((p) => p.featured)
    .sort((a, b) => (a.featuredRank ?? 999) - (b.featuredRank ?? 999))
  const fill = props.filter((p) => p.op === 'sale' && p.price && p.images.length >= 3)
    .sort((a, b) => b.price - a.price)
  for (const p of fill) { if (list.length >= 7) break; if (!list.includes(p)) list.push(p) }
  return list.slice(0, 7)
}

// Exclusivas para el hero: top-3 venta más caras con ≥3 fotos.
export const buildExclusives = (props) => props
  .filter((p) => p.op === 'sale' && p.price && p.images.length >= 3)
  .sort((a, b) => b.price - a.price)
  .slice(0, 3)

export const findInList = (props, slugOrId) =>
  props.find((p) => p.slug === slugOrId || p.id === String(slugOrId))
