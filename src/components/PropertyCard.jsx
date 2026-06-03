import { useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { fmtPrice } from '../data/properties'
import { useLang } from '../i18n'

export default function PropertyCard({ p }) {
  const { t } = useLang()
  const ref = useRef(null)
  const beds = p.type === 'Departamento' || p.type === 'PH' ? 'amb.' : 'dorm.'

  // Tilt 3D + luz que sigue el cursor (futurista).
  const onMove = (e) => {
    const el = ref.current; if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    el.style.setProperty('--mx', `${(px + 0.5) * 100}%`)
    el.style.setProperty('--my', `${(py + 0.5) * 100}%`)
    gsap.to(el, { rotateY: px * 9, rotateX: -py * 9, duration: 0.5, ease: 'power2.out', transformPerspective: 900, transformOrigin: 'center' })
  }
  const onLeave = () => { gsap.to(ref.current, { rotateY: 0, rotateX: 0, duration: 0.7, ease: 'power3.out' }) }

  return (
    <article className="pcard" ref={ref} data-cursor onMouseMove={onMove} onMouseLeave={onLeave}>
      <Link className="pcard-link" to={`/propiedad/${p.slug}`} aria-label={p.title} />
      <span className="pcard-sheen" aria-hidden="true" />
      <span className="pcard-corner tl" aria-hidden="true" /><span className="pcard-corner tr" aria-hidden="true" />
      <span className="pcard-corner bl" aria-hidden="true" /><span className="pcard-corner br" aria-hidden="true" />
      <div className="pcard-img">
        <img src={p.img} alt={p.title} loading="lazy" referrerPolicy="no-referrer" />
        <div className="pcard-tags">
          <span className="pcard-op">{p.op === 'sale' ? t.cat.sale : t.cat.rent}</span>
          {p.pozo && <span className="pcard-pozo">{t.cat.pozo}</span>}
          <span className="pcard-badge">{p.badge}</span>
        </div>
        {p.images.length > 1 && <span className="pcard-photos">⊞ {p.images.length}</span>}
      </div>
      <div className="pcard-body">
        <div className="pcard-price">{fmtPrice(p)}</div>
        <div className="pcard-name">{p.title}</div>
        <div className="pcard-loc">◦ {p.location}{p.address ? ' · ' + p.address : ''}</div>
        <div className="pcard-specs">
          {p.beds != null && <div><b>{p.beds}</b>{beds}</div>}
          {p.area != null && <div><b>{p.area} m²</b>sup.</div>}
          <div><b>{p.type}</b>tipo</div>
        </div>
        <div className="pcard-cta">{t.props.hint}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </div>
      </div>
    </article>
  )
}
