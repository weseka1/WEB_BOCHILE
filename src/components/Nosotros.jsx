import { useState } from 'react'
import { useLang } from '../i18n'

// Dueños / equipo. PARA CARGAR LAS FOTOS REALES:
//   1) Guardá cada foto en  public/assets/team/<archivo>.jpg  (cuadrada, ~600px, queda recortada en círculo)
//   2) Completá name / role / photo acá abajo.
// Si la foto falta o falla, cae elegante a un monograma con la inicial (no se rompe nada).
const OWNERS = [
  { name: '', role: 'Dirección', photo: '/assets/team/owner-1.jpg' },
  { name: '', role: 'Ventas y tasaciones', photo: '/assets/team/owner-2.jpg' },
]

// Monograma: 2 iniciales si hay nombre; 1 sola letra si solo hay rol (placeholder).
const monogram = (o) => o.name
  ? o.name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  : (o.role || 'B').trim()[0].toUpperCase()

function Member({ o }) {
  const [ok, setOk] = useState(true)
  return (
    <figure className="nos-member reveal">
      <div className="nos-avatar">
        {o.photo && ok
          ? <img src={o.photo} alt={o.name || o.role} loading="lazy" onError={() => setOk(false)} />
          : <span className="nos-monogram" aria-hidden="true">{monogram(o)}</span>}
      </div>
      <figcaption>
        <b>{o.name || o.role}</b>
        {o.name && <span>{o.role}</span>}
      </figcaption>
    </figure>
  )
}

export default function Nosotros() {
  const { t } = useLang()
  const n = t.nosotros
  return (
    <section className="section wrap nos" id="nosotros">
      <div className="sec-head">
        <div>
          <div className="sec-kicker reveal">{n.kicker}</div>
          <h2 className="sec-title reveal">{n.title1} {n.title2}</h2>
        </div>
        <p className="sec-sub reveal">{n.sub}</p>
      </div>

      <div className="nos-story">
        <div className="nos-photo reveal">
          <img src="/assets/hero/exterior.jpg" alt="Bochile · Bahía Blanca" loading="lazy" />
          <span className="nos-since">{n.since}</span>
        </div>
        <div className="nos-text">
          {n.story.map((par, i) => <p className="reveal" key={i}>{par}</p>)}
        </div>
      </div>

      {/* Equipo OCULTO temporalmente hasta tener las fotos reales del equipo.
          PARA REACTIVAR: cargar las fotos en public/assets/team/ + completar OWNERS (arriba)
          y descomentar este bloque. */}
      {/*
      <div className="nos-team-head reveal">
        <h3>{n.teamHead}</h3>
        <span>{n.teamNote}</span>
      </div>
      <div className="nos-team">
        {OWNERS.map((o, i) => <Member o={o} key={i} />)}
      </div>
      */}

      <div className="nos-why">
        {n.why.map((w, i) => (
          <div className="nos-why-cell reveal" key={i}>
            <span className="nos-why-num mono">0{i + 1}</span>
            <h4>{w.t}</h4>
            <p>{w.d}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
