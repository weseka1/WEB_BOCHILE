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
const RENT_MAX = 1500000     // alquiler: tope del slider en ARS ($1.500.000). Los alquileres reales hoy van $480k–$750k; deja headroom para inflación. El que pase de ahí cae en el tramo "Más de …".
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const WaIcon = () => (<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.601 5.391l-.998 3.648 3.896-.738zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>)

export default function Propiedades() {
  const { t } = useLang()
  const { properties: PROPERTIES, catalog: CATALOG, loading } = useProperties()
  const ZONES = useMemo(() => [...new Set(PROPERTIES.map((p) => p.zone))], [PROPERTIES])
  const TYPES = useMemo(() => [...new Set(PROPERTIES.map((p) => p.type))], [PROPERTIES])
  const [sp, setSp] = useSearchParams()
  const op = sp.get('op') || 'sale'
  const priceMax = op === 'rent' ? RENT_MAX : SALE_MAX
  const priceStep = op === 'rent' ? 50000 : 10000
  const currency = op === 'rent' ? 'ars' : 'usd'
  const [type, setType] = useState(sp.get('type') || '')   // permite deep-link desde "Empresas" (?type=Galpón)
  const [zone, setZone] = useState('')
  const [beds, setBeds] = useState(sp.get('beds') || '')   // dormitorios mínimos (1+, 2+, 3+, 4+); permite deep-link ?beds=2
  const [lo, setLo] = useState(0)
  const [hi, setHi] = useState(priceMax)
  const [pozo, setPozo] = useState(false)
  const [credito, setCredito] = useState(sp.get('credito') === '1')
  const [q, setQ] = useState('')
  const [shown, setShown] = useState(PAGE)

  useEffect(() => { window.scrollTo(0, 0) }, [])
  const setOp = (v) => { sp.set('op', v); setSp(sp, { replace: true }); setShown(PAGE); setLo(0); setHi(v === 'rent' ? RENT_MAX : SALE_MAX) }

  const filtered = useMemo(() => {
    const hasPrice = lo > 0 || hi < priceMax
    return CATALOG.filter((p) => p.op === op)
      .filter((p) => (type ? p.type === type : true))
      .filter((p) => (zone ? p.zone === zone : true))
      .filter((p) => {
        if (!beds) return true
        if (beds === 'mono') return p.beds === 0 || /monoambiente/i.test(p.title || '')   // monoambiente: 0 dorm o lo dice el título
        if (beds === '4') return p.beds != null && p.beds >= 4                              // "4 o más"
        return p.beds === Number(beds)                                                      // exacto (1, 2, 3)
      })
      .filter((p) => (pozo ? p.pozo : true))
      .filter((p) => (credito ? p.aptoCredito : true))
      // Precio por rango del slider: respeta piso Y techo. Las "Consulte precio" (sin price) quedan fuera al filtrar por precio.
      .filter((p) => (!hasPrice ? true : (p.price != null && p.price >= lo && (hi >= priceMax || p.price <= hi))))
      // Buscador "ampliado": matchea por dirección, título, barrio, zona, ciudad y tipo.
      // Por PALABRAS (cada término debe aparecer, sin importar el orden) → "Alsina 605" o "sarmiento depto" caen igual.
      .filter((p) => {
        if (!q) return true
        const hay = norm([p.title, p.address, p.location, p.barrio, p.zone, p.city, p.type].filter(Boolean).join(' '))
        return norm(q).split(/\s+/).filter(Boolean).every((w) => hay.includes(w))
      })
  }, [CATALOG, op, type, zone, beds, pozo, credito, lo, hi, q, priceMax])

  // ¿Hay algún filtro activo? Sirve para distinguir "no hay match con tus filtros" de "no hay nada cargado".
  const anyFilter = !!(type || zone || beds || pozo || credito || q.trim() || lo > 0 || hi < priceMax)

  const typeOpts = [{ value: '', label: t.cat.alltypes }, ...TYPES.map((x) => ({ value: x, label: x }))]
  const zoneOpts = [{ value: '', label: t.cat.allzones }, ...ZONES.map((x) => ({ value: x, label: x }))]
  const bedsOpts = [{ value: '', label: t.cat.beds }, ...t.cat.bedsOpts.map((o) => ({ value: o.v, label: o.l }))]

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
        <Dropdown value={beds} onChange={(v) => { setBeds(v); setShown(PAGE) }} options={bedsOpts} placeholder={t.cat.beds} />
        <button type="button" className={'ftoggle' + (pozo ? ' on' : '')} data-cursor aria-pressed={pozo}
          onClick={() => { setPozo((v) => !v); setShown(PAGE) }}>
          <span className="ftoggle-dot" aria-hidden="true" />{t.cat.pozo}
        </button>
        <button type="button" className={'ftoggle' + (credito ? ' on' : '')} data-cursor aria-pressed={credito}
          onClick={() => { setCredito((v) => !v); setShown(PAGE) }}>
          <span className="ftoggle-dot" aria-hidden="true" />{t.cat.credito}
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
            <h3 className="cat-empty-h">{anyFilter ? t.cat.rentNoMatch : t.cat.rentEmpty}</h3>
            <p>{anyFilter ? t.cat.rentNoMatchSub : t.cat.rentEmptySub}</p>
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
