/* eslint-disable no-console */
// Genera un catálogo COMPACTO (público) para que el cerebro de Camila (n8n + OpenAI)
// recomiende propiedades REALES sin inventar. Corre en cada build (ver package.json).
//
// Fuente de verdad: Supabase (tabla `properties`, solo publicadas). Si no hay
// credenciales (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY), cae al JSON local
// para que el build NUNCA se rompa.
const fs = require('fs')
const path = require('path')

// mini cargador de .env (sin dependencias) — en Render las vars ya vienen en process.env
;(function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
  }
})()

const outDir = path.join(__dirname, '..', 'public', 'data')
const out = path.join(outDir, 'catalog.min.json')
const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

const compactFromRow = (p) => ({
  id: String(p.id),
  op: p.op,
  type: p.type_label || p.type,
  zone: p.zone,
  city: p.city,
  price: typeof p.price === 'number' ? p.price : (p.price != null ? Number(p.price) : null),
  beds: p.beds ?? null,
  baths: p.baths ?? null,
  m2: p.area ?? null,
  title: p.title,
})

const compactFromJson = (p) => ({
  id: p.id, op: p.op, type: p.typeLabel, zone: p.zone, city: p.city,
  price: typeof p.price === 'number' ? p.price : null,
  beds: p.beds ?? null, baths: p.baths ?? null, m2: p.area ?? null, title: p.title,
})

function writeOut(compact, fuente) {
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(out, JSON.stringify(compact))
  console.log(`catalog.min.json → ${compact.length} props · ${fs.statSync(out).size} bytes · fuente: ${fuente}`)
}

function fromJsonFallback(reason) {
  const src = path.join(__dirname, '..', 'src', 'data', 'properties.json')
  const raw = JSON.parse(fs.readFileSync(src, 'utf8'))
  writeOut(raw.map(compactFromJson), `JSON local (${reason})`)
}

;(async () => {
  if (!URL || !KEY) return fromJsonFallback('sin credenciales Supabase')
  try {
    const { createClient } = require('@supabase/supabase-js')
    const db = createClient(URL, KEY, { auth: { persistSession: false } })
    const { data, error } = await db
      .from('properties')
      .select('id, op, type, type_label, zone, city, price, beds, baths, area, title, published')
      .eq('published', true)
    if (error) throw error
    if (!data || data.length === 0) return fromJsonFallback('Supabase devolvió 0 filas')
    writeOut(data.map(compactFromRow), 'Supabase')
  } catch (e) {
    console.warn('⚠ No se pudo leer de Supabase (' + e.message + '). Uso JSON local.')
    fromJsonFallback('error Supabase')
  }
})()
