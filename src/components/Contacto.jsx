import { Link } from 'react-router-dom'
import { wa, waTo, waAreaMsg } from '../data/properties'
import { useLang } from '../i18n'

const WaIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.601 5.391l-.998 3.648 3.896-.738zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>
)

export default function Contacto() {
  const { lang, t } = useLang()
  const c = t.contact
  return (
    <>
      <section className="contact" id="contacto">
        <div className="wrap">
          <h2 className="contact-big reveal">{c.title1}<br />{c.title2}</h2>
          <a className="pill green" data-cursor style={{ marginTop: 36 }} target="_blank" rel="noopener"
            href={wa('Hola, quiero hacer una consulta sobre una propiedad.')}>{c.cta}</a>

          <div className="contact-wa">
            <div className="contact-wa-head">{t.waMenu.title} · <span>WhatsApp</span></div>
            <div className="contact-wa-grid">
              {['ventas', 'alquileres', 'tasaciones', 'general'].map((a) => (
                <a key={a} className="contact-wa-btn" data-cursor target="_blank" rel="noopener"
                  href={waTo(a, waAreaMsg(a, lang))}>
                  <WaIcon />
                  <span><small>WhatsApp</small>{t.waMenu[a]}</span>
                  <i aria-hidden="true">→</i>
                </a>
              ))}
            </div>
          </div>

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
            <span>© 2026 Bochile Real Estate</span>
            <span>{t.footer.made}</span>
          </div>
        </div>
      </footer>
    </>
  )
}
