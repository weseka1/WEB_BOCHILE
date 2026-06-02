// "Cerebro" local de Camila Virtual — intención + búsqueda por texto/dirección + filtros, sobre las props reales.
// Arquitectura lista para upgrade: reemplazar camilaReply() por una llamada al backend/Claude API.
import { PROPERTIES, fmtPrice } from '../data/properties'

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

const STOP = new Set(['me', 'mi', 'interesa', 'interesan', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'en', 'para', 'por', 'con', 'y', 'o', 'que', 'quiero', 'busco', 'buscando', 'necesito', 'hola', 'tienen', 'tenes', 'hay', 'algo', 'alguna', 'algun', 'sobre', 'propiedad', 'propiedades', 'info', 'informacion', 'cuanto', 'sale', 'vale', 'es', 'esta', 'estoy', 'al', 'a', 'i', 'want', 'looking', 'for', 'the', 'a', 'an', 'of', 'in', 'do', 'you', 'have', 'about', 'property', 'house', 'me', 'need'])

// precio máximo SOLO con señal explícita (no agarra números sueltos como "274" = dirección)
function parseMaxPrice(t) {
  const km = t.match(/(\d{2,4})\s*(k|mil)\b/)
  if (km) return parseInt(km[1], 10) * 1000
  const hasCue = /(hasta|menos|presupuesto|tope|por debajo|máximo|maximo|budget|under|max|\$|u\$s|usd|dolar|dólar)/.test(t)
  if (hasCue) {
    const m = t.replace(/[.\s]/g, '').match(/(\d{3,7})/)
    if (m) { let v = parseInt(m[1], 10); if (v < 1000) v *= 1000; return v }
  }
  return null
}

function tokens(t) {
  return [...new Set(t.split(/[^a-z0-9áéíóúñ]+/i).map(norm).filter((w) => w.length >= 2 && !STOP.has(w)))]
}

export function camilaReply(input, lang = 'es') {
  const t = norm(input)
  const EN = lang === 'en'
  const L = (es, en) => (EN ? en : es)

  if (/^(hola|buenas|hi|hello|hey|buen dia|buenos)\b/.test(t) && t.length < 16) {
    return {
      text: L('¡Hola! Soy Camila 👋 Decime qué buscás: zona, tipo (casa o depto), una calle o tu presupuesto. Ej: "depto en el centro hasta 150k" o "Colón 274".',
        'Hi! I’m Camila 👋 Tell me what you’re after: area, type, a street or your budget. e.g. "apartment downtown under 150k" or "Colón 274".'),
      chips: EN ? ['By the sea', 'Investment', 'Downtown', 'Up to 200k'] : ['Frente al mar', 'Inversión', 'Centro', 'Hasta 200k'],
    }
  }
  if (/(tasa|valuar|cuanto vale mi|valuation|apprais|worth)/.test(t)) {
    return { text: L('¡Genial! Hacemos tasación profesional sin cargo. Tocá "Tasación" y coordinamos por WhatsApp, o pasame tipo y zona.',
      'Great! We offer a free professional valuation. Tap "Valuation" and we’ll arrange it on WhatsApp, or send me the type and area.'), goto: '#tasacion' }
  }

  // ---- filtros explícitos ----
  let res = PROPERTIES.slice()
  const crit = []
  if (/(depto|departamento|apartment|flat)/.test(t)) { res = res.filter((p) => p.type === 'Departamento' || p.type === 'PH'); crit.push(L('departamentos', 'apartments')) }
  else if (/(duplex|dúplex)/.test(t)) { res = res.filter((p) => p.type === 'Dúplex'); crit.push('dúplex') }
  else if (/(lote|terreno|land|lot)/.test(t)) { res = res.filter((p) => p.type === 'Lote / Terreno'); crit.push(L('lotes', 'lots')) }
  else if (/(local|oficina|office|comercial)/.test(t)) { res = res.filter((p) => p.type === 'Local' || p.type === 'Oficina'); crit.push(L('locales/oficinas', 'retail/office')) }
  else if (/(galpon|galpón|depósito|deposito|warehouse)/.test(t)) { res = res.filter((p) => p.type === 'Galpón'); crit.push(L('galpones', 'warehouses')) }
  else if (/(campo|field|farm)/.test(t)) { res = res.filter((p) => p.type === 'Campo'); crit.push(L('campos', 'fields')) }
  else if (/(casa|house|home|chalet)/.test(t)) { res = res.filter((p) => p.type === 'Casa'); crit.push(L('casas', 'houses')) }

  if (/monte hermoso/.test(t)) { res = res.filter((p) => p.city === 'Monte Hermoso'); crit.push('Monte Hermoso') }
  else if (/pehuen|pehuén/.test(t)) { res = res.filter((p) => p.city === 'Pehuen Co'); crit.push('Pehuen Co') }
  else if (/sierra/.test(t)) { res = res.filter((p) => p.city === 'Sierra de la Ventana'); crit.push('Sierra de la Ventana') }
  else if (/bah[ií]a blanca\b/.test(t)) { res = res.filter((p) => p.city === 'Bahía Blanca'); crit.push('Bahía Blanca') }

  if (/(mar|playa|sea|beach|costa|dunas|frente al mar)/.test(t)) {
    res = res.filter((p) => /mar|playa|dunas|sauce|costaner|monte hermoso|pehuen/i.test(norm(p.title + ' ' + p.location + ' ' + (p.address || '')))); crit.push(L('cerca del mar', 'near the sea'))
  }
  if (/(invers|invest|renta|pozo|rentab)/.test(t)) {
    res = res.filter((p) => /invers|renta|pozo|oficina|local|galpon|profesional|comercial/i.test(norm(p.title + ' ' + p.type))); crit.push(L('para invertir', 'for investment'))
  }
  const maxP = parseMaxPrice(t)
  if (maxP) { res = res.filter((p) => p.price && p.price <= maxP); crit.push(L(`hasta ${fmtPrice(maxP)}`, `up to ${fmtPrice(maxP)}`)) }

  // ---- búsqueda por texto / dirección (calle, barrio, nombre) ----
  const toks = tokens(t)
  if (toks.length) {
    const scored = res.map((p) => {
      const hay = norm(`${p.title} ${p.address || ''} ${p.location} ${p.barrio || ''} ${p.type}`)
      let s = 0
      toks.forEach((w) => { if (hay.includes(w)) s += (/^\d+$/.test(w) ? 3 : 1) }) // un número que matchea (altura) pesa más
      return { p, s }
    })
    const hits = scored.filter((x) => x.s > 0)
    if (hits.length) res = hits.sort((a, b) => b.s - a.s).map((x) => x.p)
  }

  const critTxt = crit.length ? ' (' + crit.join(', ') + ')' : ''
  if (res.length === 0) {
    return {
      text: L(`No tengo nada cargado con eso${critTxt} ahora mismo, pero la cartera cambia seguido. ¿Te aviso por WhatsApp apenas entre algo?`,
        `I don’t have anything matching${critTxt} right now, but our portfolio changes often. Want me to ping you on WhatsApp as soon as something comes in?`),
      wa: true,
    }
  }
  const top = res.slice(0, 3)
  return {
    text: L(`Encontré ${res.length === 1 ? 'esto' : (res.length > 3 ? res.length + ' opciones, te muestro las mejores' : res.length + ' opciones')}${critTxt} 👇 Tocá una para ver fotos, descripción y ubicación.`,
      `Found ${res.length === 1 ? 'this' : (res.length > 3 ? res.length + ' options, here are the best' : res.length + ' options')}${critTxt} 👇 Tap one to see photos, description and location.`),
    props: top.map((p) => p.id),
  }
}
