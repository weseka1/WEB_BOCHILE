import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

// Lightbox cinematográfico para recorridos en video (vertical-friendly).
// Reutilizable: ficha de propiedad + sección "Propiedades con video" del home.
// Props: videos [{label,src,poster}], start, poster (fallback), link {href,label} opcional, onClose.
export default function VideoLightbox({ videos, start = 0, poster, link, onClose }) {
  const [idx, setIdx] = useState(start)
  useEffect(() => {
    const k = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIdx((x) => (x + 1) % videos.length)
      if (e.key === 'ArrowLeft') setIdx((x) => (x - 1 + videos.length) % videos.length)
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [videos.length, onClose])

  const v = videos[idx]
  return (
    <div className="vlb" onClick={onClose}>
      <span className="lb-x" data-cursor>×</span>
      {videos.length > 1 && <span className="lb-nav prev" data-cursor onClick={(e) => { e.stopPropagation(); setIdx((x) => (x - 1 + videos.length) % videos.length) }}>‹</span>}
      <div className="vlb-stage" onClick={(e) => e.stopPropagation()}>
        {/* key={v.src} fuerza el remount al cambiar de video → autoplay del nuevo */}
        <video key={v.src} className="vlb-video" src={v.src} poster={v.poster || poster} controls autoPlay playsInline />
        {(videos.length > 1 || link) && (
          <div className="vlb-bar">
            {videos.length > 1 && (
              <div className="vlb-tabs">
                {videos.map((vid, k) => (
                  <button key={k} className={'vlb-tab' + (k === idx ? ' on' : '')} data-cursor onClick={(e) => { e.stopPropagation(); setIdx(k) }}>{vid.label || `Video ${k + 1}`}</button>
                ))}
              </div>
            )}
            {link && <Link className="vlb-link" to={link.href} data-cursor onClick={onClose}>{link.label} →</Link>}
          </div>
        )}
      </div>
      {videos.length > 1 && <span className="lb-nav next" data-cursor onClick={(e) => { e.stopPropagation(); setIdx((x) => (x + 1) % videos.length) }}>›</span>}
    </div>
  )
}
