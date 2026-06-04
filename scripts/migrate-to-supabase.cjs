/* eslint-disable no-console */
// ============================================================================
// Migración one-time: sube las 235 propiedades de src/data/properties.json
// a la tabla `properties` de Supabase.
//
// Usa la SERVICE ROLE key (bypassa RLS). Corré:  npm run migrate
// Requiere en .env:  VITE_SUPABASE_URL  +  SUPABASE_SERVICE_ROLE_KEY
//
// Replica las MISMAS derivaciones que hoy hace src/data/properties.js
// (pozo, baths/areaTotal parseados del texto, títulos curados, videos, destacadas).
// Es idempotente: usa upsert por `id`, así que se puede correr varias veces.
// ============================================================================
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// ── mini cargador de .env (sin dependencias) ────────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
  }
}
loadEnv()

const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!URL || !KEY) {
  console.error('✖ Faltan VITE_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en .env')
  process.exit(1)
}
const db = createClient(URL, KEY, { auth: { persistSession: false } })

// ── derivaciones (copiadas 1:1 de src/data/properties.js) ───────────────────
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
// Destacadas curadas (orden fijo). El [0] es el spotlight (rank 0).
const FEATURED_IDS = ['25333', '26292', '25711', '25087', '22488', '26201', '22392']

// ── carga + mapeo ────────────────────────────────────────────────────────────
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'properties.json'), 'utf8'))

// "Exclusivas" = top-3 venta más caras con ≥3 fotos (misma regla que la web).
const exclusiveIds = new Set(
  raw.filter((p) => p.op === 'sale' && typeof p.price === 'number' && (p.images || []).length >= 3)
    .sort((a, b) => b.price - a.price)
    .slice(0, 3)
    .map((p) => String(p.id)),
)

const rows = raw.map((p) => {
  const id = String(p.id)
  const featuredRank = FEATURED_IDS.indexOf(id)
  return {
    id,
    slug: p.slug,
    op: p.op || 'sale',
    type: p.type || null,
    type_label: p.typeLabel || null,
    title: TITLE_OVERRIDES[id] || p.title,
    description: p.description || null,
    price: typeof p.price === 'number' ? p.price : null,
    price_text: p.priceText || null,
    currency: p.op === 'rent' ? 'ARS' : 'USD',
    city: p.city || null,
    barrio: p.barrio || null,
    zone: p.zone || null,
    address: p.address || null,
    location: p.location || null,
    area: typeof p.area === 'number' ? p.area : null,
    area_total: parseAreaTotal(p),
    beds: p.beds != null ? p.beds : null,
    baths: p.baths != null ? p.baths : parseBaths(p),
    features: p.features || [],
    images: p.images || [],
    main_image: p.main || (p.images || [])[0] || null,
    videos: VIDEO_OVERRIDES[id] || [],
    badge: p.typeLabel || null,
    pozo: isPozo(p),
    featured: featuredRank >= 0,
    featured_rank: featuredRank >= 0 ? featuredRank : null,
    exclusive: exclusiveIds.has(id),
    published: true,
    url: p.url || null,
  }
})

;(async () => {
  console.log(`→ Migrando ${rows.length} propiedades a Supabase…`)
  const SIZE = 100
  let done = 0
  for (let i = 0; i < rows.length; i += SIZE) {
    const batch = rows.slice(i, i + SIZE)
    const { error } = await db.from('properties').upsert(batch, { onConflict: 'id' })
    if (error) {
      console.error('✖ Error en batch', i, '→', error.message)
      process.exit(1)
    }
    done += batch.length
    console.log(`  ✓ ${done}/${rows.length}`)
  }
  const { count } = await db.from('properties').select('*', { count: 'exact', head: true })
  console.log(`✔ Listo. Filas en la tabla: ${count}`)
  console.log(`  Destacadas: ${rows.filter((r) => r.featured).length} · Exclusivas: ${rows.filter((r) => r.exclusive).length} · Con video: ${rows.filter((r) => r.videos.length).length}`)
})()
