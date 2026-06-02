import { Link } from 'react-router-dom'
import { PROPERTIES } from '../data/properties'
import { useLang } from '../i18n'
import PropertyCard from './PropertyCard'

export default function FeaturedProps() {
  const { t } = useLang()
  const featured = PROPERTIES.filter((p) => p.op === 'sale').slice(0, 6)
  return (
    <section className="section wrap" id="propiedades">
      <div className="sec-head">
        <h2 className="sec-title reveal">{t.props.title1} {t.props.title2}</h2>
        <p className="sec-sub reveal">{t.props.sub}</p>
      </div>
      <div className="feat-grid">
        {featured.map((p) => <PropertyCard key={p.id} p={p} />)}
      </div>
      <Link className="viewall reveal" to="/propiedades" data-cursor>
        {t.props.viewall}
        <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </Link>
    </section>
  )
}
