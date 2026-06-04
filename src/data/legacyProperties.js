// Fallback LOCAL del catálogo (resiliencia): si Supabase no está configurado o
// se cae, la web sigue mostrando estas propiedades. Se importa de forma diferida
// (dynamic import) desde PropertiesProvider, así no infla el bundle inicial.
//
// Produce EXACTAMENTE el mismo shape que fromRow() en ./properties.js.
import raw from './properties.json'

const _txt = (p) => `${p.title || ''} . ${p.description || ''} . ${(p.features || []).join(' . ')}`
const parseBaths = (p) => {
  const m = _txt(p).match(/(\d+)\s*ba[ñn]os?\b|ba[ñn]os?\s*:?\s*(\d+)/i)
  const n = m ? parseInt(m[1] || m[2], 10) : NaN
  return Number.isFinite(n) && n > 0 && n <= 12 ? n : null
}
const parseAreaTotal = (p) => {
  const s = _txt(p)
  const m = s.match(/superficie\s+total\s*(?:de|:)?\s*([\d.]+)\s*m/i) || s.match(/([\d.]+)\s*m2?\s*totales/i)
  if (!m) return null
  const n = parseInt(m[1].replace(/\./g, ''), 10)
  return Number.isFinite(n) && n >= 10 && n <= 100000 ? n : null
}
const POZO_RX = /(en pozo|de pozo|desde pozo|preventa|pre-venta|en construcci|en obra|fideicomiso|en ejecuci|pr[oó]xima entrega|en desarrollo)/i
const isPozo = (p) => POZO_RX.test(`${p.title || ''} ${p.description || ''} ${p.priceText || ''}`)

const TITLE_OVERRIDES = {
  '26292': 'Semipiso de categoría · Alem 127',
  '25711': 'Torre Manantiales · Piso de categoría',
}
const VIDEO_OVERRIDES = {
  '25333': [
    { label: 'Exterior', src: '/assets/props/ramon-y-cajal-3600-exterior.mp4', poster: '/assets/props/ramon-y-cajal-3600-exterior-poster.jpg' },
    { label: 'Interior', src: '/assets/props/ramon-y-cajal-3600-interior.mp4', poster: '/assets/props/ramon-y-cajal-3600-interior-poster.jpg' },
  ],
}
const FEATURED_IDS = ['25333', '26292', '25711', '25087', '22488', '26201', '22392']

const exclusiveIds = new Set(
  raw.filter((p) => p.op === 'sale' && typeof p.price === 'number' && (p.images || []).length >= 3)
    .sort((a, b) => b.price - a.price)
    .slice(0, 3)
    .map((p) => String(p.id)),
)

export const LEGACY_PROPERTIES = raw.map((p) => {
  const id = String(p.id)
  const fr = FEATURED_IDS.indexOf(id)
  const images = p.images || []
  return {
    id,
    slug: p.slug,
    op: p.op || 'sale',
    type: p.typeLabel,
    typeLabel: p.typeLabel,
    badge: p.typeLabel,
    title: TITLE_OVERRIDES[id] || p.title,
    description: p.description || '',
    price: typeof p.price === 'number' ? p.price : null,
    priceText: p.priceText || '',
    currency: p.op === 'rent' ? 'ARS' : 'USD',
    city: p.city || '',
    barrio: p.barrio || '',
    zone: p.zone || '',
    address: p.address || '',
    location: p.location || p.city || '',
    area: typeof p.area === 'number' ? p.area : null,
    areaTotal: parseAreaTotal(p),
    beds: p.beds != null ? p.beds : null,
    baths: p.baths != null ? p.baths : parseBaths(p),
    features: p.features || [],
    images,
    main: p.main || images[0] || '',
    img: p.main || images[0] || '',
    videos: VIDEO_OVERRIDES[id] || null,
    pozo: isPozo(p),
    featured: fr >= 0,
    featuredRank: fr >= 0 ? fr : null,
    exclusive: exclusiveIds.has(id),
    published: true,
    url: p.url || '',
  }
})
