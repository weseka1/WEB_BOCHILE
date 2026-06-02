import { useLang } from '../i18n'

export default function PropertyMap({ p }) {
  const { t } = useLang()
  // query geocodificable: calle (si hay) + la ciudad REAL de la propiedad + provincia. NO hardcodear Bahía Blanca.
  const query = `${p.address ? p.address + ', ' : ''}${p.location}, Buenos Aires, Argentina`
  const q = encodeURIComponent(query)
  const embed = `https://maps.google.com/maps?hl=es&q=${q}&z=16&output=embed`
  const maps = `https://www.google.com/maps/search/?api=1&query=${q}`
  const street = `https://www.google.com/maps?q=${q}&layer=c&cbll=`
  const dirs = `https://www.google.com/maps/dir/?api=1&destination=${q}`

  return (
    <>
      <div className="detail-h">{t.detail.location}</div>
      <div className="pmap">
        <div className="pmap-head">
          <span className="dot" />
          <span className="ad"><small>{t.detail.location}</small>{p.address ? `${p.address} · ${p.location}` : p.location}</span>
          <div className="pmap-actions">
            <a href={street} target="_blank" rel="noopener" data-cursor>◉ {t.detail.streetview}</a>
            <a href={dirs} target="_blank" rel="noopener" data-cursor>↗ {t.detail.directions}</a>
            <a href={maps} target="_blank" rel="noopener" data-cursor className="primary">{t.detail.maps}</a>
          </div>
        </div>
        <div className="pmap-frame">
          <iframe title="map" src={embed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
        </div>
      </div>
      <div className="di-note" style={{ textAlign: 'left', marginTop: 10 }}>{t.detail.mapnote}</div>
    </>
  )
}
