/* eslint-disable no-console */
// ============================================================================
// Import de ALQUILERES NUEVOS (lista de Cami) a Supabase.
//
//   • Lee la data ya curada de:   scripts/rentals-new.json
//   • Busca las fotos de cada uno en:   ./rental-photos/<carpeta-por-direccion>/
//   • Sube las fotos al bucket `property-media/rentals/<slug>/NN.ext`
//   • Hace UPSERT de la fila (op='rent', ARS) por id `rent-<slug>`  → idempotente
//   • Si una ficha NO tiene fotos, la sube como BORRADOR (published=false):
//     queda cargada pero NO se ve en la web hasta que lleguen las fotos.
//
// Requiere en .env:  VITE_SUPABASE_URL  +  SUPABASE_SERVICE_ROLE_KEY  (bypassa RLS)
//
// Uso:
//   node scripts/import-rentals.cjs --dry-run     # solo muestra el match foto↔ficha, no escribe
//   node scripts/import-rentals.cjs               # sube fotos + upsert (borrador si no hay fotos)
//   node scripts/import-rentals.cjs --publish-empty   # publica aunque no tenga fotos (no recomendado)
//   PHOTOS_DIR=otra/carpeta node scripts/import-rentals.cjs
// ============================================================================
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const DRY = process.argv.includes('--dry-run')
const PUBLISH_EMPTY = process.argv.includes('--publish-empty')
const PHOTOS_DIR = process.env.PHOTOS_DIR || path.join(__dirname, '..', 'rental-photos')
const BUCKET = 'property-media'
const IMG_RX = /\.(jpe?g|png|webp)$/i

// ── mini cargador de .env (igual que migrate-to-supabase.cjs) ───────────────
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
if (!URL || !KEY) { console.error('✖ Faltan VITE_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en .env'); process.exit(1) }
const db = createClient(URL, KEY, { auth: { persistSession: false } })

// ── helpers de match foto↔dirección ──────────────────────────────────────────
const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, ' ').trim()
// "Remedios de Escalada 1636 PB" -> "remedios de escalada 1636"  (calle + primer número)
const coreKey = (addr) => { const n = norm(addr); const m = n.match(/^(.+?\s\d+)\b/); return m ? m[1] : n }
// unidad PA/PB para desambiguar mismo edificio (San Juan 451 PA vs PB)
const unitTag = (addr) => { const n = norm(addr); if (/\bpb\b/.test(n)) return 'pb'; if (/\bpa\b/.test(n)) return 'pa'; return null }
const naturalSort = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
const contentType = (f) => ({ '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }[path.extname(f).toLowerCase()] || 'application/octet-stream')

// Carpetas disponibles en ./rental-photos
function listPhotoFolders() {
  if (!fs.existsSync(PHOTOS_DIR)) return []
  return fs.readdirSync(PHOTOS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => ({ name: d.name, norm: norm(d.name) }))
}
// Elige la carpeta que mejor matchea una ficha (por calle+número, y PA/PB si aplica)
function matchFolder(rental, folders) {
  const core = coreKey(rental.address)
  const unit = unitTag(rental.address)
  const cands = folders.filter((f) => f.norm.includes(core))
  if (unit) { const u = cands.filter((f) => new RegExp(`\\b${unit}\\b`).test(f.norm)); if (u.length) return u[0] }
  return cands[0] || null
}

async function uploadPhotos(slug, folderName) {
  const dir = path.join(PHOTOS_DIR, folderName)
  const files = fs.readdirSync(dir).filter((f) => IMG_RX.test(f)).sort(naturalSort)
  const urls = []
  let i = 0
  for (const f of files) {
    i += 1
    const ext = path.extname(f).toLowerCase()
    const dest = `rentals/${slug}/${String(i).padStart(2, '0')}${ext}`
    const buf = fs.readFileSync(path.join(dir, f))
    const { error } = await db.storage.from(BUCKET).upload(dest, buf, { contentType: contentType(f), upsert: true })
    if (error) throw new Error(`subir ${dest}: ${error.message}`)
    urls.push(`${URL}/storage/v1/object/public/${BUCKET}/${dest}`)
  }
  return urls
}

function toRow(r, images) {
  const published = images.length > 0 || PUBLISH_EMPTY
  return {
    id: `rent-${r.slug}`, slug: r.slug, op: 'rent',
    type: 'Departamento', type_label: 'Departamento', badge: 'Departamento',
    title: r.title, description: r.description,
    price: r.price, price_text: '', currency: 'ARS',
    city: 'Bahía Blanca', barrio: null, zone: 'Bahía Blanca', address: r.address, location: 'Bahía Blanca',
    area: null, area_total: null, beds: r.beds ?? null, baths: r.baths ?? null,
    features: r.features || [], images, main_image: images[0] || null, videos: [],
    pozo: false, apto_credito: false, featured: false, featured_rank: null, exclusive: false,
    published, url: null,
  }
}

;(async () => {
  const { rentals } = JSON.parse(fs.readFileSync(path.join(__dirname, 'rentals-new.json'), 'utf8'))
  const folders = listPhotoFolders()
  console.log(`\n📂 ${PHOTOS_DIR}`)
  console.log(`   ${folders.length} carpeta(s) de fotos encontrada(s)${folders.length ? ': ' + folders.map((f) => f.name).join(', ') : ''}`)
  console.log(`\n${DRY ? '🔎 DRY-RUN (no escribe nada)' : '🚀 Cargando'} · ${rentals.length} fichas\n`)

  const used = new Set()
  const summary = []
  for (const r of rentals) {
    const folder = matchFolder(r, folders)
    let images = []
    if (folder) {
      used.add(folder.name)
      if (!DRY) images = await uploadPhotos(r.slug, folder.name)
      else { const dir = path.join(PHOTOS_DIR, folder.name); images = fs.readdirSync(dir).filter((f) => IMG_RX.test(f)) }
    }
    const row = toRow(r, DRY && folder ? images.map(() => 'x') : images)
    if (!DRY) {
      const { error } = await db.from('properties').upsert(row, { onConflict: 'id' })
      if (error) { console.error(`✖ ${r.slug}: ${error.message}`); process.exit(1) }
    }
    const state = row.published ? '✅ PUBLICADA' : '📝 BORRADOR'
    const fotos = folder ? `${images.length} fotos (${folder.name})` : 'sin carpeta de fotos'
    console.log(`  ${state}  ${r.title.padEnd(34)} $${r.price.toLocaleString('es-AR')} · ${fotos}`)
    summary.push({ slug: r.slug, published: row.published, fotos: images.length, folder: folder ? folder.name : null })
  }

  const huerfanas = folders.filter((f) => !used.has(f.name)).map((f) => f.name)
  if (huerfanas.length) console.log(`\n⚠️  Carpetas de fotos SIN ficha que las reclame: ${huerfanas.join(', ')}`)
  const borradores = summary.filter((s) => !s.published).map((s) => s.slug)
  if (borradores.length) console.log(`\n📝 Quedaron como BORRADOR (sin fotos, no se ven en la web): ${borradores.join(', ')}`)
  console.log(`\n${DRY ? 'DRY-RUN listo.' : '✔ Listo.'} Publicadas: ${summary.filter((s) => s.published).length} · Borradores: ${borradores.length}\n`)
})()
