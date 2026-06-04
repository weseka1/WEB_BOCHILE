import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { wa, waTo } from '../data/properties'
import { useProperties } from '../lib/PropertiesProvider'
import { useLang } from '../i18n'
import PropertyCard from '../components/PropertyCard'
import Dropdown from '../components/Dropdown'
import PriceRange from '../components/PriceRange'

const PAGE = 9
const SALE_MAX = 1000000     // venta: tope del slider en USD
const RENT_MAX = 63900000    // alquiler: tope del slider en ARS ($63.900.000)
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export default function Propiedades() {
  const { t } = useLang()
  const { properties: PROPERTIES, catalog: CATALOG, loading } = useProperties()
  const ZONES = useMemo(() => [...new Set(PROPERTIES.map((p) => p.zone))], [PROPERTIES])
  const TYPES = useMemo(() => [...new Set(PROPERTIES.map((p) => p.type))], [PROPERTIES])
  const [sp, setSp] = useSearchParams()
  const op = sp.get('op') || 'sale'
  const priceMax = op === 'rent' ? RENT_MAX : SALE_MAX
  const priceStep = op === 'rent' ? 100000 : 10000
  const currency = op === 'rent' ? 'ars' : 'usd'
  const [type, setType] = useState(sp.get('type') || '')   // permite deep-link desde "Empresas" (?type=Galpón)
  const [zone, setZone] = useState('')
  const [lo, setLo] = useState(0)
  const [hi, setHi] = useState(priceMax)
  const [pozo, setPozo] = useState(false)
  const [q, setQ] = useState('')
  const [shown, setShown] = useState(PAGE)

  useEffect(() => { window.scrollTo(0, 0) }, [])
  const setOp = (v) => { sp.set('op', v); setSp(sp, { replace: true }); setShown(PAGE); setLo(0); setHi(v === 'rent' ? RENT_MAX : SALE_MAX) }

  const filtered = useMemo(() => {
    const hasPrice = lo > 0 || hi < priceMax
    return CATALOG.filter((p) => p.op === op)
      .filter((p) => (type ? p.type === type : true))
      .filter((p) => (zone ? p.zone === zone : true))
      .filter((p) => (pozo ? p.pozo : true))
      // Precio por rango del slider: respeta piso Y techo. Las "Consulte precio" (sin price) quedan fuera al filtrar por precio.
      .filter((p) => (!hasPrice ? true : (p.price != null && p.price >= lo && (hi >= priceMax || p.price <= hi))))
      .filter((p) => (q ? norm(`${p.title} ${p.location} ${p.zone} ${p.type}`).includes(norm(q)) : true))
  }, [CATALOG, op, type, zone, pozo, lo, hi, q, priceMax])

  const typeOpts = [{ value: '', label: t.cat.alltypes }, ...TYPES.map((x) => ({ value: x, label: x }))]
  const zoneOpts = [{ value: '', label: t.cat.allzones }, ...ZONES.map((x) => ({ value: x, label: x }))]

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
        <button type="button" className={'ftoggle' + (pozo ? ' on' : '')} data-cursor aria-pressed={pozo}
          onClick={() => { setPozo((v) => !v); setShown(PAGE) }}>
          <span className="ftoggle-dot" aria-hidden="true" />{t.cat.pozo}
        </button>
        <PriceRange lo={lo} hi={hi} onChange={(a, b) => { setLo(a); setHi(b); setShown(PAGE) }} anyLabel={t.cat.anyprice} upto={t.cat.upto} over={t.cat.over} max={priceMax} step={priceStep} currency={currency} />
        <input className="fsearch" value={q} onChange={(e) => { setQ(e.target.value); setShown(PAGE) }} placeholder={t.cat.search} data-cursor />
        {filtered.length > 0 && <span className="count">{filtered.length} {t.cat.results}</span>}
      </div>

      {loading && filtered.length === 0 ? (
        <div className="pgrid">
          {Array.from({ length: PAGE }).map((_, i) => <div key={i} className="skel-card" aria-hidden="true" />)}
        </div>
      ) : filtered.length === 0 ? (
        op === 'rent' ? (
          <div className="cat-empty">
            <h3 className="cat-empty-h">{t.cat.rentEmpty}</h3>
            <p>{t.cat.rentEmptySub}</p>
            <div><a className="pill green" data-cursor target="_blank" rel="noopener"
              href={waTo('alquileres', 'Hola, estoy buscando una propiedad en alquiler en Bahía Blanca. ¿Me pueden ayudar?')}>{t.nav.wa}</a></div>
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
