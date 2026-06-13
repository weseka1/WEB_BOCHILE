/* eslint-disable no-console */
// Pre-renderiza un HTML por propiedad con SUS propios Open Graph tags, para que el
// preview al compartir el link (WhatsApp, Instagram, Facebook) muestre la FOTO y el
// TÍTULO de ESA propiedad — no el genérico de la home.
//
// Por qué: la web es una SPA. Los crawlers sociales leen el HTML crudo sin ejecutar
// JS, y todas las rutas servían el mismo index.html → preview genérico para todo.
// Acá copiamos el index.html YA buildeado y le inyectamos los meta tags de cada
// propiedad en dist/propiedad/<slug>/index.html. Render sirve esos archivos reales
// ANTES del rewrite SPA (los archivos que existen no caen en index.html), así que el
// crawler ve los tags correctos y el usuario igual entra a la SPA normal.
//
// Corre DESPUÉS de `vite build` (ver package.json). Si no hay credenciales o falla
// Supabase, NO rompe el build: simplemente no pre-renderiza (queda el genérico).
const fs = require('fs')
const path = require('path')

// mini cargador de .env (en Render las vars ya vienen en process.env)
;(function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
  }
})()

const SITE = 'https://bochile.com'
// Logo de marca para la miniatura del preview (pedido de Cami: la imagen va con el logo).
// Si existe el archivo en public/og/, TODAS las propiedades usan el logo; si no, cae a la
// foto de cada propiedad (así nunca queda roto). Acepta .jpg / .png / .jpeg.
const ogDir = path.join(__dirname, '..', 'public', 'og')
// Detecta el logo: prefiere bochile-og.* ; si no, CUALQUIER imagen png/jpg que haya en
// public/og/ (así alcanza con SOLTAR el archivo ahí, sin importar el nombre).
const LOGO_NAME = (fs.existsSync(ogDir) ? fs.readdirSync(ogDir) : [])
  .filter((f) => /\.(jpe?g|png)$/i.test(f))
  .sort((a, b) => (/^bochile-og\./i.test(b) ? 1 : 0) - (/^bochile-og\./i.test(a) ? 1 : 0))[0] || null
const USE_LOGO = !!LOGO_NAME
const LOGO_URL = SITE + '/og/' + encodeURIComponent(LOGO_NAME || 'bochile-og.jpg')
const FALLBACK_IMG = USE_LOGO ? LOGO_URL : SITE + '/assets/hero/exterior.jpg'
const distDir = path.join(__dirname, '..', 'dist')
const tplPath = path.join(distDir, 'index.html')
const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const fmtPrice = (p) => {
  if (p.price != null && !Number.isNaN(Number(p.price))) {
    const n = Number(p.price).toLocaleString('es-AR')
    return p.op === 'rent' ? `$ ${n} ARS` : `US$ ${n}`
  }
  return p.price_text || 'Consultar precio'
}

const abs = (u) => (!u ? '' : (/^https?:\/\//i.test(u) ? u : SITE + (u.startsWith('/') ? '' : '/') + u))

function metaFor(p) {
  const title = `${(p.title || 'Propiedad').trim()} · Bochile Real Estate`
  const label = p.type_label || p.type || ''
  const loc = p.city || p.address || 'Bahía Blanca'
  const area = p.area_total != null ? p.area_total : p.area
  // Descripción = specs limpias (NO el texto crudo importado, que viene con emojis y
  // mayúsculas y queda feo). Ej: "US$ 250.000 · Departamento · 67.5 m² · 2 dorm · Bahía Blanca".
  const desc = [
    fmtPrice(p),
    label,
    area != null ? `${area} m²` : '',
    p.beds != null ? `${p.beds} dorm` : '',
    loc,
  ].filter(Boolean).join(' · ')
  const images = Array.isArray(p.images) ? p.images : []
  const image = USE_LOGO ? LOGO_URL : (abs(p.main_image || images[0] || '') || FALLBACK_IMG)
  const url = `${SITE}/propiedad/${encodeURIComponent(p.slug)}`
  return { title, desc, image, url }
}

// Reemplazos con función (NO string) para que un "$" en el contenido —ej. "US$ 250.000"—
// no se interprete como backreference de regex.
function inject(html, m) {
  const setMeta = (h, attr, key, val) =>
    h.replace(new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`, 'i'), (_, a, b) => a + esc(val) + b)
  let h = html.replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${esc(m.title)}</title>`)
  h = setMeta(h, 'name', 'description', m.desc)
  h = setMeta(h, 'property', 'og:title', m.title)
  h = setMeta(h, 'property', 'og:description', m.desc)
  h = setMeta(h, 'property', 'og:url', m.url)
  h = setMeta(h, 'property', 'og:image', m.image)
  h = setMeta(h, 'property', 'og:image:alt', m.title)
  h = setMeta(h, 'name', 'twitter:title', m.title)
  h = setMeta(h, 'name', 'twitter:description', m.desc)
  h = setMeta(h, 'name', 'twitter:image', m.image)
  return h
}

;(async () => {
  if (!fs.existsSync(tplPath)) { console.warn('⚠ prerender-og: no existe dist/index.html (¿corriste vite build?). Skip.'); return }
  if (!URL || !KEY) { console.warn('⚠ prerender-og: sin credenciales Supabase. Skip (queda el preview genérico).'); return }
  let rows
  try {
    const { createClient } = require('@supabase/supabase-js')
    const db = createClient(URL, KEY, { auth: { persistSession: false } })
    const { data, error } = await db.from('properties')
      .select('slug, title, op, type, type_label, price, price_text, city, address, area, area_total, beds, images, main_image')
      .eq('published', true)
    if (error) throw error
    rows = data || []
  } catch (e) {
    console.warn('⚠ prerender-og: no se pudo leer Supabase (' + e.message + '). Skip.')
    return
  }
  const tpl = fs.readFileSync(tplPath, 'utf8')
  let ok = 0, skip = 0
  for (const p of rows) {
    const slug = (p.slug || '').trim()
    if (!slug || slug.includes('/')) { skip++; continue }   // sin slug o slug raro → omitir
    const dir = path.join(distDir, 'propiedad', slug)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'index.html'), inject(tpl, metaFor(p)))
    ok++
  }
  console.log(`prerender-og → ${ok} HTML por propiedad · imagen: ${USE_LOGO ? 'LOGO de marca (' + LOGO_NAME + ')' : 'foto de cada propiedad'}${skip ? ` · ${skip} omitidas` : ''}`)
})()
