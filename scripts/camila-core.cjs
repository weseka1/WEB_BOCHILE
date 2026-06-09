'use strict';
/*
 * Núcleo PURO del cerebro de Camila web (sin n8n) — testeable con node.
 * Lo consume el nodo "Armar request" del workflow [BOCHILE] Camila chat web → OpenAI:
 * el build (_build_camila_node.cjs) toma estas funciones y las inyecta en el Code node.
 *
 * Objetivo de esta v2: arreglar el bug por el que el pre-filtro PERDÍA stock real
 * (ej. "depto en Bahía entre 600 y 800 mil USD" devolvía []). Causa raíz: los números
 * del RANGO de precio entraban al scoring de texto y envenenaban el ranking, expulsando
 * a Alem 127 (750k) y Torre Manantiales (680k). Fix: (1) parsear rango min/max, (2) sacar
 * los números de precio/ambientes del texto antes de tokenizar, (3) NUNCA descartar por
 * score 0 una prop que pasó los filtros duros (tipo/ciudad/precio).
 */

function norm(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function squash(s) { return norm(s).replace(/[^a-z0-9]/g, ''); }

// Barrios de Bahía Blanca que la gente efectivamente escribe (curado del catastro, 146 barrios).
// Uso: (a) si nombran un barrio, inferir que la consulta es de Bahía Blanca; (b) boostear
// props cuyo título lo mencione. El catálogo web no tiene geo, así que esto es por texto.
const BARRIOS = [
  'centro', 'microcentro', 'centro norte', 'centro sudeste', 'centro oeste',
  'universitario', 'palihue', 'a. palihue', 'paihuen', 'patagonia', 'aldea romana',
  'villa mitre', 'villa harding green', 'harding green', 'napostá', 'naposta',
  'barrio parque', 'parque de mayo', 'bella vista', 'villa rosas', 'rosas',
  'villa delfina', 'villa floresta', 'floresta', 'villa nocito', 'nocito',
  'villa muñiz', 'villa muniz', 'villa belgrano', 'nueva belgrano', 'kilometro 5',
  'km 5', 'ingeniero white', 'white', 'general cerri', 'gral cerri', 'cerri',
  'spurr', 'noroeste', 'pacifico', 'pacífico', 'san martin', 'san martín',
  'tiro federal', 'estacion sud', 'estación sud', 'altos del pinar', 'el palihue',
  'solares norte', 'los almendros', 'las canitas', 'las cañitas', 'novaterra',
  'portal del este', 'punta alta', 'colon', 'colón',
];
const BARRIOS_SET = new Set(BARRIOS.map(norm));

// Palabras a ignorar en el scoring de TEXTO (incluye términos de plata/ambientes,
// que no son señales de búsqueda sino parámetros ya parseados aparte).
const STOP = new Set([
  'me', 'mi', 'interesa', 'interesan', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas',
  'de', 'del', 'en', 'para', 'por', 'con', 'y', 'o', 'que', 'quiero', 'busco', 'buscando',
  'necesito', 'hola', 'tienen', 'tenes', 'tienes', 'hay', 'algo', 'alguna', 'algun', 'sobre',
  'propiedad', 'propiedades', 'info', 'informacion', 'cuanto', 'sale', 'vale', 'cuesta', 'es',
  'esta', 'estoy', 'al', 'veo', 'uno', 'ver', 'comprar', 'comprr', 'compra', 'venta', 'alquiler',
  'disponible', 'disponibles', 'quisiera', 'gustaria', 'zona', 'barrio',
  // plata / rango
  'entre', 'hasta', 'menos', 'mas', 'desde', 'tope', 'presupuesto', 'rango', 'maximo', 'minimo',
  'aprox', 'aproximadamente', 'mil', 'millon', 'millones', 'palo', 'palos', 'dolar', 'dolares',
  'usd', 'dolar', 'pesos', 'peso', 'precio', 'cerca',
  // ambientes
  'dorm', 'dormitorio', 'dormitorios', 'ambiente', 'ambientes', 'amb', 'habitacion', 'habitaciones',
  'cuarto', 'cuartos', 'bano', 'banos',
  // inglés frecuente
  'i', 'want', 'looking', 'for', 'the', 'an', 'of', 'in', 'do', 'you', 'have', 'about',
  'property', 'house', 'need', 'with', 'and', 'usd',
]);

// Convierte un número + unidad a monto. Ventas se hablan en miles de USD; alquileres en
// pesos/mes (cientos de miles, hasta millones). "600" suelto (en contexto precio) = 600.000;
// "200k"/"200 mil" = 200.000; "1 palo/millón" = 1.000.000; "1,5 millones" = 1.500.000.
function amount(numStr, unit) {
  unit = unit || '';
  if (/millon|palo|^m$/.test(unit)) {
    const s = String(numStr).replace(/\s/g, '');
    const f = /^\d+[.,]\d{1,2}$/.test(s) ? parseFloat(s.replace(',', '.')) : parseInt(s.replace(/[.,]/g, ''), 10);
    return Math.round((isNaN(f) ? 0 : f) * 1000000);
  }
  let n = parseInt(String(numStr).replace(/[.\s]/g, ''), 10);
  if (isNaN(n)) return null;
  if (/^k$|mil/.test(unit)) return n * 1000;
  if (n < 1000) return n * 1000; // dentro de una expresión de precio, "600" = 600 mil
  return n;
}

// Devuelve { min, max, spans:[strings de número usados como precio, para sacar del texto] }
function parsePrice(t) {
  // OJO con el orden: "millones" empieza con "mil", así que las unidades largas van PRIMERO
  // o el alternador corta en "mil" y pierde el factor millón.
  const U = '(millones|millon|palos|palo|mil|k)';
  const N = '(\\d[\\d.,]*)';
  const spans = [];
  let min = null, max = null;

  // Rango: "entre/de/desde A (u)? y/a/hasta B (u)?"
  let m = t.match(new RegExp('(?:entre|de|desde|rango(?:\\s+de)?)\\s+' + N + '\\s*' + U + '?\\s*(?:y|a|al|hasta)\\s+' + N + '\\s*' + U + '?'));
  if (m) {
    const u = m[4] || m[2];
    const a = amount(m[1], m[2] || u);
    const b = amount(m[3], m[4] || u);
    min = Math.min(a, b); max = Math.max(a, b);
    spans.push(m[1], m[3]);
    return { min, max, spans };
  }
  // Máximo: "hasta/menos de/tope/presupuesto/por debajo de/maximo/budget/under X (u)?"
  m = t.match(new RegExp('(?:hasta|menos de|menor a|tope(?:\\s+de)?|presupuesto(?:\\s+de)?|por debajo de|maximo(?:\\s+de)?|max|budget|under)\\s+' + N + '\\s*' + U + '?'));
  if (m) { max = amount(m[1], m[2]); spans.push(m[1]); }
  // Mínimo: "mas de/desde/a partir de/minimo/arriba de/over X (u)?"
  let m2 = t.match(new RegExp('(?:mas de|a partir de|minimo(?:\\s+de)?|arriba de|over)\\s+' + N + '\\s*' + U + '?'));
  if (m2) { min = amount(m2[1], m2[2]); spans.push(m2[1]); }
  // Monto suelto con unidad ("500 mil dolares", "200k", "1 palo")
  if (min == null && max == null) {
    let m3 = t.match(new RegExp(N + '\\s*' + U + '\\b'));
    if (m3) { max = amount(m3[1], m3[2]); spans.push(m3[1]); }
  }
  return { min, max, spans };
}

function detectBarrio(t) {
  for (const b of BARRIOS_SET) { if (t.includes(b)) return b; }
  return null;
}

// Núcleo: dado el catálogo completo + el mensaje (y contexto previo), devuelve hasta CAP
// candidatos REALES, ordenados por relevancia, garantizando no perder stock que cumple lo pedido.
function pickCandidates(catalog, msg, ctx) {
  const t = norm(msg) + (ctx ? ' ' + norm(ctx) : '');
  let res = catalog.slice();

  // ---- OPERACIÓN venta/alquiler (filtro duro) ----
  // CRÍTICO: el campo price mezcla monedas — ventas en USD, alquileres en ARS/mes. Si no separamos
  // por op, una consulta de compra en dólares matchea alquileres en pesos (mismos números, otra moneda).
  const rentWords = /(alquil|arriend|\brenta\b|\brento\b|\brentar\b|mensual|por mes|temporario)/.test(t);
  const saleWords = /(comprar|compra|\bventa\b|en venta|vender|adquirir|dueno|usd|u\$s|dolar|dolares)/.test(t);
  let opWanted = null;
  if (rentWords && !saleWords) opWanted = 'rent';
  else if (saleWords && !rentWords) opWanted = 'sale';
  else if (!rentWords && !saleWords) opWanted = 'sale'; // default: catálogo dominante (venta, 236 vs 17)
  if (opWanted) res = res.filter((p) => (p.op || 'sale') === opWanted);

  // ---- TIPO (filtro duro) ----
  if (/(depto|departamento|apartment|flat|semipiso|monoambiente|piso)/.test(t)) res = res.filter((p) => /departamento|ph/i.test(p.type || ''));
  else if (/duplex/.test(t)) res = res.filter((p) => /duplex/.test(norm(p.type)));
  else if (/(lote|terreno|land|lot)/.test(t)) res = res.filter((p) => /lote|terreno/i.test(p.type || ''));
  else if (/(local|oficina|office|comercial)/.test(t)) res = res.filter((p) => /local|oficina/i.test(p.type || ''));
  else if (/(galpon|deposito|warehouse)/.test(t)) res = res.filter((p) => /galp/i.test(norm(p.type)));
  else if (/(campo|chacra|field|farm)/.test(t)) res = res.filter((p) => /campo|chacra/i.test(p.type || ''));
  else if (/(casa|house|home|chalet|vivienda)/.test(t)) res = res.filter((p) => /casa/i.test(p.type || ''));

  // ---- CIUDAD / BARRIO (filtro duro) ----
  const barrio = detectBarrio(t);
  if (/monte hermoso/.test(t)) res = res.filter((p) => /monte hermoso/i.test(norm(p.city)));
  else if (/pehuen/.test(t)) res = res.filter((p) => /pehuen/i.test(norm(p.city)));
  else if (/sierra/.test(t)) res = res.filter((p) => /sierra/i.test(p.city || ''));
  else if (/la plata/.test(t)) res = res.filter((p) => /la plata/i.test(p.city || ''));
  else if (/bahia/.test(t) || barrio) res = res.filter((p) => /bahia blanca/.test(norm(p.city)));

  // ---- PRECIO (filtro duro) — respeta min Y max ----
  const price = parsePrice(t);
  if (price.min != null || price.max != null) {
    res = res.filter((p) => {
      if (p.price == null) return true; // "a consultar": candidato secundario, no se descarta
      if (price.min != null && p.price < price.min) return false;
      if (price.max != null && p.price > price.max) return false;
      return true;
    });
  }

  // ---- AMBIENTES (señal suave: ordena, no descarta) ----
  let bedsWanted = null;
  const mb = t.match(/(\d)\s*(?:dorm|dormitorio|amb|ambiente|habitac|cuarto|bed)/);
  if (mb) { bedsWanted = parseInt(mb[1], 10); price.spans.push(mb[1]); }

  // ---- TEXTO (señal blanda) — tokens SIN números de precio/ambientes ni palabras de plata ----
  const hasPriceConstraint = price.min != null || price.max != null;
  let clean = t;
  price.spans.forEach((s) => { clean = clean.split(s).join(' '); });
  let toks = [...new Set(clean.split(/[^a-z0-9]+/).filter((w) => w.length >= 2 && !STOP.has(w)))];

  // Descartar tokens UBICUOS: si un token aparece en >60% de los sobrevivientes, no discrimina
  // (es lo que ya garantizan los filtros duros, ej. "departamento"/"bahia"/"blanca" tras filtrar
  // tipo+ciudad). Dejarlos inflaría por igual a todos y enterraría los matches específicos.
  if (res.length >= 8 && toks.length) {
    const total = res.length;
    toks = toks.filter((w) => {
      let df = 0;
      for (const p of res) {
        if (norm((p.title || '') + ' ' + (p.zone || '') + ' ' + (p.city || '') + ' ' + (p.type || '')).includes(w)) df++;
      }
      return df / total < 0.6;
    });
  }

  const scoreOf = (p) => {
    const haySpaced = norm((p.title || '') + ' ' + (p.zone || '') + ' ' + (p.city || '') + ' ' + (p.type || ''));
    const haySquash = squash((p.title || '') + ' ' + (p.zone || ''));
    let s = 0;
    toks.forEach((w) => {
      if (haySpaced.includes(w)) s += (/^\d+$/.test(w) ? 2 : 1);
      if (w.length >= 4 && haySquash.includes(w)) s += (/\d/.test(w) ? 3 : 1);
    });
    if (barrio && haySpaced.includes(barrio)) s += 5;        // boost barrio mencionado
    if (bedsWanted != null && p.beds === bedsWanted) s += 2; // boost ambientes exactos
    // Si el usuario fijó precio, las props CON precio dentro del rango son lo más relevante;
    // las "a consultar" (sin precio) quedan como respaldo secundario.
    if (hasPriceConstraint && p.price != null) s += 3;
    return s;
  };

  const scored = res.map((p) => ({ p, s: scoreOf(p), priced: p.price != null ? 1 : 0 }));
  // Orden: score desc → con-precio antes que "a consultar" → desempate por precio.
  // Con rango pedido, priorizamos precio DESC (las de mayor categoría / cerca del tope, que suelen
  // ser las destacadas). Sin rango, precio ASC (más accesibles primero).
  // Clave del fix: TODO lo que pasó los filtros duros sigue en la lista aunque su score sea 0;
  // no se reemplaza la lista por "solo los que matchean texto" (ese era el bug original).
  scored.sort((a, b) => b.s - a.s || b.priced - a.priced ||
    (hasPriceConstraint ? ((b.p.price || 0) - (a.p.price || 0)) : ((a.p.price || 1e12) - (b.p.price || 1e12))));

  const CAP = 30;
  return scored.slice(0, CAP).map((x) => x.p);
}

module.exports = { norm, squash, parsePrice, detectBarrio, pickCandidates, BARRIOS };
