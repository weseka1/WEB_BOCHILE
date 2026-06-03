// Genera un catálogo COMPACTO (público) para que el cerebro de Camila (n8n + OpenAI)
// recomiende propiedades REALES sin inventar. Corre en cada build (ver package.json).
const fs = require('fs')
const path = require('path')

const src = path.join(__dirname, '..', 'src', 'data', 'properties.json')
const outDir = path.join(__dirname, '..', 'public', 'data')
const out = path.join(outDir, 'catalog.min.json')

const raw = JSON.parse(fs.readFileSync(src, 'utf8'))
const compact = raw.map((p) => ({
  id: p.id,
  op: p.op,                                   // sale | rent
  type: p.typeLabel,                          // Casa, Departamento, Lote...
  zone: p.zone,                               // barrio/zona para filtrar
  city: p.city,
  price: typeof p.price === 'number' ? p.price : null,  // USD o null ("Consulte precio")
  beds: p.beds ?? null,
  baths: p.baths ?? null,
  m2: p.area ?? null,
  title: p.title,
}))

fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(out, JSON.stringify(compact))
console.log(`catalog.min.json → ${compact.length} props · ${fs.statSync(out).size} bytes`)
console.log('keys muestra:', Object.keys(raw[0] || {}).join(', '))
