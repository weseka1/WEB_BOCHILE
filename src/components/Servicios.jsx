import { Link } from 'react-router-dom'
import { useLang } from '../i18n'
import { wa } from '../data/properties'

export default function Servicios() {
  const { t } = useLang()
  const dest = (s) => (s.to === 'wa' ? wa('Hola Bochile, quiero hacer una consulta.') : s.to)
  return (
    <section className="section wrap" id="servicios">
      <div className="sec-head">
        <h2 className="sec-title reveal">{t.svc.title1} {t.svc.title2}</h2>
        <p className="sec-sub reveal">{t.svc.sub}</p>
      </div>
      <div className="svc-grid">
        {t.svc.items.map((s, i) => {
          const d = dest(s)
          const internal = d.startsWith('/') || d.startsWith('#')
          const Comp = internal ? Link : 'a'
          const p = internal ? { to: d } : { href: d, target: '_blank', rel: 'noopener' }
          return (
            <Comp className="svc-cell" key={i} data-cursor {...p}>
              <div className="svc-top"><span className="svc-num mono">0{i + 1}</span><span className="svc-arrow">→</span></div>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
              <span className="svc-cta">{s.cta}<i className="svc-line" /></span>
            </Comp>
          )
        })}
      </div>
    </section>
  )
}
