import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import gsap from 'gsap'
import { fmtPrice } from '../data/properties'
import { useProperties } from '../lib/PropertiesProvider'
import { useLang } from '../i18n'

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

function search(props, q) {
  const t = norm(q.trim())
  if (!t) return []
  return props.filter((p) => norm(`${p.title} ${p.location} ${p.zone} ${p.type} ${p.badge}`).includes(t)).slice(0, 4)
}

export default function HeroConcierge({ start }) {
  const { t } = useLang()
  const { properties } = useProperties()
  const navigate = useNavigate()
  const sect = useRef(null)
  const bg = useRef(null)
  const [q, setQ] = useState('')
  const [focus, setFocus] = useState(false)
  const results = q ? search(properties, q) : []

  // entrada + parallax mouse
  useEffect(() => {
    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5)
      const y = (e.clientY / window.innerHeight - 0.5)
      gsap.to(bg.current, { x: x * -26, y: y * -18, duration: 0.8, ease: 'power3.out' })
    }
    if (window.matchMedia('(hover:hover)').matches) window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  useEffect(() => {
    if (!start) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
      tl.from(bg.current, { scale: 1.18, duration: 1.7, ease: 'power3.out' }, 0)
        .from('.hx-eyebrow', { opacity: 0, y: 16, duration: 0.7 }, 0.25)
        .from('.hx-title b', { yPercent: 110, opacity: 0, duration: 1.0, stagger: 0.12 }, 0.35)
        .from('.hx-sub', { opacity: 0, y: 18, duration: 0.7 }, 0.6)
        .from('.hx-search', { opacity: 0, y: 22, duration: 0.8 }, 0.75)
        .from('.hx-chip', { opacity: 0, y: 12, duration: 0.5, stagger: 0.06 }, 0.9)
        .from('.hx-live, .hx-corner, .hx-cue', { opacity: 0, duration: 0.6, stagger: 0.05 }, 1.0)
    }, sect)
    return () => ctx.revert()
  }, [start])

  const go = () => navigate('/propiedades')
  const onChip = (c) => { setQ(c); setFocus(true) }

  return (
    <section className="hx" id="top" ref={sect}>
      <div className="hx-bg" ref={bg}><img src="/assets/hero/pool.jpg" alt="" /></div>

      <div className="hx-corner tr">Bahía Blanca → {t.hero.eyebrow.includes('world') ? 'World' : 'Mundo'}<br />Est. 1970</div>

      <div className="hx-inner">
        <div className="hx-eyebrow eyebrow">[ {t.hero.eyebrow} ]</div>
        <h1 className="hx-title"><b>{t.hero.title1}</b><b>{t.hero.title2}</b></h1>
        <p className="hx-sub">{t.hero.sub}</p>

        <div className="hx-search">
          <div className="hx-bar">
            <span className="ai">C</span>
            <input className="hx-input" value={q} placeholder={t.hero.placeholder}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setFocus(true)} onBlur={() => setTimeout(() => setFocus(false), 200)}
              onKeyDown={(e) => e.key === 'Enter' && go()} data-cursor />
            <button className="hx-go" onClick={go} data-cursor aria-label="Buscar">
              <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          </div>

          {focus && q && (
            <div className="hx-results">
              {results.length ? results.map((p) => (
                <Link className="hx-result" key={p.id} data-cursor to={`/propiedad/${p.slug}`}>
                  <img src={p.img} alt="" referrerPolicy="no-referrer" />
                  <div><div className="rn">{p.title}</div><div className="rl">◦ {p.location} · {p.type}</div></div>
                  <div className="rp">{fmtPrice(p)}</div>
                </Link>
              )) : <div className="hx-empty">{t.hero.noresults} →</div>}
            </div>
          )}

          <div className="hx-chips">
            {t.hero.chips.map((c) => <button className="hx-chip" key={c} onClick={() => onChip(c)} data-cursor>{c}</button>)}
          </div>
        </div>

        <div className="hx-live"><span className="dot" /> +200 {t.hero.live}</div>
      </div>

      <div className="hx-cue"><span className="ln" />{t.hero.cue}</div>
    </section>
  )
}
