import { useState } from 'react'
import { waTo } from '../data/properties'
import { useLang } from '../i18n'
import Dropdown from './Dropdown'

export default function Tasacion() {
  const { t } = useLang()
  const [f, setF] = useState({ nombre: '', tel: '', tipo: '', zona: '' })
  const on = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = (e) => {
    e.preventDefault()
    const msg = `Hola Camila, quiero solicitar una tasación.\n\nNombre: ${f.nombre}\nTeléfono: ${f.tel}\nTipo: ${f.tipo || '(a definir)'}\nZona: ${f.zona || '(a definir)'}\n\n¿Cuándo podrían tasarla?`
    window.open(waTo('tasaciones', msg), '_blank')
  }
  return (
    <section className="section wrap" id="tasacion">
      <div className="capta reveal">
        <div className="capta-glow" aria-hidden="true" />
        <div className="capta-grid">
          <div className="capta-copy">
            <div className="capta-badge"><span className="dot" />{t.tasa.badge}</div>
            <h2 className="capta-title">{t.tasa.title1} <em>{t.tasa.title2}</em></h2>
            <p className="capta-sub">{t.tasa.sub}</p>
            <ul className="capta-perks">
              {t.tasa.perks.map((p) => <li key={p}><i>✓</i>{p}</li>)}
            </ul>
          </div>

          <form className="capta-form" onSubmit={submit}>
            <div className="capta-form-head">{t.tasa.formhead}</div>
            <input placeholder={t.tasa.f.nombre} value={f.nombre} onChange={on('nombre')} required data-cursor />
            <input placeholder={t.tasa.f.tel} type="tel" value={f.tel} onChange={on('tel')} required data-cursor />
            <Dropdown value={f.tipo} onChange={(v) => setF({ ...f, tipo: v })} className="dd-form"
              options={[{ value: '', label: t.tasa.f.tipo }, ...t.tasa.f.opts.map((o) => ({ value: o, label: o }))]}
              placeholder={t.tasa.f.tipo} />
            <input placeholder={t.tasa.f.zona} value={f.zona} onChange={on('zona')} data-cursor />
            <button className="capta-cta" data-cursor type="submit">
              {t.tasa.submit}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
            <span className="capta-note">{t.tasa.note}</span>
          </form>
        </div>
      </div>
    </section>
  )
}
