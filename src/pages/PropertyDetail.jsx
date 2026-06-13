import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { findInList, fromRow, fmtPrice, waTo } from '../data/properties'
import { useProperties } from '../lib/PropertiesProvider'
import { supabase, hasSupabase } from '../lib/supabase'
import { useLang } from '../i18n'
import PropertyMap from '../components/PropertyMap'
import VideoLightbox from '../components/VideoLightbox'

const WaIcon = () => (<svg viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.601 5.391l-.998 3.648 3.896-.738zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>)
const PlayIcon = () => (<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>)

export default function PropertyDetail() {
  const { slug } = useParams()
  const { t } = useLang()
  const { properties } = useProperties()
  const fromList = findInList(properties, slug)
  const [full, setFull] = useState(null)   // fila completa (con descripción) traída aparte
  const [checking, setChecking] = useState(true)
  const p = full || fromList                // mostramos lo del catálogo al instante; la descripción llega después
  const [i, setI] = useState(0)
  const [lb, setLb] = useState(-1)
  const [vlb, setVlb] = useState(-1)   // recorrido en video abierto (índice) · -1 = cerrado

  useEffect(() => { setI(0); setVlb(-1); window.scrollTo(0, 0) }, [slug])

  // Traemos la fila completa (descripción + todo) por slug. Funciona aunque la
  // propiedad sea nueva y todavía no esté en el catálogo local.
  useEffect(() => {
    setFull(null); setChecking(true)
    if (!hasSupabase) { setChecking(false); return }
    let alive = true
    supabase.from('properties').select('*').eq('slug', slug).eq('published', true).maybeSingle()
      .then(({ data }) => { if (!alive) return; if (data) setFull(fromRow(data)); setChecking(false) })
      .catch(() => { if (alive) setChecking(false) })
    return () => { alive = false }
  }, [slug])
  useEffect(() => {
    if (lb < 0) return
    const k = (e) => { if (e.key === 'Escape') setLb(-1); if (e.key === 'ArrowRight') setLb((x) => (x + 1) % p.images.length); if (e.key === 'ArrowLeft') setLb((x) => (x - 1 + p.images.length) % p.images.length) }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [lb, p])

  if (!p) return (
    <div className="detail">
      <div className="detail-top"><Link className="detail-back" to="/propiedades">← {t.detail.back}</Link></div>
      <div className="cat-empty">{checking ? '…' : t.detail.notfound}</div>
    </div>
  )

  const imgs = p.images
  const videos = p.videos || []
  const hasVideo = videos.length > 0
  const go = (d) => setI((x) => (x + d + imgs.length) % imgs.length)
  const propUrl = p.slug ? `https://bochile.com/propiedad/${p.slug}` : (p.url || '')
  const msg = `Hola, me interesa esta propiedad:\n"${p.title}"\n${propUrl}\n¿Sigue disponible?`

  return (
    <div className="detail">
      <div className="detail-top">
        <Link className="detail-back" to="/propiedades">← {t.detail.back}</Link>
        <div className="detail-tags">
          {hasVideo && <span className="detail-tag detail-tag-video"><i className="dt-dot" /> Video</span>}
          <span className="detail-tag">{p.op === 'sale' ? t.cat.sale : t.cat.rent}</span>
          <span className="detail-tag">{p.type}</span>
          {imgs.length > 0 && <span className="detail-tag">{imgs.length} {t.detail.photos}</span>}
        </div>
      </div>

      <div className="detail-hero">
        <div className="gallery">
          {imgs.length === 0 ? (
            <div className="gal-main gal-noimg" aria-hidden="true">
              <svg viewBox="0 0 22 28"><rect x="0" y="9" width="4.5" height="19" /><rect x="8.75" y="0" width="4.5" height="28" /><rect x="17.5" y="5" width="4.5" height="23" /></svg>
              <span>{t.cat.noPhoto}</span>
            </div>
          ) : (<>
          <div className="gal-main" onClick={() => setLb(i)}>
            <img src={imgs[i]} alt={p.title} referrerPolicy="no-referrer" />
            {/* Recorrido en video integrado en la galería (abre el lightbox de video) */}
            {hasVideo && (
              <button className="gal-vbtn" data-cursor onClick={(e) => { e.stopPropagation(); setVlb(0) }}>
                <span className="gal-vbtn-ic"><PlayIcon /></span>
                {t.detail.videoTour}{videos.length > 1 ? ` · ${videos.length}` : ''}
              </button>
            )}
            {imgs.length > 1 && <>
              <button className="gal-nav prev" data-cursor onClick={(e) => { e.stopPropagation(); go(-1) }}>‹</button>
              <button className="gal-nav next" data-cursor onClick={(e) => { e.stopPropagation(); go(1) }}>›</button>
            </>}
            <span className="gal-count">{i + 1} / {imgs.length}</span>
          </div>
          <div className="gal-thumbs">
            {imgs.slice(0, 12).map((src, k) => (
              <img key={k} src={src} alt="" referrerPolicy="no-referrer" className={k === i ? 'on' : ''} data-cursor onClick={() => setI(k)} />
            ))}
          </div>
          </>)}
        </div>

        <aside className="detail-info">
          <div className="di-price">{fmtPrice(p)}</div>
          <h1 className="di-title">{p.title}</h1>
          <div className="di-loc">◦ {p.location}{p.address ? <><br />{p.address}</> : ''}</div>
          <div className="di-specs">
            {(p.areaTotal ?? p.area) != null && <div><b>{(p.areaTotal ?? p.area)} m²</b><span>{t.detail.area}</span></div>}
            {p.beds != null && <div><b>{p.beds}</b><span>{t.detail.beds}</span></div>}
            {p.baths != null && <div><b>{p.baths}</b><span>{t.detail.baths}</span></div>}
            <div><b>{p.type}</b><span>{t.detail.type}</span></div>
          </div>
          <a className="di-wa" data-cursor target="_blank" rel="noopener" href={waTo(p.op === 'rent' ? 'alquileres' : 'ventas', msg)}><WaIcon /> {t.detail.consultar}</a>
          <div className="di-note">{t.detail.note}</div>
        </aside>
      </div>

      <div className="detail-body">
        {/* RECORRIDO EN VIDEO — cards verticales (estilo recorrido inmobiliario) */}
        {hasVideo && <>
          <div className="detail-h">{t.detail.videoTour}{videos.length > 1 ? ` · ${videos.length}` : ''}</div>
          <div className="vtour-grid">
            {videos.map((v, k) => (
              <button key={k} className="vtour-card" data-cursor onClick={() => setVlb(k)} aria-label={`${t.detail.videoTour}${v.label ? ' · ' + v.label : ''}`}>
                <img src={v.poster || p.img} alt="" referrerPolicy="no-referrer" />
                <span className="vtour-shade" aria-hidden="true" />
                <span className="vtour-play" aria-hidden="true"><PlayIcon /></span>
                {v.label && <span className="vtour-label">{v.label}</span>}
                <span className="vtour-kicker">{t.detail.videoTour}</span>
              </button>
            ))}
          </div>
        </>}

        {p.description && <>
          <div className="detail-h">{t.detail.description}</div>
          <div className="detail-desc">{p.description}</div>
        </>}
        {p.features?.length > 0 && <>
          <div className="detail-h">{t.detail.features}</div>
          <div className="detail-feats">{p.features.map((f, k) => <span key={k}>{f}</span>)}</div>
        </>}

        <PropertyMap p={p} />
        {imgs.length > 1 && <>
          <div className="detail-h">{t.detail.allphotos} · {imgs.length}</div>
          <div className="detail-allgrid">
            {imgs.map((src, k) => <img key={k} src={src} alt="" referrerPolicy="no-referrer" data-cursor onClick={() => setLb(k)} />)}
          </div>
        </>}
      </div>

      {lb >= 0 && (
        <div className="lightbox" onClick={() => setLb(-1)}>
          <span className="lb-x" data-cursor>×</span>
          <span className="lb-nav prev" data-cursor onClick={(e) => { e.stopPropagation(); setLb((x) => (x - 1 + imgs.length) % imgs.length) }}>‹</span>
          <img src={imgs[lb]} alt="" referrerPolicy="no-referrer" onClick={(e) => e.stopPropagation()} />
          <span className="lb-nav next" data-cursor onClick={(e) => { e.stopPropagation(); setLb((x) => (x + 1) % imgs.length) }}>›</span>
          <span className="lb-count">{lb + 1} / {imgs.length}</span>
        </div>
      )}

      {vlb >= 0 && <VideoLightbox videos={videos} start={vlb} poster={p.img} onClose={() => setVlb(-1)} />}
    </div>
  )
}
