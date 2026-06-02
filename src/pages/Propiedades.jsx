import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PROPERTIES, wa } from '../data/properties'
import { useLang } from '../i18n'
import PropertyCard from '../components/PropertyCard'
import Dropdown from '../components/Dropdown'

const PAGE = 9
const ZONES = [...new Set(PROPERTIES.map((p) => p.zone))]
const TYPES = [...new Set(PROPERTIES.map((p) => p.type))]
// Rangos de precio con PISO y TECHO (un "desde–hasta", no un "hasta" que arrastra las baratas).
const PRICE_RANGES = [
  { value: '0-100000',        min: 0,       max: 100000 },
  { value: '100000-150000',   min: 100000,  max: 150000 },
  { value: '150000-200000',   min: 150000,  max: 200000 },
  { value: '200000-300000',   min: 200000,  max: 300000 },
  { value: '300000-500000',   min: 300000,  max: 500000 },
  { value: '500000-750000',   min: 500000,  max: 750000 },
  { value: '750000-1000000',  min: 750000,  max: 1000000 },
  { value: '1000000-',        min: 1000000, max: Infinity },
]
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export default function Propiedades() {
  const { t } = useLang()
  const [sp, setSp] = useSearchParams()
  const op = sp.get('op') || 'sale'
  const [type, setType] = useState('')
  const [zone, setZone] = useState('')
  const [price, setPrice] = useState('')
  const [q, setQ] = useState('')
  const [shown, setShown] = useState(PAGE)

  useEffect(() => { window.scrollTo(0, 0) }, [])
  const setOp = (v) => { sp.set('op', v); setSp(sp, { replace: true }); setShown(PAGE) }

  const filtered = useMemo(() => {
    const range = price ? PRICE_RANGES.find((r) => r.value === price) : null
    return PROPERTIES.filter((p) => p.op === op)
      .filter((p) => (type ? p.type === type : true))
      .filter((p) => (zone ? p.zone === zone : true))
      // Precio por rango: respeta piso Y techo. Las "Consulte precio" (sin price) quedan fuera al filtrar por precio.
      .filter((p) => (range ? (p.price != null && p.price >= range.min && p.price <= range.max) : true))
      .filter((p) => (q ? norm(`${p.title} ${p.location} ${p.zone} ${p.type}`).includes(norm(q)) : true))
  }, [op, type, zone, price, q])

  const fmt = (n) => 'US$ ' + n.toLocaleString('es-AR')
  const priceLabel = (r) => {
    if (r.min === 0) return `${t.cat.upto} ${fmt(r.max)}`        // Hasta US$ 100.000
    if (r.max === Infinity) return `${t.cat.over} ${fmt(r.min)}`  // Más de US$ 1.000.000
    return `${fmt(r.min)} – ${fmt(r.max)}`                        // US$ 750.000 – 1.000.000
  }

  const typeOpts = [{ value: '', label: t.cat.alltypes }, ...TYPES.map((x) => ({ value: x, label: x }))]
  const zoneOpts = [{ value: '', label: t.cat.allzones }, ...ZONES.map((x) => ({ value: x, label: x }))]
  const priceOpts = [{ value: '', label: t.cat.anyprice }, ...PRICE_RANGES.map((r) => ({ value: r.value, label: priceLabel(r) }))]

  return (
    <div className="catalog">
      <div className="cat-head">
        <div className="cat-kicker">{t.cat.kicker}</div>
        <h1 className="cat-title">{t.cat.title}</h1>
        <p className="cat-sub">{t.cat.sub}</p>
      </div>

      <div className="filters">
        <div className="seg">
          <button className={op === 'sale' ? 'on' : ''} data-cursor onClick={() => setOp('sale')}>{t.cat.sale}</button>
          <button className={op === 'rent' ? 'on' : ''} data-cursor onClick={() => setOp('rent')}>{t.cat.rent}</button>
        </div>
        <Dropdown value={type} onChange={(v) => { setType(v); setShown(PAGE) }} options={typeOpts} placeholder={t.cat.alltypes} />
        <Dropdown value={zone} onChange={(v) => { setZone(v); setShown(PAGE) }} options={zoneOpts} placeholder={t.cat.allzones} />
        <Dropdown value={price} onChange={(v) => { setPrice(v); setShown(PAGE) }} options={priceOpts} placeholder={t.cat.anyprice} />
        <input className="fsearch" value={q} onChange={(e) => { setQ(e.target.value); setShown(PAGE) }} placeholder={t.cat.search} data-cursor />
        {filtered.length > 0 && <span className="count">{filtered.length} {t.cat.results}</span>}
      </div>

      {filtered.length === 0 ? (
        op === 'rent' ? (
          <div className="cat-empty">
            <h3 className="cat-empty-h">{t.cat.rentEmpty}</h3>
            <p>{t.cat.rentEmptySub}</p>
            <div><a className="pill green" data-cursor target="_blank" rel="noopener"
              href={wa('Hola, estoy buscando una propiedad en alquiler en Bahía Blanca. ¿Me pueden ayudar?')}>{t.nav.wa}</a></div>
          </div>
        ) : (
          <div className="cat-empty">
            {t.cat.none}
            <div><a className="pill green" data-cursor target="_blank" rel="noopener"
              href={wa('Hola, estoy buscando una propiedad y no la encuentro en la web. ¿Me pueden ayudar?')}>{t.nav.wa}</a></div>
          </div>
        )
      ) : (
        <>
          <div className="pgrid">
            {filtered.slice(0, shown).map((p) => <PropertyCard key={p.id} p={p} />)}
          </div>
          {shown < filtered.length && (
            <div className="loadmore">
              <button data-cursor onClick={() => setShown((s) => s + PAGE)}>{t.cat.more} ({filtered.length - shown})</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
