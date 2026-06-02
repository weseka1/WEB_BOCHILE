import { Link } from 'react-router-dom'
import { wa } from '../data/properties'
import { useLang } from '../i18n'

export default function Contacto() {
  const { t } = useLang()
  const c = t.contact
  return (
    <>
      <section className="contact" id="contacto">
        <div className="wrap">
          <h2 className="contact-big reveal">{c.title1}<br />{c.title2}</h2>
          <a className="pill green" data-cursor style={{ marginTop: 36 }} target="_blank" rel="noopener"
            href={wa('Hola, quiero hacer una consulta sobre una propiedad.')}>{c.cta}</a>
          <div className="contact-rows">
            <span>{c.address}</span>
            <a href={`tel:+54291${c.phones[0].replace(/\D/g, '').slice(3)}`} data-cursor>{c.phones[0]}</a>
            <a href={`mailto:${c.email}`} data-cursor>{c.email}</a>
            <span>{c.hours}</span>
          </div>
        </div>
      </section>

      <footer className="foot">
        <div className="wrap">
          <div className="foot-grid">
            <div className="foot-brand">
              <div className="logo">
                <svg viewBox="0 0 22 28"><rect x="0" y="9" width="4.5" height="19" /><rect x="8.75" y="0" width="4.5" height="28" /><rect x="17.5" y="5" width="4.5" height="23" /></svg>
                BOCHILE <small>Real Estate</small>
              </div>
              <p>{t.footer.rights}</p>
            </div>
            <div className="foot-col">
              <h5>{t.cat.title}</h5>
              <Link to="/propiedades?op=sale" data-cursor>{t.cat.sale}</Link>
              <Link to="/propiedades?op=rent" data-cursor>{t.cat.rent}</Link>
              <Link to="/#tasacion" data-cursor>{t.nav.tasaciones}</Link>
            </div>
            <div className="foot-col">
              <h5>Bochile</h5>
              <Link to="/#camila" data-cursor>Camila</Link>
              <Link to="/#contacto" data-cursor>{t.nav.contacto}</Link>
              <a href="https://www.instagram.com/bochile_inmobiliaria" target="_blank" rel="noopener" data-cursor>Instagram</a>
              <a href="https://www.facebook.com/bochileinmobiliaria" target="_blank" rel="noopener" data-cursor>Facebook</a>
            </div>
            <div className="foot-col">
              <h5>{t.nav.contacto}</h5>
              {c.phones.map((p) => <a key={p} href={`tel:+54291${p.replace(/\D/g, '').slice(3)}`} data-cursor>{p}</a>)}
              <a href={`mailto:${c.email}`} data-cursor>{c.email}</a>
              <span style={{ color: 'var(--soft)', fontSize: '.9rem', display: 'block', marginBottom: 11 }}>{c.address}</span>
              <span style={{ color: 'var(--mute)', fontSize: '.84rem', display: 'block' }}>{c.hours}</span>
            </div>
          </div>
          <div className="foot-bar2">
            <span>© 2026 Inmobiliaria Bochile</span>
            <span>{t.footer.made}</span>
          </div>
        </div>
      </footer>
    </>
  )
}
