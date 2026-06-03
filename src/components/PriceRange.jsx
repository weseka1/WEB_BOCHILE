import { useEffect, useRef, useState } from 'react'

// Slider de presupuesto: dos manijas (min–max) arrastrables. Reemplaza el dropdown largo de rangos.
// Alto fijo: nunca estira el contenedor. Funciona con mouse y touch (pointer events).
export const PRICE_MAX = 1000000   // tope por defecto (venta, USD)
const STEP = 10000

export default function PriceRange({ lo, hi, onChange, anyLabel, upto, over, max = PRICE_MAX, step = STEP, currency = 'usd' }) {
  const fmt = (n) => currency === 'ars' ? '$ ' + n.toLocaleString('es-AR') + ' ARS' : 'US$ ' + n.toLocaleString('es-AR')
  const pct = (v) => (v / max) * 100
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const trackRef = useRef(null)
  const drag = useRef(null)
  const loRef = useRef(lo); loRef.current = lo
  const hiRef = useRef(hi); hiRef.current = hi

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onEsc)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onEsc) }
  }, [])

  const isAny = lo <= 0 && hi >= max
  const label = isAny ? anyLabel
    : lo <= 0 ? `${upto} ${fmt(hi)}`
    : hi >= max ? `${over} ${fmt(lo)}`
    : `${fmt(lo)} – ${fmt(hi)}`

  const valFromX = (clientX) => {
    const r = trackRef.current.getBoundingClientRect()
    const p = Math.max(0, Math.min(1, (clientX - r.left) / r.width))
    return Math.round((p * max) / step) * step
  }
  const onDown = (which) => (e) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = which
  }
  const onMove = (e) => {
    if (!drag.current) return
    const v = valFromX(e.clientX)
    if (drag.current === 'lo') onChange(Math.min(v, hiRef.current - step), hiRef.current)
    else onChange(loRef.current, Math.max(v, loRef.current + step))
  }
  const onUp = () => { drag.current = null }
  const onKey = (which) => (e) => {
    const d = e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -step : e.key === 'ArrowRight' || e.key === 'ArrowUp' ? step : 0
    if (!d) return
    e.preventDefault()
    if (which === 'lo') onChange(Math.max(0, Math.min(lo + d, hi - step)), hi)
    else onChange(lo, Math.min(max, Math.max(hi + d, lo + step)))
  }

  return (
    <div className={'dd pr' + (open ? ' open' : '')} ref={ref}>
      <button type="button" className={'dd-btn' + (isAny ? ' placeholder' : '')} data-cursor onClick={() => setOpen((o) => !o)}>
        <span>{label}</span><span className="car" />
      </button>
      {open && (
        <div className="pr-panel">
          <div className="pr-vals">
            <span>{fmt(Math.max(0, lo))}</span>
            <span>{hi >= max ? fmt(max) + '+' : fmt(hi)}</span>
          </div>
          <div className="pr-track" ref={trackRef}>
            <div className="pr-fill" style={{ left: pct(lo) + '%', right: (100 - pct(hi)) + '%' }} />
            <button type="button" className="pr-thumb" style={{ left: pct(lo) + '%' }} aria-label="Precio mínimo"
              onPointerDown={onDown('lo')} onPointerMove={onMove} onPointerUp={onUp} onKeyDown={onKey('lo')} />
            <button type="button" className="pr-thumb" style={{ left: pct(hi) + '%' }} aria-label="Precio máximo"
              onPointerDown={onDown('hi')} onPointerMove={onMove} onPointerUp={onUp} onKeyDown={onKey('hi')} />
          </div>
          <button type="button" className="pr-reset" data-cursor onClick={() => onChange(0, max)}>{anyLabel}</button>
        </div>
      )}
    </div>
  )
}
