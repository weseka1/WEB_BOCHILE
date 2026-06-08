import { useState } from 'react'
import { Link } from 'react-router-dom'
import { fmtPrice } from '../data/properties'
import { useProperties } from '../lib/PropertiesProvider'
import { useLang } from '../i18n'
import PropertyCard from './PropertyCard'
import VideoLightbox from './VideoLightbox'

const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
)
const PlayIcon = () => (<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>)

// Propiedad ESTRELLA — card grande horizontal (imagen + ficha premium).
// Si la propiedad tiene recorrido en video, el spotlight muestra el play y reproduce
// Exterior/Interior en el lightbox (así Destacadas soporta videos).
function Spotlight({ p }) {
  const { t } = useLang()
  const [open, setOpen] = useState(false)
  const beds = 'dorm.'
  const hasVideo = p.videos?.length > 0
  return (
    <article className="spot reveal" data-cursor>
      <Link className="spot-link" to={`/propiedad/${p.slug}`} aria-label={p.title} />
      <div className="spot-media">
        <img src={hasVideo ? (p.videos[0].poster || p.img) : p.img} alt={p.title} loading="lazy" referrerPolicy="no-referrer" />
        {hasVideo && (
          <button className="spot-play" data-cursor aria-label={`${t.detail.videoTour} · ${p.title}`}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true) }}>
            <span className="spot-play-ic"><PlayIcon /></span>
            <span className="spot-play-label">{t.detail.videoTour}{p.videos.length > 1 ? ` · ${p.videos.length}` : ''}</span>
          </button>
        )}
        {p.images.length > 1 && <span className="spot-photos">⊞ {p.images.length} {t.props.photos}</span>}
      </div>
      <div className="spot-body">
        <div className="spot-kicker">{t.props.star}</div>
        <h3 className="spot-name">{p.title}</h3>
        <div className="spot-loc">◦ {p.location}{p.address ? ' · ' + p.address : ''}</div>
        <div className="spot-price">{fmtPrice(p)}</div>
        <div className="spot-specs">
          {p.beds != null && <div><b>{p.beds}</b>{beds}</div>}
          {p.area != null && <div><b>{p.area} m²</b>sup.</div>}
          <div><b>{p.type}</b>tipo</div>
        </div>
        <span className="spot-cta">{t.props.viewprop} <Arrow /></span>
      </div>
      {open && <VideoLightbox videos={p.videos} start={0} poster={p.img} link={{ href: `/propiedad/${p.slug}`, label: t.props.viewprop }} onClose={() => setOpen(false)} />}
    </article>
  )
}

export default function FeaturedProps() {
  const { t } = useLang()
  const { featured, loading } = useProperties()
  const [hero, ...rest] = featured
  return (
    <section className="section wrap" id="propiedades">
      <div className="sec-head">
        <div>
          <div className="sec-kicker reveal">{t.props.kicker}</div>
          <h2 className="sec-title reveal">{t.props.title1} {t.props.title2}</h2>
        </div>
        <p className="sec-sub reveal">{t.props.sub}</p>
      </div>

      {loading && featured.length === 0 ? (
        <>
          <div className="spot skel-spot" aria-hidden="true" />
          <div className="feat-grid">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skel-card" aria-hidden="true" />)}
          </div>
        </>
      ) : (
        <>
          {hero && <Spotlight p={hero} />}
          <div className="feat-grid">
            {rest.map((p) => <PropertyCard key={p.id} p={p} />)}
          </div>
        </>
      )}

      <Link className="viewall reveal" to="/propiedades" data-cursor>
        {t.props.viewall} <Arrow />
      </Link>
    </section>
  )
}
