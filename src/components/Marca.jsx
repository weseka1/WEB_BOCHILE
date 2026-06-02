import { useLang } from '../i18n'

export default function Marca() {
  const { t } = useLang()
  return (
    <section className="marca" id="marca">
      <div className="marca-bg"><img src="/assets/hero/salon.jpg" alt="" /></div>
      <div className="marca-inner wrap">
        <div className="marca-tag reveal">{t.marca.tag}</div>
        <h2 className="marca-quote reveal">{t.marca.quote}</h2>
        <p className="marca-sub reveal">{t.marca.sub}</p>
      </div>
    </section>
  )
}
